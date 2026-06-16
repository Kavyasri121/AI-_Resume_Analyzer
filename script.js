/* ==========================================================================
   AI Resume Analyzer - Phase 1 Frontend Interactions
   Vanilla JavaScript with drag-and-drop upload and simulated validation states
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  // --- DOM Selectors ---
  const dropZone = document.getElementById('drop-zone');
  const fileInput = document.getElementById('file-input');
  const browseBtn = document.getElementById('browse-btn');
  
  const messageBox = document.getElementById('message-box');
  const messageIcon = document.getElementById('message-icon');
  const messageText = document.getElementById('message-text');

  const progressSection = document.getElementById('progress-section');
  const progressFileName = document.getElementById('progress-file-name');
  const progressFileIcon = document.getElementById('progress-file-icon');
  const progressPercentage = document.getElementById('progress-percentage');
  const progressBarFill = document.getElementById('progress-bar-fill');
  const progressStatusText = document.getElementById('progress-status-text');

  const previewCard = document.getElementById('preview-card');
  const previewFilename = document.getElementById('preview-filename');
  const previewFiletag = document.getElementById('preview-filetag');
  const previewFilesize = document.getElementById('preview-filesize');
  const previewFileIconWrapper = document.getElementById('preview-file-icon-wrapper');
  const removeFileBtn = document.getElementById('remove-file-btn');

  const analyzeBtn = document.getElementById('analyze-btn');
  const btnSpinner = document.getElementById('btn-spinner');
  const resetBtn = document.getElementById('reset-btn');

  // --- Results Dashboard DOM Selectors ---
  const resultsCard = document.getElementById('results-card');
  const skeletonLoader = document.getElementById('skeleton-loader');
  const dashboardContent = document.getElementById('dashboard-content');
  const resTimestamp = document.getElementById('res-timestamp');
  const resName = document.getElementById('res-name');
  const profileInitials = document.getElementById('profile-initials');
  const resEmail = document.getElementById('res-email');
  const resPhone = document.getElementById('res-phone');
  const resSocialLinks = document.getElementById('res-social-links');
  const resSummaryWrapper = document.getElementById('res-summary-wrapper');
  const resSummary = document.getElementById('res-summary');
  
  // Custom Visual Containers
  const timelineExperienceList = document.getElementById('timeline-experience-list');
  const projectsList = document.getElementById('projects-list');
  const skillsIntelligenceDashboard = document.getElementById('skills-intelligence-dashboard');
  const educationListWrapper = document.getElementById('education-list-wrapper');
  const strengthsListUl = document.getElementById('strengths-list-ul');
  const weaknessesListUl = document.getElementById('weaknesses-list-ul');

  // Tab Switcher Elements
  const tabButtons = document.querySelectorAll('.dashboard-tabs .tab-btn');
  const tabPanels = {
    'resume-analysis': document.getElementById('resume-analysis-tab-content'),
    'ats-analysis': document.getElementById('ats-analysis-tab-content')
  };

  // --- State Variables ---
  let currentFile = null;
  let currentFileId = null;
  let selectedExperience = 'Fresher';
  let uploadTimer = null;
  let isUploading = false;

  // --- SVGs for Dynamic Insertions ---
  const errorSvg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="8"/>
    </svg>`;
  
  const successSvg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
    </svg>`;

  const infoSvg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
    </svg>`;

  const pdfIconSvg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="9" y1="15" x2="15" y2="15"/>
      <line x1="9" y1="11" x2="15" y2="11"/>
    </svg>`;

  const docxIconSvg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <path d="M9 12h6"/>
      <path d="M9 16h6"/>
    </svg>`;

  // --- Event Bindings ---
  
  // Custom button click triggers input selection
  browseBtn.addEventListener('click', (e) => {
    e.stopPropagation(); // Avoid triggering dropzone clicks
    fileInput.click();
  });

  fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
      handleFileSelection(e.target.files[0]);
    }
  });

  // Drag and drop mechanics
  ['dragenter', 'dragover'].forEach(eventName => {
    dropZone.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (!isUploading) {
        dropZone.classList.add('dragover');
      }
    }, false);
  });

  ['dragleave', 'drop'].forEach(eventName => {
    dropZone.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropZone.classList.remove('dragover');
    }, false);
  });

  dropZone.addEventListener('drop', (e) => {
    if (isUploading) return;
    const dt = e.dataTransfer;
    const files = dt.files;
    if (files.length > 0) {
      handleFileSelection(files[0]);
    }
  });

  // Keep upload area keyboard accessible
  dropZone.addEventListener('click', () => {
    if (!isUploading && !currentFile) {
      fileInput.click();
    }
  });

  removeFileBtn.addEventListener('click', resetState);
  resetBtn.addEventListener('click', resetState);

  analyzeBtn.addEventListener('click', triggerAnalysis);

  // Handle experience button toggles
  const expButtons = document.querySelectorAll('.exp-btn');
  expButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      expButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedExperience = btn.getAttribute('data-value');
    });
  });

  // Target role configuration & Run ATS Analysis Trigger
  const runAtsBtn = document.getElementById('run-ats-btn');
  const atsBtnSpinner = document.getElementById('ats-btn-spinner');
  const atsTargetRole = document.getElementById('ats-target-role');
  const atsJobDesc = document.getElementById('ats-job-desc');
  const atsSkeletonLoader = document.getElementById('ats-skeleton-loader');
  const atsResultsContainer = document.getElementById('ats-results-container');

  runAtsBtn.addEventListener('click', () => {
    const roleValue = atsTargetRole.value.trim();
    const jdValue = atsJobDesc.value.trim();

    if (!roleValue) {
      alert('Target Role is required.');
      atsTargetRole.focus();
      return;
    }

    if (!currentFileId) {
      alert('Please upload a resume first.');
      return;
    }

    // Toggle button loading state
    runAtsBtn.disabled = true;
    atsBtnSpinner.classList.remove('hidden');
    runAtsBtn.querySelector('.btn-text').textContent = 'Analyzing ATS...';

    // Show skeleton loader and hide results container
    atsSkeletonLoader.classList.remove('hidden');
    atsResultsContainer.classList.add('hidden');
    
    // Scroll to loader smoothly
    setTimeout(() => {
      atsSkeletonLoader.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);

    // Call POST /ats_analyze
    fetch('http://localhost:8000/ats_analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        file_id: currentFileId,
        target_role: roleValue,
        experience_level: selectedExperience,
        job_description: jdValue || null
      })
    })
    .then(async (response) => {
      if (!response.ok) {
        let errMsg = 'ATS analysis failed.';
        try {
          const errData = await response.json();
          if (errData && errData.detail) {
            errMsg = typeof errData.detail === 'string'
              ? errData.detail
              : JSON.stringify(errData.detail);
          }
        } catch (e) {}
        throw new Error(errMsg);
      }
      return response.json();
    })
    .then((data) => {
      // Revert loading state
      runAtsBtn.disabled = false;
      atsBtnSpinner.classList.add('hidden');
      runAtsBtn.querySelector('.btn-text').textContent = 'Run ATS Analysis →';

      // Hide skeleton loader, show results
      atsSkeletonLoader.classList.add('hidden');
      atsResultsContainer.classList.remove('hidden');

      // Render ATS Report
      renderAtsReport(data.report);
      
      // Scroll to results
      setTimeout(() => {
        atsResultsContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    })
    .catch((error) => {
      runAtsBtn.disabled = false;
      atsBtnSpinner.classList.add('hidden');
      runAtsBtn.querySelector('.btn-text').textContent = 'Run ATS Analysis →';
      atsSkeletonLoader.classList.add('hidden');
      console.error('ATS Analysis Error:', error);
      alert(error.message || 'Error executing ATS analysis.');
    });
  });

  // Tab switching handler
  function switchTab(tabId) {
    tabButtons.forEach(btn => {
      if (btn.getAttribute('data-tab') === tabId) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    for (const [id, panel] of Object.entries(tabPanels)) {
      if (panel) {
        if (id === tabId) {
          panel.classList.add('active');
          panel.classList.remove('hidden');
        } else {
          panel.classList.remove('active');
          panel.classList.add('hidden');
        }
      }
    }
  }

  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const tabId = btn.getAttribute('data-tab');
      switchTab(tabId);
      if (tabId === 'ats-analysis' && atsTargetRole) {
        setTimeout(() => atsTargetRole.focus(), 100);
      }
    });
  });

  // --- Dashboard Event Bindings ---
  // Outdated raw text and JSON response tabs have been deprecated in favor of the clean AI Dashboard.

  // --- Handlers & Controllers ---

  function handleFileSelection(file) {
    clearMessages();
    
    // Extract Extension
    const fileName = file.name;
    const fileExtension = fileName.split('.').pop().toLowerCase();
    
    // FR-02: Format Validation (.pdf, .docx only)
    const validExtensions = ['pdf', 'docx'];
    if (!validExtensions.includes(fileExtension)) {
      showValidationMessage('Unsupported format! Only PDF and Word (.docx) files are supported.', 'error');
      fileInput.value = ''; // Reset input element
      return;
    }

    // FR-03: File Size Validation (Max 5MB)
    const maxSizeInBytes = 5 * 1024 * 1024; // 5 MB
    if (file.size > maxSizeInBytes) {
      showValidationMessage('File too large! Maximum allowed size is 5 MB.', 'error');
      fileInput.value = ''; // Reset input element
      return;
    }

    // Valid file selection success flow
    currentFile = file;
    simulateUploadProgress(file, fileExtension);
  }

  // FR-04: Upload Progress Indicator Simulation
  function simulateUploadProgress(file, extension) {
    isUploading = true;
    
    // Hide Drag & Drop Area to focus view on loading progress
    dropZone.classList.add('hidden');
    progressSection.classList.remove('hidden');
    
    // Populate loading details
    progressFileName.textContent = file.name;
    
    // Set matching small file icon
    if (extension === 'pdf') {
      progressFileIcon.style.color = '#e11d48'; // Red indicator
    } else {
      progressFileIcon.style.color = '#1d4ed8'; // Blue indicator
    }

    let progress = 0;
    progressBarFill.style.width = '0%';
    progressPercentage.textContent = '0%';
    progressStatusText.textContent = 'Initializing file streaming...';

    // Simulated progress increments
    uploadTimer = setInterval(() => {
      progress += Math.floor(Math.random() * 15) + 5; // increment randomly between 5% and 20%
      
      if (progress >= 100) {
        progress = 100;
        clearInterval(uploadTimer);
        
        progressBarFill.style.width = '100%';
        progressPercentage.textContent = '100%';
        progressStatusText.textContent = 'Verifying file integrity...';
        
        // Wait a tiny moment to complete animation, then swap to Preview section
        setTimeout(() => {
          showFilePreview(file, extension);
          isUploading = false;
        }, 600);
      } else {
        progressBarFill.style.width = `${progress}%`;
        progressPercentage.textContent = `${progress}%`;
        
        if (progress > 20 && progress < 60) {
          progressStatusText.textContent = 'Reading document properties...';
        } else if (progress >= 60 && progress < 90) {
          progressStatusText.textContent = 'Scanning buffer structure...';
        } else if (progress >= 90) {
          progressStatusText.textContent = 'Finalizing upload state...';
        }
      }
    }, 150);
  }

  // FR-06: File Preview Card setup
  function showFilePreview(file, extension) {
    progressSection.classList.add('hidden');
    previewCard.classList.remove('hidden');
    resetBtn.classList.remove('hidden');

    // Populate Details
    previewFilename.textContent = file.name;
    
    // File Size converter
    const sizeKB = file.size / 1024;
    if (sizeKB < 1024) {
      previewFilesize.textContent = `${sizeKB.toFixed(1)} KB`;
    } else {
      const sizeMB = sizeKB / 1024;
      previewFilesize.textContent = `${sizeMB.toFixed(1)} MB`;
    }

    // Set Dynamic File Tag and Styling
    if (extension === 'pdf') {
      previewFiletag.textContent = 'PDF';
      previewFiletag.className = 'file-tag tag-pdf';
      previewFileIconWrapper.className = 'preview-file-icon pdf';
      previewFileIconWrapper.innerHTML = pdfIconSvg;
    } else {
      previewFiletag.textContent = 'DOCX';
      previewFiletag.className = 'file-tag tag-docx';
      previewFileIconWrapper.className = 'preview-file-icon docx';
      previewFileIconWrapper.innerHTML = docxIconSvg;
    }

    // Enable Phase 1 Action Controls
    analyzeBtn.disabled = false;
    showValidationMessage('File uploaded and validated successfully!', 'success');
  }

  // FR-05: Analyze Resume Button flow connected to FastAPI Backend
  function triggerAnalysis() {
    if (!currentFile || isUploading) return;

    // Set button loading state
    analyzeBtn.disabled = true;
    btnSpinner.classList.remove('hidden');
    analyzeBtn.querySelector('.btn-text').textContent = 'Analyzing...';
    removeFileBtn.style.pointerEvents = 'none'; // Lock removal during analysis
    resetBtn.disabled = true;

    // Show results card with skeleton loader visible, hide main content
    if (resultsCard) {
      resultsCard.classList.remove('hidden');
      if (skeletonLoader) skeletonLoader.classList.remove('hidden');
      if (dashboardContent) dashboardContent.classList.add('hidden');
      // Scroll to the results card to show progress
      setTimeout(() => {
        resultsCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }

    // Clear previous validation messages
    clearMessages();

    const formData = new FormData();
    formData.append('file', currentFile);

    // Call FastAPI backend /upload endpoint
    fetch('http://localhost:8000/upload', {
      method: 'POST',
      body: formData
    })
    .then(async (response) => {
      if (!response.ok) {
        let errMsg = 'Failed to analyze the resume.';
        try {
          const errData = await response.json();
          if (errData && errData.detail) {
            errMsg = errData.detail;
          }
        } catch (e) {}
        throw new Error(errMsg);
      }
      return response.json();
    })
    .then((data) => {
      // Revert loading state
      resetButtonLoadingState();

      // Show completed message
      showValidationMessage('AI analysis completed successfully!', 'success');

      // Populate and transition results dashboard
      displayResults(data);
    })
    .catch((error) => {
      // Revert loading state
      resetButtonLoadingState();
      
      // Hide results card on error
      if (resultsCard) {
        resultsCard.classList.add('hidden');
      }

      // Show error message in upload zone
      showValidationMessage(error.message || 'Error connecting to backend API.', 'error');
    });
  }

  function resetButtonLoadingState() {
    analyzeBtn.querySelector('.btn-text').textContent = 'Analyze Resume';
    btnSpinner.classList.add('hidden');
    analyzeBtn.disabled = false;
    removeFileBtn.style.pointerEvents = 'auto';
    resetBtn.disabled = false;
  }

  // Populate and render Results Dashboard from parsed API response
  function displayResults(data) {
    if (!resultsCard) return;
    
    // Ensure we switch to the general resume analysis tab initially
    switchTab('resume-analysis');
    currentFileId = data.metadata ? data.metadata.file_id : null;
    const parsed = data.parsed_data || {};
    const ai = data.ai_analysis || {};
    
    // 1. Metadata Timestamp
    const timestampStr = data.metadata && data.metadata.extracted_at 
      ? new Date(data.metadata.extracted_at).toLocaleString() 
      : new Date().toLocaleString();
    resTimestamp.textContent = `AI analysis complete | File ID: ${data.metadata ? data.metadata.file_id : 'N/A'} | Timestamp: ${timestampStr}`;

    // 2. Profile Info Header (Name and Avatar)
    resName.textContent = parsed.name || 'Candidate Name';
    
    // Initials extraction
    if (parsed.name) {
      const nameParts = parsed.name.trim().split(/\s+/);
      if (nameParts.length >= 2) {
        profileInitials.textContent = (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase();
      } else if (nameParts.length === 1 && nameParts[0]) {
        profileInitials.textContent = nameParts[0].substring(0, 2).toUpperCase();
      } else {
        profileInitials.textContent = '??';
      }
    } else {
      profileInitials.textContent = '??';
    }

    // Email link
    const emailNode = resEmail.querySelector('.value');
    if (parsed.email) {
      emailNode.textContent = parsed.email;
      resEmail.classList.remove('hidden');
    } else {
      resEmail.classList.add('hidden');
    }

    // Phone link
    const phoneNode = resPhone.querySelector('.value');
    if (parsed.phone) {
      phoneNode.textContent = parsed.phone;
      resPhone.classList.remove('hidden');
    } else {
      resPhone.classList.add('hidden');
    }

    // Social & Professional links badges
    resSocialLinks.innerHTML = '';
    const links = parsed.links || {};
    const platformIcons = {
      linkedin: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>`,
      github: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/></svg>`,
      leetcode: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="9" y1="9" x2="15" y2="15"/><line x1="15" y1="9" x2="9" y2="15"/></svg>`,
      codeforces: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 20V10M12 20V4M6 20v-6"/></svg>`,
      hackerrank: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>`,
      portfolio: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>`
    };

    for (const [platform, url] of Object.entries(links)) {
      if (url) {
        const badge = document.createElement('a');
        badge.href = url.startsWith('http') ? url : `https://${url}`;
        badge.target = '_blank';
        badge.rel = 'noopener noreferrer';
        badge.className = 'profile-link-badge';
        badge.title = platform.charAt(0).toUpperCase() + platform.slice(1);
        badge.innerHTML = platformIcons[platform] || platformIcons.portfolio;
        resSocialLinks.appendChild(badge);
      }
    }

    // 3. AI Professional Summary Card
    if (ai.summary && ai.summary.trim()) {
      resSummary.textContent = ai.summary;
      resSummaryWrapper.classList.remove('hidden');
    } else {
      resSummaryWrapper.classList.add('hidden');
    }

    // 4. AI Skills Dashboard (Categorized)
    skillsIntelligenceDashboard.innerHTML = '';
    const techSkills = ai.technical_skills || [];
    const softSkills = ai.soft_skills || [];

    if (techSkills.length > 0) {
      const techGroup = document.createElement('div');
      techGroup.className = 'skills-group';
      techGroup.innerHTML = `
        <span class="skills-group-title">Technical Skills</span>
        <div class="skills-tags">
          ${techSkills.map(s => `<span class="skill-tag">${s}</span>`).join('')}
        </div>
      `;
      skillsIntelligenceDashboard.appendChild(techGroup);
    }

    if (softSkills.length > 0) {
      const softGroup = document.createElement('div');
      softGroup.className = 'skills-group';
      softGroup.innerHTML = `
        <span class="skills-group-title">Soft Skills</span>
        <div class="skills-tags">
          ${softSkills.map(s => `<span class="skill-tag">${s}</span>`).join('')}
        </div>
      `;
      skillsIntelligenceDashboard.appendChild(softGroup);
    }

    if (techSkills.length === 0 && softSkills.length === 0) {
      skillsIntelligenceDashboard.innerHTML = '<p class="empty-state-text">No skills detected on candidate resume.</p>';
    }

    // 5. Timeline Experience + Internships Layout
    timelineExperienceList.innerHTML = '';
    const experienceLines = parsed.experience || [];
    const internshipsLines = parsed.internships || [];
    const timelineItems = [];

    // Helper function to convert raw lines of text into structured timeline events
    function parseLinesToEvents(lines) {
      let currentItem = null;
      lines.forEach(line => {
        const trimmed = line.trim();
        if (!trimmed) return;
        
        // If it starts with typical bullet characters, it belongs to the active company header
        if (trimmed.startsWith('•') || trimmed.startsWith('-') || trimmed.startsWith('*')) {
          if (currentItem) {
            currentItem.bullets.push(trimmed.replace(/^[•\-\*]\s*/, ''));
          }
        } else {
          if (currentItem) {
            timelineItems.push(currentItem);
          }
          const parts = trimmed.split('|').map(p => p.trim());
          currentItem = {
            title: parts[0] || 'Position',
            subtitle: parts[1] || '',
            bullets: []
          };
        }
      });
      if (currentItem) {
        timelineItems.push(currentItem);
      }
    }

    parseLinesToEvents(experienceLines);
    parseLinesToEvents(internshipsLines);

    // If parsing structured timeline items failed, fallback to flat rendering
    if (timelineItems.length === 0) {
      const combinedLines = [...experienceLines, ...internshipsLines];
      if (combinedLines.length === 0) {
        timelineExperienceList.innerHTML = '<p class="empty-state-text">No work history or internship details listed.</p>';
      } else {
        combinedLines.forEach(line => {
          const card = document.createElement('div');
          card.className = 'timeline-item-card';
          card.innerHTML = `
            <div class="timeline-dot"></div>
            <div class="timeline-desc">${line}</div>
          `;
          timelineExperienceList.appendChild(card);
        });
      }
    } else {
      timelineItems.forEach(item => {
        const card = document.createElement('div');
        card.className = 'timeline-item-card';

        // Extract dates in parentheses (e.g., "(2024 - Present)")
        let dateStr = '';
        let subtitleText = item.subtitle;
        const dateMatch = item.subtitle.match(/\(([^)]+)\)/);
        if (dateMatch) {
          dateStr = dateMatch[1];
          subtitleText = item.subtitle.replace(/\([^)]+\)/, '').trim();
        }

        card.innerHTML = `
          <div class="timeline-dot"></div>
          <div class="timeline-header">
            <div>
              <h4 class="timeline-title">${item.title}</h4>
              ${subtitleText ? `<span class="timeline-subtitle">${subtitleText}</span>` : ''}
            </div>
            ${dateStr ? `<span class="timeline-date">${dateStr}</span>` : ''}
          </div>
          ${item.bullets.length > 0 ? `
            <ul class="timeline-desc" style="padding-left: 1.15rem; margin-top: 0.5rem; list-style-type: disc;">
              ${item.bullets.map(b => `<li style="margin-bottom:0.25rem;">${b}</li>`).join('')}
            </ul>
          ` : ''}
        `;
        timelineExperienceList.appendChild(card);
      });
    }

    // 6. Projects Portfolio Display (Clean Cards and AI Analyzed descriptions)
    projectsList.innerHTML = '';
    const projects = ai.projects || [];
    if (projects.length === 0) {
      projectsList.innerHTML = '<p class="empty-state-text">No project analysis details available.</p>';
    } else {
      projects.forEach((proj, idx) => {
        const card = document.createElement('div');
        card.className = 'project-card';
        // Add staggered animation delay
        card.style.animationDelay = `${idx * 0.15}s`;
        card.style.opacity = '0'; // Initial state for fade-in animation
        card.style.animation = 'slideUp var(--transition-normal) forwards';
        
        const techTags = proj.technologies && proj.technologies.length > 0
          ? `<div class="project-tech-tags">
               ${proj.technologies.map(tech => `<span class="project-tech-tag">${tech}</span>`).join('')}
             </div>`
          : '';

        card.innerHTML = `
          <div class="project-card-header">
            <h4 class="project-card-title">${proj.title || 'Featured Project'}</h4>
          </div>
          <p class="project-card-desc">${proj.description || ''}</p>
          ${techTags}
        `;
        projectsList.appendChild(card);
      });
    }

    // 7. Education Display
    educationListWrapper.innerHTML = '';
    const education = parsed.education || [];
    if (education.length === 0) {
      educationListWrapper.innerHTML = '<p class="empty-state-text">No education history listed.</p>';
    } else {
      education.forEach(eduItem => {
        const item = document.createElement('div');
        item.className = 'education-item';
        
        const parts = eduItem.split('|').map(p => p.trim());
        if (parts.length > 1) {
          item.innerHTML = `
            <h4 class="timeline-title">${parts[0]}</h4>
            <div style="display:flex; justify-content:space-between; margin-top:0.25rem; font-size:0.85rem; color:var(--text-muted);">
              <span>${parts[1]}</span>
              ${parts[2] ? `<span class="timeline-date">${parts[2]}</span>` : ''}
            </div>
          `;
        } else {
          item.innerHTML = `<p class="timeline-desc">${eduItem}</p>`;
        }
        educationListWrapper.appendChild(item);
      });
    }

    // 8. Strengths Insights Display
    strengthsListUl.innerHTML = '';
    const strengths = ai.strengths || [];
    if (strengths.length === 0) {
      strengthsListUl.innerHTML = '<li class="empty-state-text">No strengths identified.</li>';
    } else {
      strengths.forEach(strVal => {
        const li = document.createElement('li');
        li.className = 'insight-item';
        li.textContent = strVal;
        strengthsListUl.appendChild(li);
      });
    }

    // 9. Weaknesses (Areas For Improvement) Insights Display
    weaknessesListUl.innerHTML = '';
    const weaknesses = ai.weaknesses || [];
    if (weaknesses.length === 0) {
      weaknessesListUl.innerHTML = '<li class="empty-state-text">No gaps identified in the analysis.</li>';
    } else {
      weaknesses.forEach(weakVal => {
        const li = document.createElement('li');
        li.className = 'insight-item';
        li.textContent = weakVal;
        weaknessesListUl.appendChild(li);
      });
    }

    // Swap loading state to dashboard presentation with smooth animations
    if (skeletonLoader) skeletonLoader.classList.add('hidden');
    if (dashboardContent) {
      dashboardContent.classList.remove('hidden');
      // Scroll dashboard into view
      setTimeout(() => {
        resultsCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }

  // Reset helper
  function resetState() {
    // Reset tabs active state
    switchTab('resume-analysis');

    clearInterval(uploadTimer);
    isUploading = false;
    currentFile = null;
    currentFileId = null;
    fileInput.value = '';

    // Hide/Show correct nodes
    dropZone.classList.remove('hidden');
    progressSection.classList.add('hidden');
    previewCard.classList.add('hidden');
    resetBtn.classList.add('hidden');
    
    if (resultsCard) {
      resultsCard.classList.add('hidden');
    }

    // Hide ATS results & loader
    if (atsResultsContainer) atsResultsContainer.classList.add('hidden');
    if (atsSkeletonLoader) atsSkeletonLoader.classList.add('hidden');
    if (atsTargetRole) atsTargetRole.value = '';
    if (atsJobDesc) atsJobDesc.value = '';
    
    // Reset experience level buttons
    expButtons.forEach(btn => {
      btn.classList.remove('active');
      if (btn.getAttribute('data-value') === 'Fresher') {
        btn.classList.add('active');
      }
    });
    selectedExperience = 'Fresher';

    // Reset analyze button states
    analyzeBtn.disabled = true;
    btnSpinner.classList.add('hidden');
    analyzeBtn.querySelector('.btn-text').textContent = 'Upload Resume';

    clearMessages();
  }

  // Message banners helper
  function showValidationMessage(message, type) {
    messageBox.className = 'message-box'; // reset classes
    messageBox.classList.add(type);
    messageText.textContent = message;

    if (type === 'error') {
      messageIcon.innerHTML = errorSvg;
    } else if (type === 'info') {
      messageIcon.innerHTML = infoSvg;
    } else {
      messageIcon.innerHTML = successSvg;
    }
  }

  function clearMessages() {
    messageBox.classList.add('hidden');
    messageText.textContent = '';
    messageIcon.innerHTML = '';
  }

  function renderAtsReport(report) {
    // 1. Overall Score Card
    const score = report.ats_score || 0;
    const status = report.readiness_status || 'Strong';
    
    // SVG circular progress bar: stroke-dasharray is 263.89
    const circleBar = document.getElementById('ats-circle-bar');
    if (circleBar) {
      const offset = 263.89 * (1 - score / 100);
      circleBar.style.strokeDashoffset = offset;
    }
    
    const scoreText = document.getElementById('ats-score-text');
    if (scoreText) {
      scoreText.textContent = score;
    }
    
    const statusTitle = document.getElementById('ats-readiness-status');
    if (statusTitle) {
      statusTitle.textContent = status;
    }
    
    const statusDesc = document.getElementById('ats-readiness-desc');
    if (statusDesc) {
      let topPercent = 95;
      if (score >= 85) {
        topPercent = Math.max(2, Math.round(15 - (score - 85) * 0.8));
      } else if (score >= 70) {
        topPercent = Math.round(35 - (score - 70) * 1.3);
      } else if (score >= 55) {
        topPercent = Math.round(65 - (score - 55) * 2.0);
      } else {
        topPercent = Math.round(98 - score * 0.6);
      }
      statusDesc.innerHTML = `Your resume is in the <strong>top ${topPercent}%</strong> of applicants for <strong>${report.target_role}</strong>.`;
    }

    // 2. Category Breakdown
    const breakdownList = document.getElementById('ats-breakdown-list');
    if (breakdownList) {
      breakdownList.innerHTML = '';
      
      function getProgressBarColor(categoryScore) {
        if (categoryScore >= 85) return 'var(--success)';
        if (categoryScore >= 70) return '#3b82f6';
        if (categoryScore >= 55) return '#f59e0b';
        return 'var(--danger)';
      }
      
      const categories = Object.keys(report.breakdown || {});
      categories.forEach(cat => {
        const catVal = report.breakdown[cat];
        const color = getProgressBarColor(catVal);
        
        const item = document.createElement('div');
        item.className = 'category-progress-item';
        item.innerHTML = `
          <div class="category-progress-header">
            <span class="category-progress-label">${cat}</span>
            <span class="category-progress-val" style="color: ${color};">${catVal}%</span>
          </div>
          <div class="category-progress-bar-bg">
            <div class="category-progress-bar-fill" style="width: ${catVal}%; background-color: ${color};"></div>
          </div>
        `;
        breakdownList.appendChild(item);
      });
    }

    const breakdownMeta = document.getElementById('ats-breakdown-meta');
    if (breakdownMeta) {
      const modeText = report.job_description_provided ? 'JD MATCH MODE' : 'GENERIC ROLE EXPECTATIONS';
      breakdownMeta.innerHTML = `
        <span class="badge" style="background: var(--bg-main); border: 1px solid var(--border-color); color: var(--text-muted); font-size: 0.65rem;">LEVEL: ${report.experience_level.toUpperCase()}</span>
        <span class="badge" style="background: var(--bg-main); border: 1px solid var(--border-color); color: var(--text-muted); font-size: 0.65rem;">MODE: ${modeText}</span>
        <span class="badge" style="background: var(--bg-main); border: 1px solid var(--border-color); color: var(--text-muted); font-size: 0.65rem;">PARSED CLEANLY</span>
      `;
    }

    // 3. ATS Score Calculation View
    const weightedProgressBar = document.getElementById('ats-weighted-progress-bar');
    if (weightedProgressBar) {
      weightedProgressBar.innerHTML = `
        <div class="weighted-seg weighted-seg-1" style="width: 20%;" title="Resume Completeness: 20%"></div>
        <div class="weighted-seg weighted-seg-2" style="width: 20%;" title="Skills Quality: 20%"></div>
        <div class="weighted-seg weighted-seg-3" style="width: 15%;" title="Projects Quality: 15%"></div>
        <div class="weighted-seg weighted-seg-4" style="width: 15%;" title="Experience Quality: 15%"></div>
        <div class="weighted-seg weighted-seg-5" style="width: 15%;" title="Keyword Optimization: 15%"></div>
        <div class="weighted-seg weighted-seg-6" style="width: 5%;" title="Certifications: 5%"></div>
        <div class="weighted-seg weighted-seg-7" style="width: 5%;" title="ATS Readability: 5%"></div>
        <div class="weighted-seg weighted-seg-8" style="width: 5%;" title="Achievement Impact: 5%"></div>
      `;
    }

    const weightedLegend = document.getElementById('ats-weighted-legend');
    if (weightedLegend) {
      const legendData = [
        { name: 'Completeness', weight: 20, cls: 'weighted-seg-1' },
        { name: 'Skills Quality', weight: 20, cls: 'weighted-seg-2' },
        { name: 'Projects Quality', weight: 15, cls: 'weighted-seg-3' },
        { name: 'Experience Quality', weight: 15, cls: 'weighted-seg-4' },
        { name: 'Keywords Match', weight: 15, cls: 'weighted-seg-5' },
        { name: 'Certifications', weight: 5, cls: 'weighted-seg-6' },
        { name: 'ATS Readability', weight: 5, cls: 'weighted-seg-7' },
        { name: 'Achievement Impact', weight: 5, cls: 'weighted-seg-8' }
      ];
      weightedLegend.innerHTML = legendData.map(item => `
        <div class="legend-item">
          <span class="legend-color-dot ${item.cls}"></span>
          <span>${item.name} ${item.weight}%</span>
        </div>
      `).join('');
    }

    const calcGrid = document.getElementById('ats-calculation-grid');
    if (calcGrid) {
      calcGrid.innerHTML = '';
      const order = [
        { key: 'Resume Completeness', title: 'Completeness', weight: 20 },
        { key: 'Skills Quality', title: 'Skills Match', weight: 20 },
        { key: 'Projects Quality', title: 'Projects', weight: 15 },
        { key: 'Experience Quality', title: 'Experience', weight: 15 },
        { key: 'Keyword Optimization', title: 'Keywords', weight: 15 },
        { key: 'Certifications', title: 'Certifications', weight: 5 },
        { key: 'ATS Readability', title: 'Readability', weight: 5 },
        { key: 'Achievement Impact', title: 'Impact', weight: 5 }
      ];
      
      order.forEach(item => {
        const score = report.breakdown[item.key] || 0;
        const contrib = report.contributions[item.key] || 0;
        const card = document.createElement('div');
        card.className = 'calc-card';
        
        let statusBadge = 'STRONG';
        let statusCls = 'style="color: var(--success);"';
        if (score >= 85) {
          statusBadge = 'STRONG';
        } else if (score >= 55) {
          statusBadge = 'AVERAGE';
          statusCls = 'style="color: #d97706;"';
        } else {
          statusBadge = 'NEEDS WORK';
          statusCls = 'style="color: var(--danger);"';
        }
        
        card.innerHTML = `
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.15rem;">
            <span class="calc-card-title">${item.title}</span>
            <span style="font-size: 0.6rem; font-weight: 700; ${statusCls}">${statusBadge}</span>
          </div>
          <div class="calc-card-score">${score}/100</div>
          <div style="font-size: 0.7rem; color: var(--text-light); font-weight: 500;">weight ×${item.weight}%</div>
          <div class="calc-card-contrib">+${contrib.toFixed(1)} pts</div>
        `;
        calcGrid.appendChild(card);
      });
    }

    // 4. Keyword Analysis Match
    const detKw = report.detected_keywords || [];
    const missKw = report.missing_keywords || [];
    const kwTotal = detKw.length + missKw.length;
    
    const kwMatchVal = document.getElementById('ats-keywords-match-ratio-val');
    if (kwMatchVal) {
      kwMatchVal.textContent = `${detKw.length}/${kwTotal}`;
    }
    
    const detectedGroup = document.getElementById('ats-detected-keywords');
    if (detectedGroup) {
      if (detKw.length === 0) {
        detectedGroup.innerHTML = '<span style="font-size:0.85rem; color:var(--text-light); font-style:italic;">No target keywords detected.</span>';
      } else {
        detectedGroup.innerHTML = detKw.map(kw => `
          <span class="keyword-chip matched">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            ${kw}
          </span>
        `).join('');
      }
    }
    
    const missingGroup = document.getElementById('ats-missing-keywords');
    if (missingGroup) {
      if (missKw.length === 0) {
        missingGroup.innerHTML = '<span style="font-size:0.85rem; color:var(--success); font-weight: 600;">No missing keywords! Excellent coverage.</span>';
      } else {
        missingGroup.innerHTML = missKw.map(kw => `
          <span class="keyword-chip missing" title="Suggested keyword">+ ${kw}</span>
        `).join('');
      }
    }

    // 5. Role Alignment Analysis
    const alignmentContent = document.getElementById('ats-alignment-content');
    if (alignmentContent) {
      const matchedSkills = report.matched_skills || [];
      const missingSkills = report.missing_skills || [];
      
      if (report.job_description_provided) {
        const skillsTotal = matchedSkills.length + missingSkills.length;
        const skillsRatio = skillsTotal > 0 ? (matchedSkills.length / skillsTotal) : 0.8;
        const keywordsRatio = kwTotal > 0 ? (detKw.length / kwTotal) : 0.8;
        const jdMatchScore = Math.round((skillsRatio * 0.6 + keywordsRatio * 0.4) * 100);
        
        alignmentContent.innerHTML = `
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 0.25rem;">
            <span style="font-weight:700; font-size:0.95rem; color: var(--text-main);">JD Match Score</span>
            <span style="font-weight:800; font-size:1.2rem; color:var(--primary); font-family: var(--font-header);">${jdMatchScore}%</span>
          </div>
          <div class="category-progress-bar-bg" style="height:10px;">
            <div class="category-progress-bar-fill" style="width: ${jdMatchScore}%; background-color: var(--primary); transition: width 0.8s ease-in-out;"></div>
          </div>
          
          <div style="display: flex; flex-direction: column; gap: 0.75rem; margin-top: 0.5rem; font-size:0.85rem; line-height: 1.4;">
            <div>
              <strong style="color: var(--success-text); display: block; margin-bottom: 0.2rem;">Matching Skills:</strong>
              ${matchedSkills.length > 0 
                ? `<div style="display:flex; flex-wrap:wrap; gap:0.25rem;">${matchedSkills.map(s => `<span class="skill-tag" style="padding: 0.2rem 0.5rem; font-size: 0.75rem; background-color: #ecfdf5; color: #059669; border-color: #a7f3d0;">${s}</span>`).join('')}</div>`
                : '<span style="color:var(--text-light); font-style:italic;">None detected</span>'
              }
            </div>
            <div>
              <strong style="color: var(--danger-text); display: block; margin-bottom: 0.2rem;">Missing Role Skills:</strong>
              ${missingSkills.length > 0 
                ? `<div style="display:flex; flex-wrap:wrap; gap:0.25rem;">${missingSkills.map(s => `<span class="skill-tag" style="padding: 0.2rem 0.5rem; font-size: 0.75rem; background-color: #fff1f2; color: #e11d48; border-color: #fecdd3;">${s}</span>`).join('')}</div>`
                : '<span style="color:var(--success); font-weight:600;">No skills gaps!</span>'
              }
            </div>
          </div>
        `;
      } else {
        const skillsScore = report.breakdown["Skills Quality"] || 75;
        alignmentContent.innerHTML = `
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 0.25rem;">
            <span style="font-weight:700; font-size:0.95rem; color: var(--text-main);">Role Alignment Score</span>
            <span style="font-weight:800; font-size:1.2rem; color:var(--primary); font-family: var(--font-header);">${skillsScore}%</span>
          </div>
          <div class="category-progress-bar-bg" style="height:10px;">
            <div class="category-progress-bar-fill" style="width: ${skillsScore}%; background-color: var(--primary); transition: width 0.8s ease-in-out;"></div>
          </div>
          
          <p style="font-size:0.85rem; color:var(--text-muted); line-height: 1.4; margin-top: 0.25rem;">
            Evaluated against general industry expectations for a <strong>${report.experience_level}</strong> role as a <strong>${report.target_role}</strong>.
          </p>

          <div style="display: flex; flex-direction: column; gap: 0.75rem; margin-top: 0.25rem; font-size:0.85rem; line-height: 1.4;">
            <div>
              <strong style="color: var(--text-main); display: block; margin-bottom: 0.2rem;">Missing Competencies:</strong>
              ${missingSkills.length > 0 
                ? `<div style="display:flex; flex-wrap:wrap; gap:0.25rem;">${missingSkills.map(s => `<span class="skill-tag" style="padding: 0.2rem 0.5rem; font-size: 0.75rem; background-color: #fffbeb; color: #d97706; border-color: #fde68a;">${s}</span>`).join('')}</div>`
                : '<span style="color:var(--text-light); font-style:italic;">None listed</span>'
              }
            </div>
            <div>
              <strong style="color: var(--text-main); display: block; margin-bottom: 0.2rem;">Role-Specific Recommendations:</strong>
              <div class="section-audit-suggestion-item" style="margin-top: 0.15rem; font-size: 0.8rem; background-color: var(--primary-light); color: var(--primary); padding: 0.4rem 0.6rem; border-radius: 6px; border-left: 3px solid var(--primary);">
                Ensure your resume highlights core competencies like ${missKw.slice(0, 3).join(', ') || 'relevant technologies'}.
              </div>
            </div>
          </div>
        `;
      }
    }

    // 6. Section-wise Resume Analysis
    const missingB = report.missing_sections || [];
    const missingBanner = document.getElementById('ats-missing-sections-banner');
    const missingList = document.getElementById('ats-missing-sections-list');
    
    if (missingB.length > 0) {
      if (missingBanner) missingBanner.classList.remove('hidden');
      if (missingList) missingList.textContent = missingB.join(', ');
    } else {
      if (missingBanner) missingBanner.classList.add('hidden');
    }

    const auditsList = document.getElementById('ats-section-audits-list');
    if (auditsList) {
      auditsList.innerHTML = '';
      
      const sections = Object.keys(report.section_analysis || {});
      sections.forEach(secName => {
        const secData = report.section_analysis[secName];
        const card = document.createElement('div');
        card.className = 'section-audit-card';
        
        const numIssues = secData.issues ? secData.issues.length : 0;
        let headerSubtext = '';
        let borderLeftColor = '#10b981';
        
        if (numIssues === 0) {
          headerSubtext = '<span style="color:var(--success); font-size:0.8rem; font-weight:600;">No issues — parsed cleanly</span>';
        } else {
          headerSubtext = `<span style="color:#d97706; font-size:0.8rem; font-weight:600;">${numIssues} ${numIssues === 1 ? 'issue' : 'issues'} to address</span>`;
          borderLeftColor = numIssues >= 2 ? 'var(--danger)' : '#f59e0b';
        }
        
        let issuesHtml = '';
        if (numIssues > 0) {
          issuesHtml = '<div style="display:flex; flex-direction:column; gap:0.4rem; margin-top:0.25rem;">' +
            secData.issues.map((iss, index) => {
              const badgeType = index === 0 && numIssues >= 2 ? 'critical' : 'warning';
              return `
                <div class="section-audit-issue-item">
                  <span class="section-audit-issue-badge ${badgeType}">${badgeType}</span>
                  <span>${iss}</span>
                </div>
              `;
            }).join('') +
            '</div>';
        }
        
        let suggestionsHtml = '';
        if (secData.suggestions && secData.suggestions.length > 0) {
          suggestionsHtml = '<div style="display:flex; flex-direction:column; gap:0.4rem; margin-top:0.4rem;">' +
            secData.suggestions.map(sug => `
              <div class="section-audit-suggestion-item">
                <strong>Suggestion:</strong> ${sug}
              </div>
            `).join('') +
            '</div>';
        }
        
        card.style.borderLeft = `4px solid ${borderLeftColor}`;
        card.innerHTML = `
          <div class="section-audit-header" style="border-left:none; padding-left:0;">
            <div>
              <h4 class="section-audit-title">${secName}</h4>
              <div style="margin-top:0.15rem;">${headerSubtext}</div>
            </div>
            <div class="section-audit-score">${secData.score} <span style="font-size:0.65rem; color:var(--text-light); font-weight:normal;">SCORE</span></div>
          </div>
          ${issuesHtml}
          ${suggestionsHtml}
        `;
        auditsList.appendChild(card);
      });
    }

    // 7. Optimization Roadmap
    const roadmapList = document.getElementById('ats-roadmap-list');
    if (roadmapList) {
      roadmapList.innerHTML = '';
      const roadmapData = report.roadmap || [];
      if (roadmapData.length === 0) {
        roadmapList.innerHTML = '<p class="empty-state-text">Your resume is perfectly optimized. No changes recommended!</p>';
      } else {
        const sortedRoadmap = [...roadmapData].sort((a, b) => a.priority - b.priority);
        sortedRoadmap.forEach(item => {
          const card = document.createElement('div');
          card.className = 'roadmap-card';
          card.innerHTML = `
            <div class="roadmap-priority-badge p${item.priority}">P${item.priority}</div>
            <div class="roadmap-content">
              <h4 class="roadmap-title">${item.issue}</h4>
              <p class="roadmap-why"><strong>Why it matters:</strong> ${item.why_it_matters}</p>
              <p class="roadmap-how"><strong>How to improve:</strong> ${item.how_to_improve}</p>
            </div>
          `;
          roadmapList.appendChild(card);
        });
      }
    }
  }
});
