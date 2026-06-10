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

  // FR-05: Analyze Resume Button flow
  function triggerAnalysis() {
    if (!currentFile || isUploading) return;

    // Show loading state on button
    analyzeBtn.disabled = true;
    btnSpinner.classList.remove('hidden');
    analyzeBtn.querySelector('.btn-text').textContent = 'Analyzing...';
    removeFileBtn.style.pointerEvents = 'none'; // Lock removal during analysis
    resetBtn.disabled = true;

    // Simulate backend analysis delay
    setTimeout(() => {
      // Revert loading state
      analyzeBtn.querySelector('.btn-text').textContent = 'Analyze Resume';
      btnSpinner.classList.add('hidden');
      analyzeBtn.disabled = false;
      removeFileBtn.style.pointerEvents = 'auto';
      resetBtn.disabled = false;

      // Show completed message for frontend validations
      showValidationMessage('Resume successfully submitted and queued for AI analysis!', 'success');
    }, 1500);
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

    // Reset analyze button states
    analyzeBtn.disabled = true;
    btnSpinner.classList.add('hidden');
    analyzeBtn.querySelector('.btn-text').textContent = 'Analyze Resume';

    clearMessages();
  }

  // Message banners helper
  function showValidationMessage(message, type) {
    messageBox.className = 'message-box'; // reset classes
    messageBox.classList.add(type);
    messageText.textContent = message;

    if (type === 'error') {
      messageIcon.innerHTML = errorSvg;
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
