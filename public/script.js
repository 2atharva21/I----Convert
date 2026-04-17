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

// File storage and rotation tracking
let selectedFiles = [];
let rotations = []; // Track rotation for each image (in degrees)
let isFilePickerOpen = false;
let isConverting = false;

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
        if (!isFilePickerOpen) {
            isFilePickerOpen = true;
            fileInput.click();
        }
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
    isFilePickerOpen = false; // Reset flag
    
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
        const reader = new FileReader();
        
        reader.onload = (e) => {
            const previewDiv = document.createElement('div');
            previewDiv.className = 'image-preview';
            
            const rotationDegrees = rotations[index] || 0;
            
            previewDiv.innerHTML = `
                <img src="${e.target.result}" alt="Image ${index + 1}" class="preview-img" style="transform: rotate(${rotationDegrees}deg)">
                <div class="index">${index + 1}</div>
                <div class="controls">
                    <button class="rotate-left" data-index="${index}" title="Rotate Left">⟲</button>
                    <button class="rotate-right" data-index="${index}" title="Rotate Right">⟳</button>
                    <button class="remove-btn" data-index="${index}" title="Remove image">×</button>
                </div>
            `;
            
            // Add event listeners
            previewDiv.querySelector('.rotate-left').addEventListener('click', (e) => {
                e.stopPropagation();
                rotateImage(index, 'left');
            });
            
            previewDiv.querySelector('.rotate-right').addEventListener('click', (e) => {
                e.stopPropagation();
                rotateImage(index, 'right');
            });
            
            previewDiv.querySelector('.remove-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                removeImage(index);
            });
            
            imagePreviewContainer.appendChild(previewDiv);
        };
        
        reader.readAsDataURL(file);
    });
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
        optionsSection.style.display = 'block';
        actionSection.style.display = 'block';
        convertBtn.disabled = false;
        updateOptionsSummary(); // Update summary when showing options
    } else {
        optionsSection.style.display = 'none';
        actionSection.style.display = 'none';
        downloadSection.style.display = 'none';
        convertBtn.disabled = true;
    }
}

// Convert images to PDF
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
    loadingSpinner.style.display = 'block';
    loadingText.style.display = 'block';

    try {
        // Create FormData
        const formData = new FormData();
        selectedFiles.forEach((file, index) => {
            formData.append('images', file);
            // Send rotation data for each image
            formData.append(`rotation_${index}`, rotations[index] || 0);
        });

        // Build query string with PDF options
        const queryParams = new URLSearchParams({
            orientation: selectedOptions.orientation,
            size: selectedOptions.size,
            margin: selectedOptions.margin,
            quality: selectedOptions.quality  // NEW: Include quality setting
        });

        // Send to backend with query parameters
        const response = await fetch(`/convert?${queryParams.toString()}`, {
            method: 'POST',
            body: formData,
            timeout: 120000 // 2 minute timeout for large conversions
        });

        if (!response.ok) {
            let errorMessage = 'Conversion failed';
            const contentType = response.headers.get('content-type');
            
            if (contentType && contentType.includes('application/json')) {
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.error || errorMessage;
                } catch (e) {
                    const text = await response.text();
                    errorMessage = text.substring(0, 100) || errorMessage;
                }
            } else {
                const text = await response.text();
                errorMessage = text.substring(0, 100) || errorMessage;
            }
            
            throw new Error(errorMessage);
        }

        // Get PDF blob
        const blob = await response.blob();

        // Validate blob size
        if (blob.size === 0) {
            throw new Error('Generated PDF is empty');
        }

        // Extract filename from backend response header (backend is source of truth)
        let outputFileName = 'converted.pdf';
        let originalSize = 0;
        let processedSize = 0;
        
        try {
            const contentDisposition = response.headers.get('Content-Disposition');
            if (contentDisposition) {
                // Extract filename from "attachment; filename*=UTF-8''..." format
                const match = contentDisposition.match(/filename\*=UTF-8''(.+)/);
                if (match && match[1]) {
                    outputFileName = decodeURIComponent(match[1]);
                }
            }
            
            // Get compression stats from custom headers
            originalSize = parseInt(response.headers.get('X-Original-Size') || '0');
            processedSize = parseInt(response.headers.get('X-Processed-Size') || '0');
        } catch (err) {
            console.warn('Could not extract headers:', err);
        }

        // Create download link
        const url = URL.createObjectURL(blob);
        downloadLink.href = url;
        // Set the download filename attribute (ensures browser saves with correct name)
        downloadLink.download = outputFileName;

        // Display filename to user
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
        
        // Hide action section
        actionSection.style.display = 'none';
        
        // Log success for debugging
        console.log(`[SUCCESS] Converted ${selectedFiles.length} file(s) - ${outputFileName} | Compression: ${originalSize > 0 ? ((1 - processedSize / originalSize) * 100).toFixed(1) : 'N/A'}%`);

    } catch (error) {
        console.error('Conversion error:', error);
        showError('❌ Error: ' + error.message);
        convertBtn.disabled = false;
    } finally {
        isConverting = false;
        loadingSpinner.style.display = 'none';
        loadingText.style.display = 'none';
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
    console.log('Convertly app initialized');
    updateActionButtons();
    
    // Log browser support
    if (!window.FileReader) {
        showError('⚠️ Your browser does not support file reading. Please use a modern browser.');
    }
});