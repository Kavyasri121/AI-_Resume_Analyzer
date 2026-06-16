import re
from typing import Dict, Any, List
from abc import ABC, abstractmethod

class BaseResumeParser(ABC):
    """
    Abstract base class for resume parsing.
    Allows easy plug-and-play of future AI-based parsers (e.g. Gemini, OpenAI)
    without redesigning the backend workflow.
    """
    @abstractmethod
    def parse(self, raw_text: str) -> Dict[str, Any]:
        pass

class HeuristicResumeParser(BaseResumeParser):
    """
    A rule-based and regex-based resume parser for Week 2.
    Extracts core contact details and segments text into logical components.
    """
    def __init__(self):
        # Dictionary mapping section keys to keywords for detection
        self.section_mappings = {
            "summary": ["summary", "objective", "profile", "professional summary", "career objective", "about me", "summary of qualifications"],
            "technical_skills": ["technical skills", "programming languages", "technologies", "hard skills", "it skills", "tools", "tools & technologies", "technical proficiency"],
            "soft_skills": ["soft skills", "interpersonal skills", "professional skills", "personal skills", "core competencies"],
            "skills": ["skills", "key skills", "core skills", "competencies", "proficiencies", "expertise", "areas of expertise"],
            "education": ["education", "academic background", "academic profile", "qualifications", "academic credentials", "degree", "education background"],
            "projects": ["projects", "key projects", "academic projects", "personal projects", "research projects", "featured projects", "major projects"],
            "experience": ["experience", "work experience", "professional experience", "employment history", "work history", "employment", "career history"],
            "internships": ["internships", "internship", "internship experience", "vocational training", "industrial training"],
            "certifications": ["certifications", "licenses", "certifications & licenses", "courses", "credentials", "certifications and licenses", "certifications/licenses"],
            "achievements": ["achievements", "accomplishments", "awards", "honors", "key achievements", "awards & achievements", "recognition"],
            "publications": ["publications", "research papers", "articles", "patents", "journal publications", "conference publications"],
            "languages": ["languages", "languages known", "linguistic skills", "language proficiencies", "language skills"],
            "interests": ["interests", "hobbies", "extracurricular activities", "extracurriculars", "co-curricular activities"]
        }

    def parse(self, raw_text: str) -> Dict[str, Any]:
        """
        Parses raw resume text and returns structured data.
        """
        if not raw_text:
            return self._get_empty_parsed_structure()

        # Clean raw text lines
        lines = [line.strip() for line in raw_text.split("\n")]
        # Keep non-empty lines for section grouping
        valid_lines = [l for l in lines if l]

        # Extract contact information
        email = self._extract_email(raw_text)
        phone = self._extract_phone(raw_text)
        links = self._extract_links(raw_text)
        name = self._extract_name(valid_lines, email, phone)

        # Parse sections
        sections = self._parse_sections(valid_lines)

        # Populate summary (join paragraphs as a single block of text)
        summary_text = " ".join(sections.get("summary", []))

        # Handle simple skills parsing
        # Combine lists under skills headers
        all_skills_lines = sections.get("skills", [])
        tech_skills_lines = sections.get("technical_skills", [])
        soft_skills_lines = sections.get("soft_skills", [])

        skills_list = self._tokenize_skills(all_skills_lines)
        technical_skills_list = self._tokenize_skills(tech_skills_lines)
        soft_skills_list = self._tokenize_skills(soft_skills_lines)

        # Build response parsed structure
        parsed_data = {
            "name": name,
            "email": email,
            "phone": phone,
            "summary": summary_text,
            "skills": skills_list,
            "technical_skills": technical_skills_list,
            "soft_skills": soft_skills_list,
            "education": sections.get("education", []),
            "projects": sections.get("projects", []),
            "experience": sections.get("experience", []),
            "internships": sections.get("internships", []),
            "certifications": sections.get("certifications", []),
            "achievements": sections.get("achievements", []),
            "publications": sections.get("publications", []),
            "languages": sections.get("languages", []),
            "interests": sections.get("interests", []),
            "links": links,
            "other_sections": sections.get("other_sections", {})
        }

        return parsed_data

    def _extract_email(self, text: str) -> str:
        # Simple email regex
        email_pattern = r'[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+'
        match = re.search(email_pattern, text)
        return match.group(0) if match else ""

    def _extract_phone(self, text: str) -> str:
        # Regex matching common phone patterns (+91-9999999999, (123) 456-7890, etc.)
        phone_pattern = r'(?:\+?\d{1,4}[-.\s]??)?\(?\d{2,4}\)?[-.\s]??\d{3,4}[-.\s]??\d{3,4}\b'
        # Fallback simpler pattern for general international styles
        matches = re.findall(phone_pattern, text)
        if matches:
            # Return first phone number that contains at least 7 digits (filters false positives)
            for m in matches:
                digits_count = sum(c.isdigit() for c in m)
                if digits_count >= 7:
                    return m.strip()
        
        # Simpler backup
        backup_pattern = r'\+?\d[\d-\s()]{7,15}\d'
        match = re.search(backup_pattern, text)
        return match.group(0).strip() if match else ""

    def _extract_links(self, text: str) -> Dict[str, str]:
        # Search for common links in text
        links = {
            "linkedin": "",
            "github": "",
            "portfolio": "",
            "leetcode": "",
            "codeforces": "",
            "hackerrank": "",
            "codechef": "",
            "geeksforgeeks": ""
        }

        patterns = {
            "linkedin": r'(?:https?://)?(?:www\.)?linkedin\.com/in/[a-zA-Z0-9_-]+/?',
            "github": r'(?:https?://)?(?:www\.)?github\.com/[a-zA-Z0-9_-]+/?',
            "leetcode": r'(?:https?://)?(?:www\.)?leetcode\.com/(?:u/|profile/)?[a-zA-Z0-9_-]+/?',
            "codeforces": r'(?:https?://)?(?:www\.)?codeforces\.com/profile/[a-zA-Z0-9_-]+/?',
            "hackerrank": r'(?:https?://)?(?:www\.)?hackerrank\.com/(?:profile/)?[a-zA-Z0-9_-]+/?',
            "codechef": r'(?:https?://)?(?:www\.)?codechef\.com/users/[a-zA-Z0-9_-]+/?',
            "geeksforgeeks": r'(?:https?://)?(?:www\.)?geeksforgeeks\.org/user/[a-zA-Z0-9_-]+/?',
        }

        # Scan for matched URLs
        for key, pattern in patterns.items():
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                links[key] = match.group(0).strip()

        # Extract portfolio (general URLs that aren't social networks or emails)
        # Search for any valid website/domain in the text
        all_urls = re.findall(r'(?:https?://)?(?:www\.)?[a-zA-Z0-9-]+\.[a-zA-Z]{2,}(?:/[a-zA-Z0-9_#-]*)*', text)
        social_domains = ["linkedin", "github", "leetcode", "codeforces", "hackerrank", "codechef", "geeksforgeeks", "gmail.com", "outlook.com", "yahoo.com"]
        for url in all_urls:
            if "@" in url:
                continue
            is_social = any(domain in url.lower() for domain in social_domains)
            if not is_social:
                # Check if this URL is part of an email address
                email_pattern = r'[a-zA-Z0-9_.+-]+@' + re.escape(url)
                if re.search(email_pattern, text):
                    continue
                links["portfolio"] = url.strip()
                break  # Pick the first non-social URL as portfolio candidate

        return links

    def _extract_name(self, lines: List[str], email: str, phone: str) -> str:
        """
        Heuristic to extract name. Usually the first non-empty line at the top,
        excluding contact keywords, formatting symbols, or common document titles.
        """
        stop_words = ["resume", "cv", "curriculum vitae", "page", "contact", "email", "phone"]
        for line in lines[:5]:
            line_lower = line.lower()
            # Check if this line is part of contact details or links
            if email and email.lower() in line_lower:
                continue
            if phone and any(char.isdigit() for char in line):
                # If it's short and contains phone digits, skip it
                if len(line) < 25:
                    continue
            # Check for generic stop words
            if any(stop in line_lower for stop in stop_words):
                continue
            # Remove symbols/bullets at beginning of name if any
            clean_line = re.sub(r'^[•\-\*]\s*', '', line).strip()
            # Name should contain letters and spaces, not numbers
            if re.match(r'^[a-zA-Z\s\.\,\-\'’]+$', clean_line):
                # Length check
                if 2 <= len(clean_line) <= 40:
                    return clean_line
        return ""

    def _parse_sections(self, lines: List[str]) -> Dict[str, Any]:
        """
        Segments lines of text under detected section headers.
        """
        sections = {
            "summary": [], "skills": [], "technical_skills": [], "soft_skills": [],
            "education": [], "projects": [], "experience": [], "internships": [],
            "certifications": [], "achievements": [], "publications": [],
            "languages": [], "interests": [], "other_sections": {}
        }

        current_section = None
        current_other_name = None

        for line in lines:
            clean_line = line.strip()
            if not clean_line:
                continue

            # Check if the line looks like a section header (usually short, <= 40 chars)
            # Remove symbols, colons at ends for check
            header_test = re.sub(r'[:\-•\*]', '', clean_line).strip().lower()
            
            # Identify if line matches predefined headers
            matched_key = None
            if len(clean_line) <= 45:
                for key, keywords in self.section_mappings.items():
                    if header_test in keywords:
                        matched_key = key
                        break
            
            if matched_key:
                current_section = matched_key
                current_other_name = None
                continue
            
            # If it looks like a new header but not in predefined list (e.g. all uppercase, <= 30 chars)
            # We treat it as an custom "other_section"
            if len(clean_line) <= 30 and clean_line.isupper() and not clean_line.replace(" ", "").isdigit():
                current_section = "other_sections"
                current_other_name = clean_line
                if current_other_name not in sections["other_sections"]:
                    sections["other_sections"][current_other_name] = []
                continue

            # Append content to the current active section
            if current_section:
                if current_section == "other_sections" and current_other_name:
                    sections["other_sections"][current_other_name].append(clean_line)
                else:
                    sections[current_section].append(clean_line)
            else:
                # Prior to hitting any header, put lines into summary/objective as generic start
                # or skip if it's contact details (name/email/phone)
                if len(clean_line) > 10 and "@" not in clean_line:
                    sections["summary"].append(clean_line)

        return sections

    def _tokenize_skills(self, lines: List[str]) -> List[str]:
        """
        Splits skills lines by typical delimiters (comma, pipe, semicolon, bullet)
        without using complex NLP or predefined lists.
        """
        skills = []
        for line in lines:
            # Strip list indicators at the start of the line
            line_stripped = re.sub(r'^[•\-\*]\s*', '', line.strip())
            # Replace bullet characters or symbols with commas for easy tokenization (preserve hyphens)
            line_cleaned = re.sub(r'[•|;\*]', ',', line_stripped)
            tokens = [t.strip() for t in line_cleaned.split(",") if t.strip()]
            for token in tokens:
                # Filter out lines that look like generic sentences (length check)
                if len(token) > 1 and len(token) < 40 and not any(word in token.lower() for word in ["worked", "using", "experience"]):
                    # Avoid duplicates
                    if token not in skills:
                        skills.append(token)
        return skills

    def _get_empty_parsed_structure(self) -> Dict[str, Any]:
        return {
            "name": "",
            "email": "",
            "phone": "",
            "summary": "",
            "skills": [],
            "technical_skills": [],
            "soft_skills": [],
            "education": [],
            "projects": [],
            "experience": [],
            "internships": [],
            "certifications": [],
            "achievements": [],
            "publications": [],
            "languages": [],
            "interests": [],
            "links": {
                "linkedin": "",
                "github": "",
                "portfolio": "",
                "leetcode": "",
                "codeforces": "",
                "hackerrank": "",
                "codechef": "",
                "geeksforgeeks": ""
            },
            "other_sections": {}
        }


class AIResumeParser(BaseResumeParser):
    """
    An AI-powered resume parser using Gemini API.
    Parses name, email, phone, links, and segments text into logical components accurately.
    """
    def __init__(self):
        import os
        from google import genai
        from dotenv import load_dotenv
        load_dotenv()
        self.api_key = os.getenv("GEMINI_API_KEY")
        if not self.api_key or not self.api_key.strip():
            raise ValueError(
                "GEMINI_API_KEY is missing or empty. Please open backend/.env and add your valid Gemini API key "
                "to execute candidate analysis."
            )
        self.client = genai.Client(api_key=self.api_key)
        self.model_name = os.getenv("GEMINI_MODEL", "gemini-2.5-flash-lite")

    def parse(self, raw_text: str) -> Dict[str, Any]:
        if not raw_text or not raw_text.strip():
            return self._get_empty_parsed_structure()

        prompt = f"""
You are an expert resume parsing system. Your task is to parse the raw resume text into a structured JSON format.
Extract contact details, social links, education, projects, experience, internships, skills, certifications, and achievements.

Guidelines:
1. "name": Extract the candidate's full name.
2. "email": Extract the email address.
3. "phone": Extract the phone number.
4. "links": Look at any URLs in the text (including any links under '--- Extracted Hyperlinks ---' at the bottom). Extract the URL for:
   - linkedin, github, leetcode, codeforces, hackerrank, codechef, geeksforgeeks.
   - portfolio: any personal website or other URL that is not a social network or email domain.
   - If not found, set to empty string "". Do not include email domains (like gmail.com) as a portfolio.
5. "summary": A brief, summary statement or objective from the resume (use the raw resume objective/summary if present, or leave empty if not).
6. "skills", "technical_skills", "soft_skills": Extract lists of skills. Put technical tools/languages in "technical_skills", interpersonal skills in "soft_skills", and others in "skills".
7. "education": Extract all academic degrees/schools, each as a separate string element. Include degree, school, dates, GPA/marks if present (e.g. "Bachelor of Technology (B.Tech), Computer Science, JNTUK, 2023-2027 - CGPA: 8.84").
8. "projects": Extract each distinct project as a string element (title and bullets merged or as separate items, but keep the descriptions informative).
9. "experience": Extract each job position/role/company as a string element.
10. "internships": Extract each internship position/role/company as a string element.
11. "certifications": Extract certifications.
12. "achievements": Extract achievements.
13. "publications", "languages", "interests": Extract any relevant sections.
14. "other_sections": Any other sections not covered.

Resume Text:
{raw_text}

Respond ONLY with a valid JSON object matching the following structure:
{{
  "name": "",
  "email": "",
  "phone": "",
  "summary": "",
  "skills": [],
  "technical_skills": [],
  "soft_skills": [],
  "education": [],
  "projects": [],
  "experience": [],
  "internships": [],
  "certifications": [],
  "achievements": [],
  "publications": [],
  "languages": [],
  "interests": [],
  "links": {{
    "linkedin": "",
    "github": "",
    "leetcode": "",
    "codeforces": "",
    "hackerrank": "",
    "codechef": "",
    "geeksforgeeks": "",
    "portfolio": ""
  }},
  "other_sections": {{}}
}}
Do not include any extra text, markdown formatting (other than JSON itself), or commentary outside the JSON block.
"""
        from google.genai import types
        import json
        import re
        try:
            response = self.client.models.generate_content(
                model=self.model_name,
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json"
                )
            )
            text = response.text.strip()
            if text.startswith("```"):
                text = re.sub(r"^```(?:json)?\n", "", text)
                text = re.sub(r"\n```$", "", text)
                text = text.strip()
            parsed_json = json.loads(text)
            
            # Ensure all keys are present
            empty_structure = self._get_empty_parsed_structure()
            for key, val in empty_structure.items():
                if key not in parsed_json:
                    parsed_json[key] = val
                elif key == "links":
                    # Clean/ensure all links keys
                    for lkey, lval in val.items():
                        if lkey not in parsed_json["links"]:
                            parsed_json["links"][lkey] = lval
            return parsed_json
        except Exception as e:
            # Fallback to heuristic parser in case of API failure
            print(f"Warning: AI resume parsing failed, falling back to heuristic parser: {str(e)}")
            heuristic_parser = HeuristicResumeParser()
            return heuristic_parser.parse(raw_text)

    def _get_empty_parsed_structure(self) -> Dict[str, Any]:
        return {
            "name": "",
            "email": "",
            "phone": "",
            "summary": "",
            "skills": [],
            "technical_skills": [],
            "soft_skills": [],
            "education": [],
            "projects": [],
            "experience": [],
            "internships": [],
            "certifications": [],
            "achievements": [],
            "publications": [],
            "languages": [],
            "interests": [],
            "links": {
                "linkedin": "",
                "github": "",
                "portfolio": "",
                "leetcode": "",
                "codeforces": "",
                "hackerrank": "",
                "codechef": "",
                "geeksforgeeks": ""
            },
            "other_sections": {}
        }
