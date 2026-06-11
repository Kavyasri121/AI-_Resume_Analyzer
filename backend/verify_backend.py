import os
import json
import urllib.request
import urllib.error

def upload_file(file_path):
    url = "http://127.0.0.1:8000/upload"
    filename = os.path.basename(file_path)
    
    # Check mime type
    if filename.endswith(".pdf"):
        content_type = "application/pdf"
    elif filename.endswith(".docx"):
        content_type = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    else:
        content_type = "application/octet-stream"

    # Read file content
    with open(file_path, "rb") as f:
        file_content = f.read()

    # Construct multipart/form-data payload
    boundary = "----WebKitFormBoundary7MA4YWxkTrZu0gW"
    
    parts = []
    parts.append(f"--{boundary}".encode('utf-8'))
    parts.append(f'Content-Disposition: form-data; name="file"; filename="{filename}"'.encode('utf-8'))
    parts.append(f'Content-Type: {content_type}\r\n'.encode('utf-8'))
    parts.append(file_content)
    parts.append(f"--{boundary}--".encode('utf-8'))
    
    body = b"\r\n".join(parts)
    
    req = urllib.request.Request(url, data=body)
    req.add_header("Content-Type", f"multipart/form-data; boundary={boundary}")
    req.add_header("Content-Length", str(len(body)))
    
    try:
        with urllib.request.urlopen(req) as response:
            res_body = response.read().decode('utf-8')
            return json.loads(res_body)
    except urllib.error.HTTPError as e:
        print(f"HTTP Error {e.code}: {e.read().decode('utf-8')}")
        return None
    except Exception as e:
        print(f"Error connecting to backend: {str(e)}")
        return None

def verify_all():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    pdf_path = os.path.join(base_dir, "test_resume.pdf")
    docx_path = os.path.join(base_dir, "test_resume.docx")
    
    print("==================================================")
    print("VERIFYING BACKEND ENDPOINTS AND PARSER FOUNDATION")
    print("==================================================")
    
    # 1. Test PDF upload
    print(f"\n1. Uploading PDF: {os.path.basename(pdf_path)}")
    pdf_res = upload_file(pdf_path)
    if pdf_res:
        print("[SUCCESS] PDF Upload Successful!")
        print(f"   Filename: {pdf_res.get('filename')}")
        metadata = pdf_res.get('metadata', {})
        print(f"   File ID: {metadata.get('file_id')}")
        print(f"   Size: {metadata.get('size_bytes')} bytes")
        parsed = pdf_res.get('parsed_data', {})
        print(f"   Parsed Name: {parsed.get('name')}")
        print(f"   Parsed Email: {parsed.get('email')}")
        print(f"   Parsed Phone: {parsed.get('phone')}")
        print(f"   Parsed Skills Count: {len(parsed.get('skills', []))}")
        print(f"   Parsed Experience Count: {len(parsed.get('experience', []))}")
        print(f"   Parsed Education Count: {len(parsed.get('education', []))}")
        
        # Verify JSON Storage
        extracted_file = os.path.join(base_dir, "extracted", f"{metadata.get('file_id')}.json")
        if os.path.exists(extracted_file):
            print(f"[SUCCESS] Combined JSON stored under: backend/extracted/{metadata.get('file_id')}.json")
        else:
            print("[FAIL] Failed to verify JSON file storage.")
    else:
        print("[FAIL] PDF Upload failed.")
        
    # 2. Test DOCX upload
    print(f"\n2. Uploading DOCX: {os.path.basename(docx_path)}")
    docx_res = upload_file(docx_path)
    if docx_res:
        print("[SUCCESS] DOCX Upload Successful!")
        print(f"   Filename: {docx_res.get('filename')}")
        metadata = docx_res.get('metadata', {})
        print(f"   File ID: {metadata.get('file_id')}")
        parsed = docx_res.get('parsed_data', {})
        print(f"   Parsed Name: {parsed.get('name')}")
        print(f"   Parsed Email: {parsed.get('email')}")
        print(f"   Parsed Phone: {parsed.get('phone')}")
        print(f"   Parsed Projects Count: {len(parsed.get('projects', []))}")
        
        # Verify Upload Storage
        uploads_dir = os.path.join(base_dir, "uploads")
        uploaded_files = os.listdir(uploads_dir)
        matching = [f for f in uploaded_files if metadata.get('file_id') in f]
        if matching:
            print(f"[SUCCESS] Original file saved under: backend/uploads/{matching[0]}")
        else:
            print("[FAIL] Original upload file not found in uploads folder.")
    else:
        print("[FAIL] DOCX Upload failed.")
        
    # 3. Test validation - size/format errors
    print("\n3. Testing format validation (Uploading invalid file: create_test_pdf.py)...")
    invalid_path = os.path.join(base_dir, "create_test_pdf.py")
    invalid_res = upload_file(invalid_path)
    if invalid_res is None:
        print("[SUCCESS] Validation Working: Rejected invalid .py file format.")
    else:
        print("[FAIL] Validation Fail: Allowed invalid .py file upload!")

    print("\n==================================================")
    print("Verification Completed.")
    print("==================================================")

if __name__ == "__main__":
    verify_all()
