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

  // --- New Results Dashboard DOM Selectors ---
  const resultsCard = document.getElementById('results-card');
  const resTimestamp = document.getElementById('res-timestamp');
  const resName = document.getElementById('res-name');
  const profileInitials = document.getElementById('profile-initials');
  const resEmail = document.getElementById('res-email');
  const resPhone = document.getElementById('res-phone');
  const resSocialLinks = document.getElementById('res-social-links');
  const resSummaryWrapper = document.getElementById('res-summary-wrapper');
  const resSummary = document.getElementById('res-summary');
  const resSkillsWrapper = document.getElementById('res-skills-wrapper');
  const resTimelineWrapper = document.getElementById('res-timeline-wrapper');
  const jsonCodeBlock = document.getElementById('json-code-block');
  const rawTextBlock = document.getElementById('raw-text-block');
  const btnCopyJson = document.getElementById('btn-copy-json');
  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');

  // --- State Variables ---
  let currentFile = null;
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

  // --- Dashboard Event Bindings ---
  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      tabButtons.forEach(b => b.classList.remove('active'));
      tabContents.forEach(c => c.classList.remove('active'));
      
      btn.classList.add('active');
      const targetTab = btn.getAttribute('data-tab');
      const activeTabContent = document.getElementById(targetTab);
      if (activeTabContent) {
        activeTabContent.classList.add('active');
      }
    });
  });

  if (btnCopyJson) {
    btnCopyJson.addEventListener('click', () => {
      const jsonText = jsonCodeBlock.textContent;
      if (!jsonText) return;
      
      navigator.clipboard.writeText(jsonText).then(() => {
        const btnTextNode = btnCopyJson.querySelector('.copy-btn-text');
        const prevText = btnTextNode.textContent;
        btnTextNode.textContent = 'Copied!';
        
        setTimeout(() => {
          btnTextNode.textContent = prevText;
        }, 2000);
      }).catch(err => {
        console.error('Failed to copy JSON text: ', err);
        alert('Failed to copy to clipboard. Please select and copy manually.');
      });
    });
  }

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

    // Set button state directly to Upload Complete
    analyzeBtn.disabled = true;
    btnSpinner.classList.add('hidden');
    analyzeBtn.querySelector('.btn-text').textContent = 'Upload Complete';
    removeFileBtn.style.pointerEvents = 'none'; // Lock removal during analysis
    resetBtn.disabled = true;

    // Hide previous results if card exists
    if (resultsCard) {
      resultsCard.classList.add('hidden');
    }

    // Display popup message immediately
    alert('Resume is uploaded');

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
        let errMsg = 'Failed to upload the resume.';
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
      showValidationMessage('Resume uploaded successfully!', 'success');

      // Popup message after uploading succeeds
      alert('Resume is uploaded');

      // Populate results dashboard
      displayResults(data);
    })
    .catch((error) => {
      // Revert loading state
      resetButtonLoadingState();
      
      // Show error message
      showValidationMessage(error.message || 'Error connecting to backend API.', 'error');
    });
  }

  function resetButtonLoadingState() {
    analyzeBtn.querySelector('.btn-text').textContent = 'Upload Resume';
    btnSpinner.classList.add('hidden');
    analyzeBtn.disabled = false;
    removeFileBtn.style.pointerEvents = 'auto';
    resetBtn.disabled = false;
  }

  // Populate and render Results Dashboard from parsed API response
  function displayResults(data) {
    if (!resultsCard) return;
    const parsed = data.parsed_data || {};
    
    // 1. Metadata Timestamp
    const timestampStr = data.metadata && data.metadata.extracted_at 
      ? new Date(data.metadata.extracted_at).toLocaleString() 
      : new Date().toLocaleString();
    resTimestamp.textContent = `Analyzed: ${timestampStr} | File ID: ${data.metadata ? data.metadata.file_id : 'N/A'}`;

    // 2. Profile Info Header
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
    const platformSVGs = {
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
        badge.innerHTML = platformSVGs[platform] || platformSVGs.portfolio;
        resSocialLinks.appendChild(badge);
      }
    }

    // 3. Summary Block
    if (parsed.summary && parsed.summary.trim()) {
      resSummary.textContent = parsed.summary;
      resSummaryWrapper.classList.remove('hidden');
    } else {
      resSummaryWrapper.classList.add('hidden');
    }

    // 4. Skills Groups
    resSkillsWrapper.innerHTML = '';
    const skillsGroups = [
      { name: 'Technical Skills', key: 'technical_skills' },
      { name: 'Soft Skills', key: 'soft_skills' },
      { name: 'Skills & Proficiencies', key: 'skills' }
    ];

    let hasAnySkills = false;
    skillsGroups.forEach(group => {
      const list = parsed[group.key] || [];
      if (list.length > 0) {
        hasAnySkills = true;
        const groupDiv = document.createElement('div');
        groupDiv.className = 'skills-group';
        
        const titleSpan = document.createElement('span');
        titleSpan.className = 'skills-group-title';
        titleSpan.textContent = group.name;
        groupDiv.appendChild(titleSpan);

        const tagsDiv = document.createElement('div');
        tagsDiv.className = 'skills-tags';

        list.forEach(skill => {
          const tag = document.createElement('span');
          tag.className = 'skill-tag';
          tag.textContent = skill;
          tagsDiv.appendChild(tag);
        });

        groupDiv.appendChild(tagsDiv);
        resSkillsWrapper.appendChild(groupDiv);
      }
    });

    if (!hasAnySkills) {
      const fallback = document.createElement('p');
      fallback.style.color = 'var(--text-light)';
      fallback.style.fontSize = '0.9rem';
      fallback.textContent = 'No skills explicitly parsed.';
      resSkillsWrapper.appendChild(fallback);
    }

    // 5. Timeline Wrapper (Education, Experience, Projects, etc.)
    resTimelineWrapper.innerHTML = '';
    const timelineSections = [
      { name: 'Professional Experience', key: 'experience' },
      { name: 'Internships & Training', key: 'internships' },
      { name: 'Projects', key: 'projects' },
      { name: 'Education', key: 'education' },
      { name: 'Certifications', key: 'certifications' },
      { name: 'Achievements & Awards', key: 'achievements' },
      { name: 'Publications', key: 'publications' },
      { name: 'Languages', key: 'languages' },
      { name: 'Interests & Activities', key: 'interests' }
    ];

    let hasAnyTimeline = false;
    timelineSections.forEach(sec => {
      const items = parsed[sec.key] || [];
      if (items.length > 0) {
        hasAnyTimeline = true;
        
        const blockDiv = document.createElement('div');
        blockDiv.className = 'timeline-section-block';

        const titleDiv = document.createElement('div');
        titleDiv.className = 'timeline-section-title';
        titleDiv.textContent = sec.name;
        blockDiv.appendChild(titleDiv);

        const listDiv = document.createElement('div');
        listDiv.className = 'timeline-list';

        items.forEach(item => {
          const itemDiv = document.createElement('div');
          itemDiv.className = 'timeline-item';
          itemDiv.textContent = item;
          listDiv.appendChild(itemDiv);
        });

        blockDiv.appendChild(listDiv);
        resTimelineWrapper.appendChild(blockDiv);
      }
    });

    // Custom headers from other_sections
    const otherSections = parsed.other_sections || {};
    for (const [secName, items] of Object.entries(otherSections)) {
      if (items && items.length > 0) {
        hasAnyTimeline = true;

        const blockDiv = document.createElement('div');
        blockDiv.className = 'timeline-section-block';

        const titleDiv = document.createElement('div');
        titleDiv.className = 'timeline-section-title';
        titleDiv.textContent = secName;
        blockDiv.appendChild(titleDiv);

        const listDiv = document.createElement('div');
        listDiv.className = 'timeline-list';

        items.forEach(item => {
          const itemDiv = document.createElement('div');
          itemDiv.className = 'timeline-item';
          itemDiv.textContent = item;
          listDiv.appendChild(itemDiv);
        });

        blockDiv.appendChild(listDiv);
        resTimelineWrapper.appendChild(blockDiv);
      }
    }

    if (!hasAnyTimeline) {
      const fallback = document.createElement('p');
      fallback.style.color = 'var(--text-light)';
      fallback.style.fontSize = '0.9rem';
      fallback.textContent = 'No structured timeline data found.';
      resTimelineWrapper.appendChild(fallback);
    }

    // 6. JSON View Tab
    jsonCodeBlock.textContent = JSON.stringify(data, null, 2);

    // 7. Raw Text Tab
    rawTextBlock.textContent = data.raw_text || '';

    // Remove hidden class and scroll results dashboard into view
    resultsCard.classList.remove('hidden');
    
    // Small timeout to let rendering trigger and then scroll
    setTimeout(() => {
      resultsCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  }

  // Reset helper
  function resetState() {
    clearInterval(uploadTimer);
    isUploading = false;
    currentFile = null;
    fileInput.value = '';

    // Hide/Show correct nodes
    dropZone.classList.remove('hidden');
    progressSection.classList.add('hidden');
    previewCard.classList.add('hidden');
    resetBtn.classList.add('hidden');
    if (resultsCard) {
      resultsCard.classList.add('hidden');
    }

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
});
