const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { generateImagesByType, getAllIFCTypes } = require('./services/imageGenerator');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Security headers
app.use((req, res, next) => {
    res.setHeader(
        'Content-Security-Policy',
        "default-src 'self'; " +
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://unpkg.com; " +
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
        "font-src 'self' https://fonts.gstatic.com; " +
        "img-src 'self' data: blob:; " +
        "connect-src 'self'"
    );
    next();
});

// Serve static files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use('/output', express.static(path.join(__dirname, '../output')));
app.use('/temp', express.static(path.join(__dirname, '../temp')));

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, '../uploads/'));
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// Routes
app.post('/get-ifc-types', upload.single('ifcFile'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No IFC file uploaded' });
        }

        const types = await getAllIFCTypes(req.file.path);
        
        res.json({
            success: true,
            types: types
        });
    } catch (error) {
        console.error('Error getting IFC types:', error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/generate-images-by-type', upload.single('ifcFile'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No IFC file uploaded' });
        }

        const ifcType = req.body.ifcType;
        if (!ifcType) {
            return res.status(400).json({ error: 'No IFC type specified' });
        }

        console.log('Processing file:', req.file.path);
        console.log('IFC Type:', ifcType);

        const images = await generateImagesByType(req.file.path, ifcType);
        
        res.json({
            success: true,
            images: images
        });
    } catch (error) {
        console.error('Error generating images:', error);
        res.status(500).json({ error: error.message });
    }
});

// Add a test route
app.get('/test', (req, res) => {
    res.json({ status: 'Server is running' });
});

// Start server
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
    console.log(`Test the server at http://localhost:${port}/test`);
}); 