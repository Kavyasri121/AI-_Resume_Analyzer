# Verification script for ATS scoring engine

import json
from ats_analyzer import ATSAnalyzer

def run_test():
    mock_resume = {
        "raw_text": (
            "Kavyasri. Developer resume. Contact: kavya@example.com | 9876543210.\n"
            "Summary: Full Stack Engineer with 3 years of experience building Python and React applications.\n"
            "Skills: Python, React.js, JavaScript, Docker, AWS, SQL, REST APIs, Git.\n"
            "Experience:\n"
            "- Software Engineer at Tech Solutions | Hyderabad (2024 - Present)\n"
            "  Built scalable REST endpoints using FastAPI. Improved latency by 30%.\n"
            "Projects:\n"
            "- E-Commerce Platform: Built with React and Python. Integrated stripe gateway.\n"
            "Education:\n"
            "- B.Tech in Computer Science, JNTU (2020 - 2024)"
        ),
        "parsed_data": {
            "name": "Kavyasri",
            "email": "kavya@example.com",
            "phone": "9876543210",
            "links": {
                "linkedin": "linkedin.com/in/kavya",
                "github": "github.com/kavya"
            },
            "skills": ["Python", "React.js", "JavaScript", "Docker", "AWS", "SQL"],
            "experience": ["Software Engineer at Tech Solutions | (2024 - Present)"],
            "projects": ["E-Commerce Platform"],
            "education": ["B.Tech in Computer Science, JNTU | 2024"]
        },
        "ai_analysis": {
            "summary": "Full Stack Engineer with 3 years of experience building Python and React applications.",
            "technical_skills": ["Python", "React.js", "JavaScript", "Docker", "AWS", "SQL"],
            "soft_skills": ["Collaboration", "Agility"],
            "projects": [
                {
                    "title": "E-Commerce Platform",
                    "description": "Designed a scalable transaction platform with Stripe integration.",
                    "technologies": ["React.js", "Python", "Stripe"]
                }
            ]
        }
    }

    analyzer = ATSAnalyzer()
    
    print("--- TEST CASE 1: Analysis with NO Job Description ---")
    try:
        report1 = analyzer.analyze(
            resume_data=mock_resume,
            target_role="Full Stack Engineer",
            experience_level="Mid-level",
            job_description=None
        )
        print("Success! Report received:")
        print(f"Overall ATS Score: {report1['ats_score']}/100")
        print(f"Readiness Status: {report1['readiness_status']}")
        print(f"Resume Completeness Score: {report1['breakdown']['Resume Completeness']}%")
        print(f"Skills Quality Score: {report1['breakdown']['Skills Quality']}%")
        print(f"Keyword Optimization Score: {report1['breakdown']['Keyword Optimization']}%")
        print("Score Contributions breakdown:")
        print(json.dumps(report1["contributions"], indent=2))
        
        assert report1['ats_score'] > 0
        assert report1['readiness_status'] in ["Excellent", "Strong", "Average", "Needs Improvement"]
        print("Test Case 1 Passed.\n")
    except Exception as e:
        print(f"Test Case 1 Failed: {str(e)}")
        return

    print("--- TEST CASE 2: Analysis WITH Job Description ---")
    jd = (
        "Looking for a Full Stack Developer. Must know Python, React, AWS, Docker, Kubernetes. "
        "Experience in building APIs is required."
    )
    try:
        report2 = analyzer.analyze(
            resume_data=mock_resume,
            target_role="Full Stack Developer",
            experience_level="Mid-level",
            job_description=jd
        )
        print("Success! Report received:")
        print(f"Overall ATS Score: {report2['ats_score']}/100")
        print(f"Readiness Status: {report2['readiness_status']}")
        print(f"Matched Skills: {report2['matched_skills']}")
        print(f"Missing Skills: {report2['missing_skills']}")
        print(f"Matched Keywords: {report2['detected_keywords']}")
        print(f"Missing Keywords: {report2['missing_keywords']}")
        print("Score Contributions breakdown:")
        print(json.dumps(report2["contributions"], indent=2))
        
        assert report2['ats_score'] > 0
        print("Test Case 2 Passed.")
    except Exception as e:
        print(f"Test Case 2 Failed: {str(e)}")

if __name__ == "__main__":
    run_test()
