import os
import uuid
import json
import time
from fastapi import FastAPI, UploadFile, File, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, Any, Optional
from dotenv import load_dotenv

from file_processor import extract_text_from_pdf, extract_text_from_docx
from resume_parser import HeuristicResumeParser, AIResumeParser
from ai_analyzer import AIAnalyzer

# Load environment variables
load_dotenv()

# Initialize FastAPI App
app = FastAPI(
    title="AI Resume Analyzer API",
    description="Week 2 Foundation Backend: File Upload, Text Extraction, and Structure Parsing",
    version="1.0.0"
)

# CORS Configuration - essential for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for local development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Directories for uploads and extracted JSONs
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOAD_DIR = os.path.join(BASE_DIR, "uploads")
EXTRACTED_DIR = os.path.join(BASE_DIR, "extracted")

# Ensure directories exist
os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(EXTRACTED_DIR, exist_ok=True)

# Max file size: 5 MB in bytes
MAX_FILE_SIZE = 5 * 1024 * 1024
SUPPORTED_EXTENSIONS = {".pdf", ".docx"}

@app.get("/")
def read_root():
    return {
        "status": "healthy",
        "message": "AI Resume Analyzer Backend is running.",
        "version": "1.0.0"
    }

@app.post("/upload")
async def upload_resume(file: UploadFile = File(...)):
    """
    Upload a resume file (PDF/DOCX), validate it, extract text, 
    parse structure, store raw+parsed data, and return structured JSON.
    """
    # 1. Validate File Name & Extension
    filename = file.filename
    _, ext = os.path.splitext(filename.lower())
    if ext not in SUPPORTED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported format! Only PDF and DOCX files are allowed. Received: {ext}"
        )

    # 2. Validate File Size
    # Read size dynamically to handle in-memory stream boundaries
    try:
        content = await file.read()
        file_size = len(content)
        if file_size > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File too large! Maximum allowed size is 5 MB. Received: {file_size / (1024 * 1024):.2f} MB"
            )
        if file_size == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="The uploaded file is empty."
            )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error reading uploaded file: {str(e)}"
        )

    # Generate unique ID for this upload run
    unique_id = str(uuid.uuid4())[:8]  # Short UUID
    unique_filename = f"{unique_id}_{filename}"
    upload_file_path = os.path.join(UPLOAD_DIR, unique_filename)

    # 3. Save File to uploads/
    try:
        with open(upload_file_path, "wb") as f:
            f.write(content)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save uploaded file on server: {str(e)}"
        )

    # 4. Extract Text
    raw_text = ""
    try:
        if ext == ".pdf":
            raw_text = extract_text_from_pdf(upload_file_path)
        elif ext == ".docx":
            raw_text = extract_text_from_docx(upload_file_path)
    except ValueError as ve:
        # Catch extraction-specific errors (corruption, empty text, scanned-only PDF)
        if os.path.exists(upload_file_path):
            os.remove(upload_file_path)  # Cleanup invalid files
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(ve)
        )
    except Exception as e:
        if os.path.exists(upload_file_path):
            os.remove(upload_file_path)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process text extraction: {str(e)}"
        )

    # 5. Parse Text using AI Parser Engine (Gemini)
    try:
        parser = AIResumeParser()
        parsed_data = parser.parse(raw_text)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error parsing resume structured content: {str(e)}"
        )

    # 5b. Gemini AI Analysis
    try:
        analyzer = AIAnalyzer()
        ai_analysis = analyzer.analyze_resume(raw_text, parsed_data)
    except ValueError as ve:
        # Catch validation/setup issues (e.g. missing API Key) and return HTTP 400
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(ve)
        )
    except Exception as e:
        # Catch API failures and return HTTP 500
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"AI analysis failed to complete: {str(e)}"
        )

    # Prepare response data structure
    response_payload = {
        "success": True,
        "filename": filename,
        "metadata": {
            "file_id": unique_id,
            "size_bytes": file_size,
            "content_type": file.content_type,
            "extracted_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
        },
        "raw_text": raw_text,
        "parsed_data": parsed_data,
        "ai_analysis": ai_analysis
    }

    # 6. Save Response Payload (JSON) to extracted/
    extracted_json_path = os.path.join(EXTRACTED_DIR, f"{unique_id}.json")
    try:
        with open(extracted_json_path, "w", encoding="utf-8") as json_file:
            json.dump({
                "raw_text": raw_text,
                "parsed_data": parsed_data,
                "ai_analysis": ai_analysis
            }, json_file, indent=2, ensure_ascii=False)
    except Exception as e:
        # Non-fatal error for the user but log it
        print(f"Warning: Failed to save extracted JSON payload: {str(e)}")

    return response_payload


class ATSAnalysisRequest(BaseModel):
    file_id: str
    target_role: str
    experience_level: str
    job_description: Optional[str] = ""


@app.post("/ats_analyze")
async def ats_analyze(payload: ATSAnalysisRequest):
    """
    Run ATS analysis for a previously uploaded and parsed resume file.
    """
    file_id = payload.file_id
    extracted_json_path = os.path.join(EXTRACTED_DIR, f"{file_id}.json")

    if not os.path.exists(extracted_json_path):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Parsed resume data with file ID '{file_id}' not found. Please upload the file again."
        )

    try:
        with open(extracted_json_path, "r", encoding="utf-8") as f:
            resume_data = json.load(f)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to load parsed resume data: {str(e)}"
        )

    try:
        from ats_analyzer import ATSAnalyzer
        analyzer = ATSAnalyzer()
        report = analyzer.analyze(
            resume_data=resume_data,
            target_role=payload.target_role,
            experience_level=payload.experience_level,
            job_description=payload.job_description
        )
        return {
            "success": True,
            "report": report
        }
    except ValueError as ve:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(ve)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"ATS analysis execution failed: {str(e)}"
        )

