const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const { PDFDocument } = require('pdf-lib');
const rateLimit = require('express-rate-limit');
const { fileTypeFromBuffer } = require('file-type');

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

// PDF page size constants (A4)
const A4_WIDTH = 595;
const A4_HEIGHT = 842;

// Convert images to PDF
app.post('/convert', upload.array('images', 20), async (req, res) => {
  // Set timeout protection (30 seconds for heavy PDF processing)
  req.setTimeout(30000);
  
  // Check for A4 mode from query parameter
  const useA4 = req.query.a4 === 'true';
  const clientIP = req.ip || req.connection.remoteAddress;

  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    // Check total upload size limit (50MB max)
    const totalSize = req.files.reduce((sum, file) => sum + file.size, 0);
    const maxTotalSize = 50 * 1024 * 1024; // 50MB
    
    if (totalSize > maxTotalSize) {
      throw new Error(`Total file size (${(totalSize / 1024 / 1024).toFixed(2)}MB) exceeds 50MB limit`);
    }

    // Create a new PDF document
    const pdfDoc = await PDFDocument.create();
    let processedCount = 0;

    // Add each image to the PDF
    for (const file of req.files) {
      try {
        // Read image file asynchronously (non-blocking)
        const imageData = await fs.promises.readFile(file.path);
        
        // SECURITY: Verify actual file content (not just extension)
        const fileType = await fileTypeFromBuffer(imageData);
        if (!fileType || !fileType.mime.startsWith('image/jpeg')) {
          throw new Error(`"${file.originalname}" is corrupted or not a valid JPEG image`);
        }
        
        // Embed image in PDF
        const image = await pdfDoc.embedJpg(imageData);
        
        // Create page: use A4 size or original image dimensions
        let page;
        if (useA4) {
          page = pdfDoc.addPage([A4_WIDTH, A4_HEIGHT]);
          // Scale and center image to fit A4
          const scaledImage = image.scaleToFit(A4_WIDTH - 40, A4_HEIGHT - 40);
          page.drawImage(image, {
            x: (A4_WIDTH - scaledImage.width) / 2,
            y: (A4_HEIGHT - scaledImage.height) / 2,
            width: scaledImage.width,
            height: scaledImage.height
          });
        } else {
          // Use original image dimensions
          page = pdfDoc.addPage([image.width, image.height]);
          page.drawImage(image, {
            x: 0,
            y: 0,
            width: image.width,
            height: image.height
          });
        }
        
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

    // Analytics: Log successful conversion with output filename
    console.log(`[SUCCESS] Processed ${processedCount} image(s) in ${useA4 ? 'A4' : 'original'} mode | Output: ${outputFileName} | IP: ${clientIP} | Total size: ${(totalSize / 1024 / 1024).toFixed(2)}MB`);

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

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log('Upload folder: ' + path.join(__dirname, 'uploads'));
});
