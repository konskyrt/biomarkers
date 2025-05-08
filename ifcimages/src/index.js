const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const { generateElementImage, generateAllElementImages } = require('./services/imageGenerator');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// Routes
app.post('/generate-element-image', upload.single('ifcFile'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No IFC file uploaded' });
        }

        const elementId = req.body.elementId;
        const imagePath = await generateElementImage(req.file.path, elementId);
        
        res.json({
            success: true,
            imagePath: imagePath
        });
    } catch (error) {
        console.error('Error generating element image:', error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/generate-all-images', upload.single('ifcFile'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No IFC file uploaded' });
        }

        const images = await generateAllElementImages(req.file.path);
        
        res.json({
            success: true,
            images: images
        });
    } catch (error) {
        console.error('Error generating all images:', error);
        res.status(500).json({ error: error.message });
    }
});

// Start server
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
}); 