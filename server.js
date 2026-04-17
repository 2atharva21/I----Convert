const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const { PDFDocument } = require('pdf-lib');
const rateLimit = require('express-rate-limit');
const { fileTypeFromBuffer } = require('file-type');
const sharp = require('sharp');

const app = express();
const PORT = 3000;

// Rate limiting middleware (stricter for heavy processing)
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10 // limit each IP to 10 requests per minute for heavy PDF processing
});

// Middleware
app.use(cors());
app.use(express.static('public'));
app.use('/convert', limiter);

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    // Only accept JPG/JPEG files (must match both MIME type AND extension)
    const allowedMimes = ['image/jpeg', 'image/jpg'];
    const allowedExtensions = ['.jpg', '.jpeg'];
    
    const ext = path.extname(file.originalname).toLowerCase();
    
    if (allowedMimes.includes(file.mimetype) && allowedExtensions.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPG/JPEG files are allowed'), false);
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB per file
  }
});

// API Routes

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'Server is running' });
});

// PDF page size constants (in points: 72 points = 1 inch)
// A4: 210mm x 297mm
const PAGE_SIZES = {
  A4: {
    portrait: { width: 595, height: 842 },
    landscape: { width: 842, height: 595 }
  },
  Letter: {
    portrait: { width: 612, height: 792 },
    landscape: { width: 792, height: 612 }
  }
};

// Margin sizes in points (72 points = 1 inch)
const MARGIN_SIZES = {
  0: 0,      // No margin
  10: 28,    // Small (~10pt)
  20: 57     // Medium (~20pt)
};

// Convert images to PDF
app.post('/convert', upload.array('images', 20), async (req, res) => {
  // Set timeout protection (30 seconds for heavy PDF processing)
  req.setTimeout(30000);
  
  // Read PDF options from query parameters
  const orientation = (req.query.orientation || 'portrait').toLowerCase();
  const pageSize = (req.query.size || 'A4').toUpperCase();
  const margin = parseInt(req.query.margin || 0);
  
  const clientIP = req.ip || req.connection.remoteAddress;

  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    // Validate options
    const validOrientations = ['portrait', 'landscape'];
    const validSizes = Object.keys(PAGE_SIZES);
    const validMargins = Object.keys(MARGIN_SIZES);
    
    if (!validOrientations.includes(orientation)) {
      return res.status(400).json({ error: `Invalid orientation. Must be: ${validOrientations.join(', ')}` });
    }
    
    if (!validSizes.includes(pageSize)) {
      return res.status(400).json({ error: `Invalid page size. Must be: ${validSizes.join(', ')}` });
    }
    
    if (!validMargins.includes(String(margin))) {
      return res.status(400).json({ error: `Invalid margin. Must be: ${validMargins.join(', ')}` });
    }

    // Check total upload size limit (50MB max)
    const totalSize = req.files.reduce((sum, file) => sum + file.size, 0);
    const maxTotalSize = 50 * 1024 * 1024; // 50MB
    
    if (totalSize > maxTotalSize) {
      throw new Error(`Total file size (${(totalSize / 1024 / 1024).toFixed(2)}MB) exceeds 50MB limit`);
    }

    // Get page dimensions based on options
    const pageDimensions = PAGE_SIZES[pageSize][orientation];
    const marginPoints = MARGIN_SIZES[margin];
    const contentWidth = pageDimensions.width - (marginPoints * 2);
    const contentHeight = pageDimensions.height - (marginPoints * 2);

    // Create a new PDF document
    const pdfDoc = await PDFDocument.create();
    let processedCount = 0;

    // Add each image to the PDF
    for (let fileIndex = 0; fileIndex < req.files.length; fileIndex++) {
      const file = req.files[fileIndex];
      try {
        // Read image file asynchronously (non-blocking)
        let imageData = await fs.promises.readFile(file.path);
        
        // SECURITY: Verify actual file content (not just extension)
        const fileType = await fileTypeFromBuffer(imageData);
        if (!fileType || !fileType.mime.startsWith('image/jpeg')) {
          throw new Error(`"${file.originalname}" is corrupted or not a valid JPEG image`);
        }
        
        // Get rotation value from request (in degrees: 0, 90, 180, 270, etc.)
        const rotation = parseInt(req.body[`rotation_${fileIndex}`]) || 0;
        
        // Apply rotation using sharp if rotation is not 0
        if (rotation !== 0) {
          // Normalize rotation to 0, 90, 180, 270
          const normalizedRotation = ((rotation % 360) + 360) % 360;
          if (normalizedRotation !== 0) {
            imageData = await sharp(imageData)
              .rotate(normalizedRotation)
              .jpeg({ quality: 90 })
              .toBuffer();
          }
        }
        
        // Embed image in PDF
        const image = await pdfDoc.embedJpg(imageData);
        
        // Create page with specified size
        const page = pdfDoc.addPage([pageDimensions.width, pageDimensions.height]);
        
        // Calculate scaled image dimensions to fit content area
        let scaledWidth = image.width;
        let scaledHeight = image.height;
        
        // Scale image to fit within content area (preserving aspect ratio)
        if (scaledWidth > contentWidth || scaledHeight > contentHeight) {
          const scale = Math.min(contentWidth / scaledWidth, contentHeight / scaledHeight);
          scaledWidth *= scale;
          scaledHeight *= scale;
        }
        
        // Calculate position to center image within content area
        const posX = marginPoints + (contentWidth - scaledWidth) / 2;
        const posY = marginPoints + (contentHeight - scaledHeight) / 2;
        
        // Draw image with margins and centering
        page.drawImage(image, {
          x: posX,
          y: posY,
          width: scaledWidth,
          height: scaledHeight
        });
        
        // Log conversion info
        console.log(`Image ${fileIndex + 1}: rotated ${rotation}°, scaled to ${scaledWidth.toFixed(0)}×${scaledHeight.toFixed(0)}pt, positioned at (${posX.toFixed(0)}, ${posY.toFixed(0)}pt)`);
        
        processedCount++;
      } catch (error) {
        console.error(`Error processing file ${file.originalname}:`, error);
        throw error;
      }
    }
    
    if (processedCount === 0) {
      throw new Error('No valid images were processed');
    }

    // Generate PDF bytes with compression enabled
    const pdfBytes = await pdfDoc.save({
      useObjectStreams: true // Enable compression for smaller file size
    });

    // Generate smart output filename based on uploaded files
    let outputFileName = 'converted.pdf'; // Fallback filename
    try {
      const firstFile = req.files[0];
      if (firstFile && firstFile.originalname) {
        // Extract base name without extension
        const baseName = path.parse(firstFile.originalname).name;
        
        // Generate filename based on number of files
        if (baseName && baseName.trim()) {
          outputFileName = req.files.length > 1
            ? `${baseName}-merged.pdf`
            : `${baseName}.pdf`;
        }
      }
    } catch (err) {
      console.warn('Could not parse filename, using fallback:', err);
    }
    
    // Safely encode filename for HTTP header (RFC 5987)
    const safeFileName = encodeURIComponent(outputFileName);

    // Analytics: Log successful conversion with output filename and options
    console.log(`[SUCCESS] Processed ${processedCount} image(s) | Options: ${orientation} ${pageSize} margin=${margin}pt | Output: ${outputFileName} | IP: ${clientIP} | Total size: ${(totalSize / 1024 / 1024).toFixed(2)}MB`);

    // Send PDF as response with security headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${safeFileName}`);
    res.setHeader('Cache-Control', 'no-store'); // Don't cache sensitive files
    res.setHeader('X-Content-Type-Options', 'nosniff'); // Prevent MIME sniffing
    res.setHeader('X-Frame-Options', 'DENY'); // Prevent clickjacking
    res.send(Buffer.from(pdfBytes));

  } catch (error) {
    console.error('Conversion error:', error);
    
    // Security headers for error responses too
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    
    const statusCode = error.message.includes('exceeds') ? 413 : 400;
    res.status(statusCode).json({ error: error.message || 'Conversion failed' });
  } finally {
    // Cleanup ALWAYS runs, even if error occurs (guaranteed safety)
    if (req.files && Array.isArray(req.files)) {
      const cleanupPromises = req.files.map(file =>
        fs.promises.unlink(file.path).catch(err =>
          console.error('Error deleting file:', err)
        )
      );
      await Promise.all(cleanupPromises);
    }
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  // Apply security headers to all error responses
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  if (err instanceof multer.MulterError) {
    if (err.code === 'FILE_TOO_LARGE') {
      return res.status(413).json({ error: 'File size exceeds 10MB limit' });
    }
    return res.status(400).json({ error: 'Upload error: ' + err.message });
  }
  
  if (err.message && err.message.includes('Only JPG/JPEG')) {
    return res.status(400).json({ error: 'Only JPG/JPEG files are allowed' });
  }
  
  res.status(500).json({ error: 'Server error' });
});

// 404 handler
app.use((req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.status(404).json({ error: 'Route not found' });
});

// Export app for Vercel serverless functions
module.exports = app;

// Start server locally (not in serverless/production)
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log('Upload folder: ' + path.join(__dirname, 'uploads'));
  });
}