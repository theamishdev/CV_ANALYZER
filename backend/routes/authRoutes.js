const express = require('express');
const router = express.Router();
const multer = require('multer');
const authController = require('../controllers/authController');

// Multer in-memory file upload middleware config (10MB limit)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }
});

// POST /api/auth/signup
router.post('/signup', authController.signup);

// POST /api/auth/login
router.post('/login', authController.login);

// PUT /api/auth/profile
router.put('/profile', authController.updateProfile);

// POST /api/auth/predict
router.post('/predict', authController.predictRole);

// POST /api/auth/upload
// Endpoint for file uploads (PDF/DOCX) which extracts and analyzes them on the backend
router.post('/upload', upload.single('cv'), authController.uploadCvFile);

// POST /api/auth/download-docx
// Endpoint to upload original DOCX and download its optimized version with replacements
router.post('/download-docx', upload.single('cv'), authController.downloadDocxCv);

// POST /api/auth/history
// Endpoint to save a history entry (accepts optional CV file upload)
router.post('/history', upload.single('cv'), authController.saveHistory);

// GET /api/auth/history/:userId
// Endpoint to list history entries for a specific user (excluding large files)
router.get('/history/:userId', authController.getHistory);

// DELETE /api/auth/history/:id
// Endpoint to delete a specific history entry
router.delete('/history/:id', authController.deleteHistoryItem);

// GET /api/auth/history/download/:id
// Endpoint to download the original CV file associated with a history entry
router.get('/history/download/:id', authController.downloadHistoryFile);

module.exports = router;
