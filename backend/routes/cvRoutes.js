const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// POST /api/cv/generate
// Receives structured CVData JSON and compiles a styled PDF document using Puppeteer
router.post('/generate', authController.generateCvPdf);

// GET /api/cv/:userId
// Retrieve saved active CVData for a user from MongoDB
router.get('/:userId', authController.getCv);

// POST /api/cv
// Save/update active CVData for a user in MongoDB
router.post('/', authController.saveCv);

module.exports = router;
