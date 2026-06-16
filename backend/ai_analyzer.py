import os
import json
import re
from typing import Dict, Any, List
from google import genai
from google.genai import types
from dotenv import load_dotenv

from prompts import CONSOLIDATED_ANALYSIS_PROMPT_TEMPLATE

class AIAnalyzer:
    """
    Centralized AI Service Layer for Gemini API Resume Analysis.
    Configures the modern client, sends formatted prompt payloads, validates JSON formats,
    and handles service errors.
    """
    def __init__(self):
        load_dotenv()
        self.api_key = os.getenv("GEMINI_API_KEY")
        if not self.api_key or not self.api_key.strip():
            raise ValueError(
                "GEMINI_API_KEY is missing or empty. Please open backend/.env and add your valid Gemini API key "
                "to execute candidate analysis."
            )
        
        # Initialize modern Gemini Client
        self.client = genai.Client(api_key=self.api_key)
        self.model_name = os.getenv("GEMINI_MODEL", "gemini-2.5-flash-lite")

    def _call_gemini_json(self, prompt: str) -> Dict[str, Any]:
        """
        Private helper to request content generation from Gemini and parse the response as JSON.
        """
        try:
            response = self.client.models.generate_content(
                model=self.model_name,
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json"
                )
            )
            text = response.text.strip()
            
            # Clean up markdown codeblocks if they sneak through
            if text.startswith("```"):
                text = re.sub(r"^```(?:json)?\n", "", text)
                text = re.sub(r"\n```$", "", text)
                text = text.strip()
                
            return json.loads(text)
        except json.JSONDecodeError as je:
            raise ValueError(
                f"Failed to parse Gemini response as a structured JSON object: {str(je)}.\n"
                f"Raw Response received: {response.text if hasattr(response, 'text') else str(response)}"
            )
        except Exception as e:
            raise Exception(f"Gemini service execution error: {str(e)}")

    def analyze_resume(self, raw_text: str, parsed_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Triggers a consolidated Gemini query for professional summary, skills, strengths, weaknesses,
        and projects in a single round-trip.
        """
        import json
        
        prompt = CONSOLIDATED_ANALYSIS_PROMPT_TEMPLATE.format(
            name=parsed_data.get("name", ""),
            skills=json.dumps(parsed_data.get("skills", []) + parsed_data.get("technical_skills", [])),
            education=json.dumps(parsed_data.get("education", [])),
            experience=json.dumps(parsed_data.get("experience", [])),
            internships=json.dumps(parsed_data.get("internships", [])),
            projects=json.dumps(parsed_data.get("projects", [])),
            certifications=json.dumps(parsed_data.get("certifications", [])),
            achievements=json.dumps(parsed_data.get("achievements", [])),
            raw_text=raw_text
        )
        
        res = self._call_gemini_json(prompt)
        
        # Validate keys in the response
        required_keys = ["summary", "technical_skills", "soft_skills", "strengths", "weaknesses", "projects"]
        for key in required_keys:
            if key not in res:
                raise ValueError(f"Validation Failed: Consolidated AI response is missing the required '{key}' key.")
                
        return res
