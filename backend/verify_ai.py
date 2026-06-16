import os
import sys
from unittest.mock import MagicMock, patch

# Ensure backend folder is in path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from ai_analyzer import AIAnalyzer

def test_ai_analyzer_mocked():
    print("Running Mocked AIAnalyzer Test (google-genai)...")
    
    # Mock data
    raw_text = "Jane Doe\nSoftware Engineer\nEmail: jane@example.com\nPhone: 123-456-7890\nSkills: Python, React\nExperience: Software Engineer at DevCorp (2022-2024)"
    parsed_data = {
        "name": "Jane Doe",
        "email": "jane@example.com",
        "phone": "123-456-7890",
        "summary": "Software Engineer with React and Python experience.",
        "skills": ["Python", "React"],
        "technical_skills": ["Python", "React"],
        "soft_skills": [],
        "education": ["B.S. in Computer Science"],
        "projects": ["Task App: A web app built with React."],
        "experience": ["Software Engineer at DevCorp (2022-2024)"],
        "internships": [],
        "certifications": [],
        "achievements": [],
        "links": {
            "linkedin": "https://linkedin.com/in/janedoe",
            "github": "https://github.com/janedoe"
        }
    }

    # Mock responses for the four prompts
    mock_summary_res = MagicMock()
    mock_summary_res.text = '{"summary": "A talented software engineer with a strong foundation in Python and React."}'

    mock_skills_res = MagicMock()
    mock_skills_res.text = '{"technical_skills": ["Python", "React"], "soft_skills": ["Problem Solving"]}'

    mock_strengths_res = MagicMock()
    mock_strengths_res.text = '{"strengths": ["Strong coding background", "Experienced with React UI"]}'

    mock_weaknesses_res = MagicMock()
    mock_weaknesses_res.text = '{"weaknesses": ["No formal internship experience listed", "Limited cloud certification exposure"]}'

    mock_projects_res = MagicMock()
    mock_projects_res.text = '{"projects": [{"title": "Task App", "description": "Developed a task scheduler with drag and drop capabilities.", "technologies": ["React", "CSS"]}]}'

    with patch('google.genai.Client') as mock_client_class:
        mock_client = MagicMock()
        mock_client_class.return_value = mock_client
        
        # Configure client models.generate_content mock to return the mock responses in order
        mock_client.models.generate_content.side_effect = [
            mock_summary_res,
            mock_skills_res,
            mock_strengths_res,
            mock_weaknesses_res,
            mock_projects_res
        ]
        
        # Run analyzer with environment variable mocked
        os.environ["GEMINI_API_KEY"] = "mock_api_key_for_testing"
        
        analyzer = AIAnalyzer()
        results = analyzer.analyze_resume(raw_text, parsed_data)
        
        print("\n--- MOCKED RESULTS ---")
        print(f"Summary: {results['summary']}")
        print(f"Tech Skills: {results['technical_skills']}")
        print(f"Soft Skills: {results['soft_skills']}")
        print(f"Strengths: {results['strengths']}")
        print(f"Weaknesses: {results['weaknesses']}")
        print(f"Projects: {results['projects']}")
        print("----------------------\n")
        
        assert results["summary"] == "A talented software engineer with a strong foundation in Python and React."
        assert "React" in results["technical_skills"]
        assert "Problem Solving" in results["soft_skills"]
        assert len(results["strengths"]) == 2
        assert len(results["weaknesses"]) == 2
        assert len(results["projects"]) == 1
        assert results["projects"][0]["title"] == "Task App"
        
        print("[SUCCESS] Mocked AIAnalyzer test passed!")

if __name__ == "__main__":
    try:
        test_ai_analyzer_mocked()
    except Exception as e:
        print(f"[FAIL] Mocked test failed: {str(e)}")
        sys.exit(1)
