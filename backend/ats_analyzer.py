# Rule-Based ATS Analyzer Engine

import os
import json
import re
from typing import Dict, Any, List
from google import genai
from google.genai import types
from dotenv import load_dotenv

from ats_prompts import ATS_ANALYSIS_PROMPT

class ATSAnalyzer:
    """
    ATS Analysis Engine. Calculates a rule-based weighted ATS Score using objective
    metrics extracted from resume content by Gemini AI, combined with parsed structure details.
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

    def _call_gemini_analysis(self, prompt: str) -> Dict[str, Any]:
        """
        Request parsing of qualitative insights from Gemini in structured JSON format.
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
            
            # Clean markdown JSON block wrappers if present
            if text.startswith("```"):
                text = re.sub(r"^```(?:json)?\n", "", text)
                text = re.sub(r"\n```$", "", text)
                text = text.strip()
                
            return json.loads(text)
        except json.JSONDecodeError as je:
            raise ValueError(f"Failed to parse Gemini output as JSON: {str(je)}")
        except Exception as e:
            raise Exception(f"Gemini API request failed: {str(e)}")

    def analyze(self, resume_data: Dict[str, Any], target_role: str, experience_level: str, job_description: str = None) -> Dict[str, Any]:
        """
        Runs the full ATS analysis pipeline:
        1. Compile AI prompt.
        2. Fetch structured qualitative metadata from Gemini.
        3. Compute rule-based weighted category scores.
        4. Compile the output report.
        """
        raw_text = resume_data.get("raw_text", "")
        parsed_data = resume_data.get("parsed_data", {})
        ai_analysis = resume_data.get("ai_analysis", {})

        # 1. Ask Gemini to extract keywords, matched/missing skills, issues list per section, etc.
        prompt = ATS_ANALYSIS_PROMPT.format(
            target_role=target_role,
            experience_level=experience_level,
            job_description=job_description if job_description else "Not Provided (Run standard role expectations match)",
            resume_text=raw_text
        )
        
        # Get AI insights metadata
        gemini_data = self._call_gemini_analysis(prompt)

        # 2. RUN RULE-BASED SCORING ENGINE (deterministic mathematical formulas)
        # Weights:
        # Resume Completeness (20%), Skills Quality (20%), Projects Quality (15%), 
        # Experience Quality (15%), Keyword Optimization (15%), Certifications (5%), 
        # ATS Readability (5%), Achievement Impact (5%)
        
        # A. Resume Completeness (Max 20 pts)
        completeness_pts = 0
        if parsed_data.get("name") or parsed_data.get("email") or parsed_data.get("phone"):
            completeness_pts += 5
        if ai_analysis.get("summary") and ai_analysis.get("summary").strip():
            completeness_pts += 5
        if parsed_data.get("skills") or ai_analysis.get("technical_skills") or ai_analysis.get("soft_skills"):
            completeness_pts += 5
        if parsed_data.get("experience") or parsed_data.get("projects") or parsed_data.get("education"):
            completeness_pts += 5
            
        # B. Skills Quality (Max 20 pts)
        matched_skills = gemini_data.get("matched_skills", [])
        missing_skills = gemini_data.get("missing_skills", [])
        
        if job_description:
            total_skills = len(matched_skills) + len(missing_skills)
            skills_quality_pts = 20 * (len(matched_skills) / total_skills) if total_skills > 0 else 10
            # Ensure baseline
            skills_quality_pts = max(min(skills_quality_pts, 20), 4)
        else:
            # Score based on parsed skills length if no JD is provided
            skills_list = parsed_data.get("skills", [])
            if not skills_list and ai_analysis.get("technical_skills"):
                skills_list = ai_analysis.get("technical_skills")
            
            if len(skills_list) >= 8:
                skills_quality_pts = 20
            elif len(skills_list) >= 5:
                skills_quality_pts = 16
            elif len(skills_list) >= 3:
                skills_quality_pts = 12
            elif len(skills_list) >= 1:
                skills_quality_pts = 8
            else:
                skills_quality_pts = 0

        # C. Projects Quality (Max 15 pts)
        proj_list = parsed_data.get("projects", [])
        if not proj_list and ai_analysis.get("projects"):
            proj_list = ai_analysis.get("projects")
            
        if len(proj_list) >= 3:
            proj_base = 10
        elif len(proj_list) == 2:
            proj_base = 8
        elif len(proj_list) == 1:
            proj_base = 6
        else:
            proj_base = 0
            
        proj_issues = gemini_data.get("sections_evaluation", {}).get("projects", {}).get("issues", [])
        proj_bonus = 5 if (len(proj_list) > 0 and not proj_issues) else 2
        if len(proj_list) == 0:
            proj_bonus = 0
        projects_quality_pts = min(proj_base + proj_bonus, 15)

        # D. Experience Quality (Max 15 pts)
        exp_list = parsed_data.get("experience", []) + parsed_data.get("internships", [])
        
        if experience_level.lower() == "fresher":
            exp_base = 12
        elif experience_level.lower() == "mid-level":
            exp_base = 10 if len(exp_list) >= 1 else 6
        elif experience_level.lower() == "senior":
            exp_base = 10 if len(exp_list) >= 2 else 5
        else:  # Executive
            exp_base = 10 if len(exp_list) >= 3 else 4
            
        exp_issues = gemini_data.get("sections_evaluation", {}).get("experience", {}).get("issues", [])
        exp_bonus = 5 if (len(exp_list) > 0 and not exp_issues) else 2
        if len(exp_list) == 0 and experience_level.lower() != "fresher":
            exp_bonus = 0
        experience_quality_pts = min(exp_base + exp_bonus, 15)

        # E. Keyword Optimization (Max 15 pts)
        det_kw = gemini_data.get("detected_keywords", [])
        miss_kw = gemini_data.get("missing_keywords", [])
        total_kw = len(det_kw) + len(miss_kw)
        keyword_opt_pts = 15 * (len(det_kw) / total_kw) if total_kw > 0 else 10
        keyword_opt_pts = max(min(keyword_opt_pts, 15), 3)

        # F. Certifications (Max 5 pts)
        certifications_pts = 5 if gemini_data.get("has_certifications") else 0

        # G. ATS Readability (Max 5 pts)
        read_issues = gemini_data.get("readability_issues", [])
        readability_pts = max(5 - 1.5 * len(read_issues), 0)

        # H. Achievement Impact (Max 5 pts)
        achievement_impact_pts = 0
        if gemini_data.get("has_achievements"):
            achievement_impact_pts += 3
        if gemini_data.get("has_action_verbs"):
            achievement_impact_pts += 2

        # Sum overall ATS Score (Deterministic sum)
        raw_overall_score = (
            completeness_pts +
            skills_quality_pts +
            projects_quality_pts +
            experience_quality_pts +
            keyword_opt_pts +
            certifications_pts +
            readability_pts +
            achievement_impact_pts
        )
        overall_score = min(max(int(round(raw_overall_score)), 0), 100)

        # Map overall score to readiness status
        if overall_score >= 85:
            readiness_status = "Excellent"
        elif overall_score >= 70:
            readiness_status = "Strong"
        elif overall_score >= 55:
            readiness_status = "Average"
        else:
            readiness_status = "Needs Improvement"

        # Calculate Individual Section Scores (Out of 100)
        sections_eval = gemini_data.get("sections_evaluation", {})
        
        # Helper to compute section score out of 100
        def calc_section_score(section_key, default_weight=15, is_present=True):
            if not is_present:
                return 0
            issues = sections_eval.get(section_key, {}).get("issues", [])
            score = 100 - default_weight * len(issues)
            return max(min(score, 100), 20)

        summary_present = bool(ai_analysis.get("summary"))
        skills_present = bool(parsed_data.get("skills") or ai_analysis.get("technical_skills"))
        projects_present = bool(proj_list)
        experience_present = bool(exp_list)
        education_present = bool(parsed_data.get("education"))
        certifications_present = bool(gemini_data.get("has_certifications"))
        achievements_present = bool(gemini_data.get("has_achievements"))

        summary_score = calc_section_score("summary", 15, summary_present)
        
        # If JD provided, skills score uses the match ratio
        if job_description and skills_present:
            total_skills = len(matched_skills) + len(missing_skills)
            skills_score = int(100 * (len(matched_skills) / total_skills)) if total_skills > 0 else 50
            skills_score = max(min(skills_score, 100), 20)
        else:
            skills_score = calc_section_score("skills", 15, skills_present)

        projects_score = calc_section_score("projects", 15, projects_present)
        experience_score = calc_section_score("experience", 15, experience_present)
        education_score = calc_section_score("education", 15, education_present)
        certifications_score = calc_section_score("certifications", 15, certifications_present)
        achievements_score = calc_section_score("achievements", 15, achievements_present)
        contact_info_score = calc_section_score("contact_info", 20, True)

        # Assemble final section list with scores, issues, and suggestions
        section_analysis = {
            "Professional Summary": {
                "score": summary_score,
                "issues": sections_eval.get("summary", {}).get("issues", []),
                "suggestions": sections_eval.get("summary", {}).get("suggestions", [])
            },
            "Skills": {
                "score": skills_score,
                "issues": sections_eval.get("skills", {}).get("issues", []),
                "suggestions": sections_eval.get("skills", {}).get("suggestions", [])
            },
            "Projects": {
                "score": projects_score,
                "issues": sections_eval.get("projects", {}).get("issues", []),
                "suggestions": sections_eval.get("projects", {}).get("suggestions", [])
            },
            "Experience": {
                "score": experience_score,
                "issues": sections_eval.get("experience", {}).get("issues", []),
                "suggestions": sections_eval.get("experience", {}).get("suggestions", [])
            },
            "Education": {
                "score": education_score,
                "issues": sections_eval.get("education", {}).get("issues", []),
                "suggestions": sections_eval.get("education", {}).get("suggestions", [])
            },
            "Certifications": {
                "score": certifications_score,
                "issues": sections_eval.get("certifications", {}).get("issues", []),
                "suggestions": sections_eval.get("certifications", {}).get("suggestions", [])
            },
            "Achievements": {
                "score": achievements_score,
                "issues": sections_eval.get("achievements", {}).get("issues", []),
                "suggestions": sections_eval.get("achievements", {}).get("suggestions", [])
            },
            "Contact Information": {
                "score": contact_info_score,
                "issues": sections_eval.get("contact_info", {}).get("issues", []),
                "suggestions": sections_eval.get("contact_info", {}).get("suggestions", [])
            }
        }

        # Format breakdown scores out of 100 for display
        breakdown_scores = {
            "Resume Completeness": int(round((completeness_pts / 20.0) * 100)),
            "Skills Quality": int(round((skills_quality_pts / 20.0) * 100)),
            "Projects Quality": int(round((projects_quality_pts / 15.0) * 100)),
            "Experience Quality": int(round((experience_quality_pts / 15.0) * 100)),
            "Keyword Optimization": int(round((keyword_opt_pts / 15.0) * 100)),
            "Certifications": int(round((certifications_pts / 5.0) * 100)),
            "ATS Readability": int(round((readability_pts / 5.0) * 100)),
            "Achievement Impact": int(round((achievement_impact_pts / 5.0) * 100))
        }

        # Calculate contributions to the final ATS score
        breakdown_contributions = {
            "Resume Completeness": round(completeness_pts, 1),
            "Skills Quality": round(skills_quality_pts, 1),
            "Projects Quality": round(projects_quality_pts, 1),
            "Experience Quality": round(experience_quality_pts, 1),
            "Keyword Optimization": round(keyword_opt_pts, 1),
            "Certifications": round(certifications_pts, 1),
            "ATS Readability": round(readability_pts, 1),
            "Achievement Impact": round(achievement_impact_pts, 1)
        }

        # Weights dictionary for transparent formula rendering
        weights = {
            "Resume Completeness": 20,
            "Skills Quality": 20,
            "Projects Quality": 15,
            "Experience Quality": 15,
            "Keyword Optimization": 15,
            "Certifications": 5,
            "ATS Readability": 5,
            "Achievement Impact": 5
        }

        return {
            "ats_score": overall_score,
            "readiness_status": readiness_status,
            "target_role": target_role,
            "experience_level": experience_level,
            "job_description_provided": bool(job_description),
            "breakdown": breakdown_scores,
            "contributions": breakdown_contributions,
            "weights": weights,
            "section_analysis": section_analysis,
            "missing_sections": gemini_data.get("missing_sections", []),
            "detected_keywords": det_kw,
            "missing_keywords": miss_kw,
            "matched_skills": matched_skills,
            "missing_skills": missing_skills,
            "roadmap": gemini_data.get("roadmap", [])
        }
