// DOM Elements
const fileInput = document.getElementById('fileInput');
const dragDropArea = document.getElementById('dragDropArea');
const previewSection = document.getElementById('previewSection');
const imagePreviewContainer = document.getElementById('imagePreviewContainer');
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

// File storage
let selectedFiles = [];
let isFilePickerOpen = false;

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

// Add files to selection
function addFiles(files) {
    hideMessages();
    
    if (files.length === 0) {
        showError('No files selected');
        return;
    }

    const validFiles = [];
    
    files.forEach(file => {
        // Check file type
        if (!isValidFileType(file)) {
            showError(`"${file.name}" is not a valid JPG file. Only JPG/JPEG files are allowed.`);
            return;
        }

        // Check file size
        if (!isValidFileSize(file)) {
            showError(`"${file.name}" exceeds the 10MB file size limit.`);
            return;
        }

        validFiles.push(file);
    });

    if (validFiles.length > 0) {
        selectedFiles = [...selectedFiles, ...validFiles];
        updatePreview();
        updateActionButtons();
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
    const maxSize = 10 * 1024 * 1024; // 10MB
    return file.size <= maxSize;
}

// Update preview display
function updatePreview() {
    if (selectedFiles.length === 0) {
        previewSection.style.display = 'none';
        return;
    }

    previewSection.style.display = 'block';
    
    // Update file count display
    const fileCountDisplay = document.getElementById('fileCount');
    fileCountDisplay.textContent = `📊 ${selectedFiles.length} file(s) selected`;
    
    imagePreviewContainer.innerHTML = '';

    selectedFiles.forEach((file, index) => {
        const reader = new FileReader();
        
        reader.onload = (e) => {
            const previewDiv = document.createElement('div');
            previewDiv.className = 'image-preview';
            previewDiv.innerHTML = `
                <img src="${e.target.result}" alt="Image ${index + 1}">
                <div class="index">${index + 1}</div>
                <button class="remove-btn" data-index="${index}" title="Remove image">×</button>
            `;
            
            previewDiv.querySelector('.remove-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                removeImage(index);
            });
            
            imagePreviewContainer.appendChild(previewDiv);
        };
        
        reader.readAsDataURL(file);
    });
}

// Remove image
function removeImage(index) {
    selectedFiles.splice(index, 1);
    updatePreview();
    updateActionButtons();
    hideMessages();
}

// Clear all images
function clearAllImages() {
    selectedFiles = [];
    fileInput.value = '';
    updatePreview();
    updateActionButtons();
    hideMessages();
}

// Update action buttons visibility
function updateActionButtons() {
    if (selectedFiles.length > 0) {
        actionSection.style.display = 'block';
        convertBtn.disabled = false;
    } else {
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

    hideMessages();
    convertBtn.disabled = true;
    loadingSpinner.style.display = 'block';
    loadingText.style.display = 'block';

    try {
        // Create FormData
        const formData = new FormData();
        selectedFiles.forEach(file => {
            formData.append('images', file);
        });

        // Send to backend
        const response = await fetch('/convert', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Conversion failed');
        }

        // Get PDF blob
        const blob = await response.blob();

        // Extract filename from backend response header (backend is source of truth)
        let outputFileName = 'converted.pdf';
        try {
            const contentDisposition = response.headers.get('Content-Disposition');
            if (contentDisposition) {
                // Extract filename from "attachment; filename*=UTF-8''..." format
                const match = contentDisposition.match(/filename\*=UTF-8''(.+)/);
                if (match && match[1]) {
                    outputFileName = decodeURIComponent(match[1]);
                }
            }
        } catch (err) {
            console.warn('Could not extract filename from header:', err);
        }

        // Create download link
        const url = URL.createObjectURL(blob);
        downloadLink.href = url;
        // Set the download filename attribute (ensures browser saves with correct name)
        downloadLink.download = outputFileName;

        // Display filename to user
        const fileNameDisplay = document.getElementById('fileNameDisplay');
        fileNameDisplay.innerHTML = `📄 <strong>File name:</strong> ${escapeHtml(outputFileName)}`;

        // Show download section
        downloadSection.style.display = 'block';
        showSuccess(`Successfully converted ${selectedFiles.length} image(s) to PDF!`);
        
        // Hide action section
        actionSection.style.display = 'none';

    } catch (error) {
        console.error('Conversion error:', error);
        showError('Error converting images: ' + error.message);
        convertBtn.disabled = false;
    } finally {
        loadingSpinner.style.display = 'none';
        loadingText.style.display = 'none';
    }
}

// Reset form
function resetForm() {
    selectedFiles = [];
    fileInput.value = '';
    updatePreview();
    updateActionButtons();
    downloadSection.style.display = 'none';
    hideMessages();
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
});
