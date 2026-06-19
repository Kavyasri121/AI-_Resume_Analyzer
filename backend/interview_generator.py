# AI Interview Questions Generator Engine

import os
import json
import re
from typing import Dict, Any, List
from google import genai
from google.genai import types
from dotenv import load_dotenv

from interview_prompts import INTERVIEW_GENERATOR_PROMPT

class InterviewGenerator:
    """
    Interview Preparation Generator.
    Generates personalized, recruiter-grade, realistic interview questions and readiness reports.
    """
    def __init__(self):
        load_dotenv()
        self.api_key = os.getenv("GEMINI_API_KEY")
        if not self.api_key or not self.api_key.strip():
            raise ValueError(
                "GEMINI_API_KEY is missing or empty. Please add your key to backend/.env."
            )
        
        self.client = genai.Client(api_key=self.api_key)
        self.model_name = os.getenv("GEMINI_MODEL", "gemini-2.5-flash-lite")

    def generate(self, resume_data: Dict[str, Any], ats_report: Dict[str, Any], target_role: str, experience_level: str, job_description: str = None) -> Dict[str, Any]:
        """
        Generates the interview preparation report.
        """
        parsed_data = resume_data.get("parsed_data", {})
        ai_analysis = resume_data.get("ai_analysis", {})

        # Extract skills
        parsed_skills = parsed_data.get("skills", [])
        ai_tech_skills = ai_analysis.get("technical_skills", [])
        ai_soft_skills = ai_analysis.get("soft_skills", [])

        # Format experience & projects context
        experience_list = parsed_data.get("experience", [])
        internship_list = parsed_data.get("internships", [])
        projects_ai = ai_analysis.get("projects", [])

        projects_and_exp = []
        
        if projects_ai:
            projects_and_exp.append("Projects:")
            for p in projects_ai:
                title = p.get("title", "Project")
                desc = p.get("description", "")
                techs = ", ".join(p.get("technologies", []))
                projects_and_exp.append(f"  - {title} (Tech: {techs}): {desc}")
                
        if experience_list:
            projects_and_exp.append("Work Experience:")
            for exp in experience_list:
                projects_and_exp.append(f"  - {exp}")
                
        if internship_list:
            projects_and_exp.append("Internships:")
            for intern in internship_list:
                projects_and_exp.append(f"  - {intern}")

        resume_projects_and_exp_str = "\n".join(projects_and_exp) if projects_and_exp else "None listed"

        # ATS metrics
        ats_score = ats_report.get("ats_score", 0)
        ats_missing_skills = ats_report.get("missing_skills", [])
        ats_missing_keywords = ats_report.get("missing_keywords", [])

        # Compile AI prompt
        prompt = INTERVIEW_GENERATOR_PROMPT.format(
            target_role=target_role,
            experience_level=experience_level,
            job_description=job_description if job_description else "Not Provided",
            parsed_skills=", ".join(parsed_skills) if parsed_skills else "None",
            ai_tech_skills=", ".join(ai_tech_skills) if ai_tech_skills else "None",
            ai_soft_skills=", ".join(ai_soft_skills) if ai_soft_skills else "None",
            resume_projects_and_exp=resume_projects_and_exp_str,
            ats_missing_skills=", ".join(ats_missing_skills) if ats_missing_skills else "None",
            ats_missing_keywords=", ".join(ats_missing_keywords) if ats_missing_keywords else "None",
            ats_score=ats_score
        )

        # Call Gemini API
        try:
            response = self.client.models.generate_content(
                model=self.model_name,
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    max_output_tokens=8192
                )
            )
            text = response.text.strip()
            
            # Clean markdown JSON block wrappers if present
            if text.startswith("```"):
                text = re.sub(r"^```(?:json)?\n", "", text)
                text = re.sub(r"\n```$", "", text)
                text = text.strip()
                
            return json.loads(text)
        except json.JSONDecodeError as je:
            # Fallback mock report structure if JSON parsing fails
            return self._get_fallback_report(target_role, experience_level)
        except Exception as e:
            raise Exception(f"Failed to generate interview questions: {str(e)}")

    def _get_fallback_report(self, target_role: str, experience_level: str) -> Dict[str, Any]:
        """
        Returns a structured fallback report in case of API parsing failures.
        """
        return {
            "interview_readiness_score": 70,
            "readiness_explanation": f"This is a fallback readiness assessment for a {experience_level} {target_role} role. Please retry to generate fully custom AI evaluation details.",
            "weak_areas": ["System Architecture", "Cloud Infrastructure Services", "API Optimization"],
            "roadmap": {
                "Priority 1": ["Study common system design patterns.", "Verify key coding paradigms."],
                "Priority 2": ["Review containerization practices."],
                "Priority 3": ["Practice standard behavioral/STAR answers."]
            },
            "questions": [
                {
                  "question": "Could you briefly introduce yourself and walk me through your career journey so far?",
                  "difficulty": "Easy",
                  "category": "Introduction",
                  "why_interviewer_asks_this": "To break the ice and assess communication skills, confidence, and career progression.",
                  "what_interviewer_is_evaluating": "Communication clarity, enthusiasm, professional narrative alignment.",
                  "expected_topics": ["Brief background", "Recent role highlights", "Career objectives"]
                },
                {
                  "question": "Looking at your resume, you listed experience in building RESTful APIs. What was the most challenging API design problem you resolved?",
                  "difficulty": "Medium",
                  "category": "Resume Discussion",
                  "why_interviewer_asks_this": "To verify the candidate's actual depth of involvement in claims made on the resume.",
                  "what_interviewer_is_evaluating": "Honesty, technical depth, problem-solving skills in previous roles.",
                  "expected_topics": ["API request limits", "Payload serialization", "Authentication mechanisms"]
                },
                {
                  "question": f"Walk me through the architecture of your most recent project, and justify your choice of stack for a {target_role} application.",
                  "difficulty": "Medium",
                  "category": "Project Deep Dive",
                  "why_interviewer_asks_this": "To evaluate structural planning capabilities and tech stack alignment.",
                  "what_interviewer_is_evaluating": "Architecture understanding, choices rationale.",
                  "expected_topics": ["Tech stack comparison", "Scalability factors"]
                },
                {
                  "question": "Can you explain how you would optimize a slow-performing database query that involves multiple tables and millions of rows?",
                  "difficulty": "Hard",
                  "category": "Technical Questions",
                  "why_interviewer_asks_this": "To gauge core data processing knowledge and performance troubleshooting techniques.",
                  "what_interviewer_is_evaluating": "Index tuning, query execution plan reading, caching strategies.",
                  "expected_topics": ["Indexing", "Query Execution Plans", "Joins optimization", "Caching"]
                },
                {
                  "question": "Where do you see yourself professionally in the next three to five years, and how does this role fit into that vision?",
                  "difficulty": "Easy",
                  "category": "HR Questions",
                  "why_interviewer_asks_this": "To assess retention probability, career ambition, and cultural fit.",
                  "what_interviewer_is_evaluating": "Career alignment, growth motivation, commitment timeline.",
                  "expected_topics": ["Long-term goals", "Skill development", "Company alignment"]
                },
                {
                  "question": f"In a {target_role} position, how would you design a distributed job queue system to handle peak traffic loads efficiently?",
                  "difficulty": "Hard",
                  "category": "Role-Based",
                  "why_interviewer_asks_this": "To evaluate domain-specific design capabilities required for backend/frontend engineering.",
                  "what_interviewer_is_evaluating": "Distributed queuing, message brokers, concurrency handling, fault tolerance.",
                  "expected_topics": ["RabbitMQ/Kafka/Redis", "Worker pools", "Idempotence", "DLQ (Dead Letter Queue)"]
                },
                {
                  "question": "Describe a situation where you had a disagreement with a team member on a technical decision. How did you resolve it?",
                  "difficulty": "Medium",
                  "category": "Behavioural Round",
                  "why_interviewer_asks_this": "To check interpersonal communication, empathy, and professional maturity.",
                  "what_interviewer_is_evaluating": "Conflict resolution, emotional intelligence, collaborative mindset.",
                  "expected_topics": ["Objective trade-off analysis", "Empathy & active listening", "Consensus building"]
                }
            ]
        }

