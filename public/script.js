// DOM Elements
const fileInput = document.getElementById('fileInput');
const dragDropArea = document.getElementById('dragDropArea');
const previewSection = document.getElementById('previewSection');
const imagePreviewContainer = document.getElementById('imagePreviewContainer');
const optionsSection = document.getElementById('optionsSection');
const actionSection = document.getElementById('actionSection');
const downloadSection = document.getElementById('downloadSection');
const errorMessage = document.getElementById('errorMessage');
const successMessage = document.getElementById('successMessage');
const convertBtn = document.getElementById('convertBtn');
const clearImagesBtn = document.getElementById('clearImagesBtn');
const convertAnotherBtn = document.getElementById('convertAnotherBtn');
const downloadLink = document.getElementById('downloadLink');
const loadingSpinner = document.getElementById('loadingSpinner');
const loadingText = document.getElementById('loadingText');

// Verify all DOM elements exist
if (!fileInput || !dragDropArea || !previewSection || !imagePreviewContainer || !optionsSection || !actionSection || !downloadSection) {
    console.error('Missing critical DOM elements!', {
        fileInput: !!fileInput,
        dragDropArea: !!dragDropArea,
        previewSection: !!previewSection,
        imagePreviewContainer: !!imagePreviewContainer,
        optionsSection: !!optionsSection,
        actionSection: !!actionSection,
        downloadSection: !!downloadSection
    });
}

// File storage and rotation tracking
let selectedFiles = [];
let rotations = []; // Track rotation for each image (in degrees)
let isConverting = false;
let sortable = null; // SortableJS instance

// PDF Options State
let selectedOptions = {
    orientation: 'portrait',
    size: 'A4',
    margin: 0,
    quality: 80  // NEW: Default to balanced quality
};

// Option display labels
const orientationLabels = { portrait: 'Portrait', landscape: 'Landscape' };
const marginLabels = { 0: 'No Margin', 10: 'Small Margin', 20: 'Medium Margin' };
const qualityLabels = { 60: 'Low Quality', 80: 'Balanced', 95: 'High Quality' };

// Event Listeners
fileInput.addEventListener('change', handleFileSelect);

// Handle label click for file selection
const fileLabel = document.querySelector('label[for="fileInput"]');
if (fileLabel) {
    fileLabel.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        fileInput.click();
    });
}

// Handle drag & drop area
dragDropArea.addEventListener('dragover', handleDragOver);
dragDropArea.addEventListener('dragleave', handleDragLeave);
dragDropArea.addEventListener('drop', handleFileDrop);

// Convert and other buttons
convertBtn.addEventListener('click', convertToPDF);
clearImagesBtn.addEventListener('click', clearAllImages);
convertAnotherBtn.addEventListener('click', resetForm);

// Start over button (NEW)
const clearAllAfterDownloadBtn = document.getElementById('clearAllAfterDownloadBtn');
if (clearAllAfterDownloadBtn) {
    clearAllAfterDownloadBtn.addEventListener('click', () => {
        selectedFiles = [];
        rotations = [];
        fileInput.value = '';
        updatePreview();
        updateActionButtons();
        downloadSection.style.display = 'none';
        hideMessages();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Escape to hide error/success messages
    if (e.key === 'Escape') {
        hideMessages();
    }
    // Enter to convert when ready (if button is enabled)
    if (e.key === 'Enter' && !convertBtn.disabled && !isConverting) {
        convertToPDF();
    }
});

// PDF Options Event Listeners
// Orientation buttons
document.querySelectorAll('.orientation-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        document.querySelectorAll('.orientation-btn').forEach(b => b.classList.remove('active'));
        e.target.closest('button').classList.add('active');
        selectedOptions.orientation = e.target.closest('button').dataset.value;
        updateOptionsSummary();
    });
});

// Page size dropdown
const pageSizeSelect = document.getElementById('pageSizeSelect');
if (pageSizeSelect) {
    pageSizeSelect.addEventListener('change', (e) => {
        selectedOptions.size = e.target.value;
        updateOptionsSummary();
    });
}

// Margin buttons
document.querySelectorAll('.margin-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        document.querySelectorAll('.margin-btn').forEach(b => b.classList.remove('active'));
        e.target.closest('button').classList.add('active');
        selectedOptions.margin = parseInt(e.target.closest('button').dataset.value);
        updateOptionsSummary();
    });
});

// Quality buttons (NEW)
document.querySelectorAll('.quality-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        document.querySelectorAll('.quality-btn').forEach(b => b.classList.remove('active'));
        e.target.closest('button').classList.add('active');
        selectedOptions.quality = parseInt(e.target.closest('button').dataset.value);
        updateOptionsSummary();
    });
});

// Handle file selection from input (single file at a time)
function handleFileSelect(e) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    // Only take the first file (enforce single selection)
    const file = files[0];
    
    addFiles([file]);
    
    // Reset input so same file can be selected again
    fileInput.value = '';
}

// Handle drag over
function handleDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
    dragDropArea.classList.add('drag-over');
}

// Handle drag leave
function handleDragLeave(e) {
    e.preventDefault();
    e.stopPropagation();
    dragDropArea.classList.remove('drag-over');
}

// Handle file drop
function handleFileDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    dragDropArea.classList.remove('drag-over');
    
    const files = Array.from(e.dataTransfer.files);
    addFiles(files);
}

// Update options summary display
function updateOptionsSummary() {
    const summary = `${selectedOptions.size} • ${orientationLabels[selectedOptions.orientation]} • ${marginLabels[selectedOptions.margin]} • ${qualityLabels[selectedOptions.quality]}`;
    const convertBtnText = convertBtn.textContent;
    convertBtn.innerHTML = `🔄 Convert to PDF<br><span style="font-size: 0.85em; opacity: 0.8;">${summary}</span>`;
}

// Add files to selection
function addFiles(files) {
    hideMessages();
    
    if (files.length === 0) {
        showError('No files selected');
        return;
    }

    const validFiles = [];
    const largeFiles = [];
    
    files.forEach(file => {
        // Check file type
        if (!isValidFileType(file)) {
            showError(`"${file.name}" is not a valid JPG file. Only JPG/JPEG files are allowed.`);
            return;
        }

        // Check file size
        if (!isValidFileSize(file)) {
            showError(`"${file.name}" exceeds the 25MB file size limit.`);
            return;
        }

        validFiles.push(file);
    });

    if (validFiles.length > 0) {
        // Check if adding these files would exceed the 20 image limit
        if (selectedFiles.length + validFiles.length > 20) {
            showError(`⚠️ You can select a maximum of 20 images. Currently: ${selectedFiles.length}, trying to add: ${validFiles.length}`);
            return;
        }
        
        selectedFiles = [...selectedFiles, ...validFiles];
        // Initialize rotation for new files
        validFiles.forEach(() => rotations.push(0));
        updatePreview();
        updateActionButtons();
        
        // Track large files for warning
        validFiles.forEach(file => {
            if (file.size > 15 * 1024 * 1024) {
                largeFiles.push(file);
            }
        });
        
        // Show warning for large images
        if (largeFiles.length > 0) {
            showError(`⚠️ Large image(s) detected (${largeFiles.length}). They will be optimized automatically for faster conversion.`);
        }
    }
}

// Validate file type
function isValidFileType(file) {
    const validMimes = ['image/jpeg', 'image/jpg'];
    const validExtensions = ['jpg', 'jpeg'];
    
    const extension = file.name.split('.').pop().toLowerCase();
    
    return validMimes.includes(file.type) || validExtensions.includes(extension);
}

// Validate file size
function isValidFileSize(file) {
    const maxSize = 25 * 1024 * 1024; // 25MB (supports large phone photos)
    return file.size <= maxSize;
}

// Update preview display
function updatePreview() {
    if (selectedFiles.length === 0) {
        previewSection.style.display = 'none';
        return;
    }

    previewSection.style.display = 'block';
    
    // Update file count display with limit indicator
    const fileCountDisplay = document.getElementById('fileCount');
    const countStr = `📊 ${selectedFiles.length} file(s) selected`;
    const limitStr = selectedFiles.length >= 20 ? ' (MAX REACHED)' : '';
    fileCountDisplay.textContent = countStr + limitStr;
    
    imagePreviewContainer.innerHTML = '';

    selectedFiles.forEach((file, index) => {
        const previewDiv = document.createElement('div');
        previewDiv.className = 'image-preview';
        previewDiv.draggable = true; // Enable drag
        
        const rotationDegrees = rotations[index] || 0;
        
        // Create image element with proper loading
        const img = document.createElement('img');
        img.className = 'preview-img';
        img.alt = `Image ${index + 1}`;
        img.style.transform = `rotate(${rotationDegrees}deg)`;
        img.style.width = '100%';
        img.style.height = '100%';
        img.style.objectFit = 'cover';
        img.style.display = 'block';
        
        // Create blob URL for the image
        const url = URL.createObjectURL(file);
        img.src = url;
        
        // Create controls
        const indexDiv = document.createElement('div');
        indexDiv.className = 'index';
        indexDiv.textContent = index + 1;
        
        const controls = document.createElement('div');
        controls.className = 'controls';
        
        const rotateLeftBtn = document.createElement('button');
        rotateLeftBtn.className = 'rotate-left';
        rotateLeftBtn.dataset.index = index;
        rotateLeftBtn.title = 'Rotate Left';
        rotateLeftBtn.textContent = '⟲';
        rotateLeftBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            rotateImage(index, 'left');
        });
        
        const rotateRightBtn = document.createElement('button');
        rotateRightBtn.className = 'rotate-right';
        rotateRightBtn.dataset.index = index;
        rotateRightBtn.title = 'Rotate Right';
        rotateRightBtn.textContent = '⟳';
        rotateRightBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            rotateImage(index, 'right');
        });
        
        const removeBtn = document.createElement('button');
        removeBtn.className = 'remove-btn';
        removeBtn.dataset.index = index;
        removeBtn.title = 'Remove image';
        removeBtn.textContent = '×';
        removeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            removeImage(index);
        });
        
        controls.appendChild(rotateLeftBtn);
        controls.appendChild(rotateRightBtn);
        controls.appendChild(removeBtn);
        
        previewDiv.appendChild(img);
        previewDiv.appendChild(indexDiv);
        previewDiv.appendChild(controls);
        imagePreviewContainer.appendChild(previewDiv);
    });
    
    // Initialize or reinitialize SortableJS for drag & reorder (NEW!)
    if (typeof Sortable !== 'undefined') {
        if (sortable) {
            sortable.destroy();
        }
        sortable = new Sortable(imagePreviewContainer, {
            animation: 150,
            ghostClass: 'sortable-ghost',
            onEnd: (evt) => {
                // Reorder selectedFiles
                const movedFile = selectedFiles.splice(evt.oldIndex, 1)[0];
                selectedFiles.splice(evt.newIndex, 0, movedFile);
                
                // Reorder rotations to match
                const movedRotation = rotations.splice(evt.oldIndex, 1)[0];
                rotations.splice(evt.newIndex, 0, movedRotation);
                
                // Refresh preview
                updatePreview();
            }
        });
    }
}

// Rotate image left or right
function rotateImage(index, direction) {
    if (direction === 'left') {
        rotations[index] = (rotations[index] - 90) % 360;
    } else if (direction === 'right') {
        rotations[index] = (rotations[index] + 90) % 360;
    }
    updatePreview();
}

// Remove image
function removeImage(index) {
    selectedFiles.splice(index, 1);
    rotations.splice(index, 1); // Also remove rotation state
    updatePreview();
    updateActionButtons();
    hideMessages();
}

// Clear all images
function clearAllImages() {
    selectedFiles = [];
    rotations = []; // Clear rotations too
    fileInput.value = '';
    updatePreview();
    updateActionButtons();
    hideMessages();
}

// Update action buttons visibility
function updateActionButtons() {
    if (selectedFiles.length > 0) {
        console.log('Showing options and action sections. Files:', selectedFiles.length);
        optionsSection.style.display = 'block';
        actionSection.style.display = 'block';
        convertBtn.disabled = false;
        updateOptionsSummary(); // Update summary when showing options
    } else {
        console.log('Hiding options and action sections');
        optionsSection.style.display = 'none';
        actionSection.style.display = 'none';
        downloadSection.style.display = 'none';
        convertBtn.disabled = true;
    }
}

// Convert images to PDF with progress tracking
async function convertToPDF() {
    if (selectedFiles.length === 0) {
        showError('Please select at least one image');
        return;
    }

    // Prevent duplicate conversions
    if (isConverting) {
        return;
    }

    hideMessages();
    isConverting = true;
    convertBtn.disabled = true;
    
    // Show progress bar
    const progressContainer = document.getElementById('progressContainer');
    const progressBar = document.getElementById('progressBar');
    const progressText = document.getElementById('progressText');
    progressContainer.style.display = 'block';
    progressBar.style.width = '0%';
    progressText.textContent = 'Preparing upload...';

    try {
        // Create FormData
        const formData = new FormData();
        selectedFiles.forEach((file, index) => {
            formData.append('images', file);
            formData.append(`rotation_${index}`, rotations[index] || 0);
        });

        // Build query string with PDF options
        const queryParams = new URLSearchParams({
            orientation: selectedOptions.orientation,
            size: selectedOptions.size,
            margin: selectedOptions.margin,
            quality: selectedOptions.quality
        });

        // Use XMLHttpRequest for progress tracking
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            
            // Track upload progress
            xhr.upload.addEventListener('progress', (e) => {
                if (e.lengthComputable) {
                    const uploadPercent = (e.loaded / e.total) * 60; // 0-60% for upload
                    progressBar.style.width = uploadPercent + '%';
                    progressText.textContent = `Uploading... ${Math.round(uploadPercent)}%`;
                }
            });
            
            // Track download (processing) progress
            xhr.addEventListener('progress', (e) => {
                if (e.lengthComputable) {
                    const processPercent = 60 + (e.loaded / e.total) * 40; // 60-100% for processing
                    progressBar.style.width = processPercent + '%';
                    progressText.textContent = `Processing... ${Math.round(processPercent)}%`;
                }
            });
            
            // Handle completion
            xhr.addEventListener('load', async () => {
                try {
                    if (xhr.status !== 200) {
                        let errorMessage = 'Conversion failed';
                        try {
                            const json = JSON.parse(xhr.responseText);
                            errorMessage = json.error || errorMessage;
                        } catch {
                            errorMessage = xhr.responseText.substring(0, 100);
                        }
                        throw new Error(errorMessage);
                    }

                    progressBar.style.width = '100%';
                    progressText.textContent = 'Finalizing... 100%';

                    // Get PDF blob
                    const blob = new Blob([xhr.response], { type: 'application/pdf' });
                    
                    if (blob.size === 0) {
                        throw new Error('Generated PDF is empty');
                    }

                    // Extract filename from headers
                    let outputFileName = 'converted.pdf';
                    let originalSize = 0;
                    let processedSize = 0;
                    
                    try {
                        const contentDisposition = xhr.getResponseHeader('Content-Disposition');
                        if (contentDisposition) {
                            const match = contentDisposition.match(/filename\*=UTF-8''(.+)/);
                            if (match && match[1]) {
                                outputFileName = decodeURIComponent(match[1]);
                            }
                        }
                        
                        originalSize = parseInt(xhr.getResponseHeader('X-Original-Size') || '0');
                        processedSize = parseInt(xhr.getResponseHeader('X-Processed-Size') || '0');
                    } catch (err) {
                        console.warn('Could not extract headers:', err);
                    }

                    // Create download link
                    const url = URL.createObjectURL(blob);
                    downloadLink.href = url;
                    downloadLink.download = outputFileName;

                    // Display filename with compression stats
                    const fileNameDisplay = document.getElementById('fileNameDisplay');
                    let sizeInfo = '';
                    if (originalSize > 0 && processedSize > 0) {
                        const reduction = ((1 - processedSize / originalSize) * 100).toFixed(1);
                        sizeInfo = `<br><span style="font-size: 0.9em; color: var(--text-secondary);">📦 ${(originalSize / 1024 / 1024).toFixed(1)}MB → ${(processedSize / 1024 / 1024).toFixed(1)}MB (${reduction}% reduction)</span>`;
                    }
                    fileNameDisplay.innerHTML = `📄 <strong>File name:</strong> ${escapeHtml(outputFileName)}${sizeInfo}`;

                    // Show download section
                    downloadSection.style.display = 'block';
                    showSuccess(`✓ Successfully converted ${selectedFiles.length} image(s) to PDF!`);
                    
                    // Hide action/progress section
                    actionSection.style.display = 'none';
                    progressContainer.style.display = 'none';
                    
                    console.log(`[SUCCESS] Converted ${selectedFiles.length} file(s) - ${outputFileName}`);
                    resolve();
                } catch (error) {
                    reject(error);
                }
            });
            
            // Handle errors
            xhr.addEventListener('error', () => {
                reject(new Error('Network error during upload'));
            });
            
            xhr.addEventListener('abort', () => {
                reject(new Error('Upload cancelled'));
            });

            // Send request
            xhr.open('POST', `/convert?${queryParams.toString()}`);
            xhr.responseType = 'arraybuffer'; // Get binary data
            xhr.send(formData);
        });

    } catch (error) {
        console.error('Conversion error:', error);
        showError('❌ Error: ' + error.message);
        convertBtn.disabled = false;
    } finally {
        isConverting = false;
        progressContainer.style.display = 'none';
    }
}

// Reset form
function resetForm() {
    // Option 1: Keep files for re-conversion (better UX)
    // Clear only the download section and show options again
    fileInput.value = '';
    downloadSection.style.display = 'none';
    actionSection.style.display = 'block';
    hideMessages();
    
    // Scroll to options
    optionsSection.scrollIntoView({ behavior: 'smooth' });
}

// Show error message
function showError(message) {
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
}

// Show success message
function showSuccess(message) {
    successMessage.textContent = message;
    successMessage.style.display = 'block';
}

// Hide messages
function hideMessages() {
    errorMessage.style.display = 'none';
    successMessage.style.display = 'none';
}

// Escape HTML to prevent XSS attacks
function escapeHtml(unsafe) {
    if (!unsafe) return '';
    return unsafe
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    try {
        console.log('Convertly app initializing...');
        console.log('DOM Elements:', {
            optionsSection: !!optionsSection,
            actionSection: !!actionSection,
            downloadSection: !!downloadSection,
            convertBtn: !!convertBtn,
            imagePreviewContainer: !!imagePreviewContainer,
            progressContainer: !!progressContainer
        });
        updateActionButtons();
        console.log('Convertly app initialized successfully');
    } catch (error) {
        console.error('Initialization error:', error);
        alert('Error initializing app: ' + error.message);
    }
    
    // Log browser support
    if (!window.FileReader) {
        showError('⚠️ Your browser does not support file reading. Please use a modern browser.');
    }
});