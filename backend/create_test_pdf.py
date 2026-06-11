import os
import subprocess
import sys

def install_and_import_reportlab():
    try:
        from reportlab.lib.pagesizes import letter
        from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    except ImportError:
        print("Installing reportlab for PDF generation...")
        subprocess.check_call([sys.executable, "-m", "pip", "install", "reportlab"])
        from reportlab.lib.pagesizes import letter
        from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    return SimpleDocTemplate, Paragraph, Spacer, getSampleStyleSheet, ParagraphStyle, letter

def create_pdf_resume():
    SimpleDocTemplate, Paragraph, Spacer, getSampleStyleSheet, ParagraphStyle, letter = install_and_import_reportlab()
    
    file_path = os.path.join(os.path.dirname(__file__), "test_resume.pdf")
    doc = SimpleDocTemplate(file_path, pagesize=letter, rightMargin=72, leftMargin=72, topMargin=72, bottomMargin=72)
    
    styles = getSampleStyleSheet()
    
    # Custom styles
    title_style = ParagraphStyle(
        'ResumeTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=24,
        leading=28,
        alignment=1, # Center
        spaceAfter=6
    )
    
    contact_style = ParagraphStyle(
        'ResumeContact',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=12,
        alignment=1, # Center
        spaceAfter=12
    )

    heading_style = ParagraphStyle(
        'ResumeHeading',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=16,
        spaceBefore=10,
        spaceAfter=4,
        textColor='#4f46e5'
    )
    
    body_style = ParagraphStyle(
        'ResumeBody',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        leading=14,
        spaceAfter=6
    )

    bullet_style = ParagraphStyle(
        'ResumeBullet',
        parent=body_style,
        leftIndent=15,
        firstLineIndent=-10,
        spaceAfter=4
    )

    story = []
    
    # Header
    story.append(Paragraph("Kavya Sri", title_style))
    story.append(Paragraph("Email: kavya@gmail.com | Phone: +91-9876543210<br/>LinkedIn: www.linkedin.com/in/kavyasri121 | GitHub: github.com/kavyasri121", contact_style))
    
    # Professional Summary
    story.append(Paragraph("Professional Summary", heading_style))
    story.append(Paragraph("Results-driven Software Engineer with 3+ years of experience designing and implementing highly scalable FastAPI backend web applications and responsive React user interfaces.", body_style))
    
    # Technical Skills
    story.append(Paragraph("Technical Skills", heading_style))
    story.append(Paragraph("<b>Languages:</b> Python, JavaScript, SQL, HTML5, CSS3", body_style))
    story.append(Paragraph("<b>Frameworks & Tools:</b> FastAPI, React, Node.js, Git, Docker, AWS", body_style))
    
    # Work Experience
    story.append(Paragraph("Work Experience", heading_style))
    story.append(Paragraph("<b>Software Engineer</b> | CloudTech Solutions (2024 - Present)", body_style))
    story.append(Paragraph("• Led backend migration to FastAPI, reducing response latencies by 35%.", bullet_style))
    story.append(Paragraph("• Structured multi-tenant SQL database architectures utilizing PostgreSQL.", bullet_style))
    
    story.append(Paragraph("<b>Junior Web Developer</b> | Innovate Softwares (2022 - 2024)", body_style))
    story.append(Paragraph("• Implemented responsive UI mockups in HTML/CSS/React matching UI/UX design specifications.", bullet_style))
    story.append(Paragraph("• Maintained RESTful APIs and performed regular unit tests using PyTest.", bullet_style))
    
    # Education
    story.append(Paragraph("Education", heading_style))
    story.append(Paragraph("<b>Bachelor of Technology in Computer Science & Engineering</b>", body_style))
    story.append(Paragraph("ABC Institute of Technology | CGPA: 9.2 (2018 - 2022)", body_style))
    
    # Projects
    story.append(Paragraph("Projects", heading_style))
    story.append(Paragraph("<b>AI Resume Analyzer:</b> Programmed a secure text extraction microservice parsing PDF and Word files with FastAPI.", bullet_style))
    story.append(Paragraph("<b>Task Planner Dashboard:</b> Developed a drag-and-drop task scheduler using React and Node.js.", bullet_style))
    
    # Certifications
    story.append(Paragraph("Certifications", heading_style))
    story.append(Paragraph("• AWS Certified Cloud Practitioner", bullet_style))
    story.append(Paragraph("• Certified JavaScript Developer - W3C", bullet_style))
    
    doc.build(story)
    print(f"Successfully created mock PDF resume at: {file_path}")

if __name__ == "__main__":
    create_pdf_resume()
