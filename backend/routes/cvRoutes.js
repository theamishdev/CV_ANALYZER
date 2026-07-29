const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

// POST /api/cv/generate
// Receives structured CVData JSON and compiles a styled PDF document using Puppeteer
router.post('/generate', authController.generateCvPdf);

// POST /api/cv/latex/parse
// Parses uploaded CV file or text into LaTeX structure
router.post('/latex/parse', upload.single('cv'), authController.parseCvToLatexController);

// POST /api/cv/latex/download-tex
// Downloads raw .tex file stream
router.post('/latex/download-tex', authController.downloadLatexFile);

// GET /api/cv/:userId
// Retrieve saved active CVData for a user from MongoDB
router.get('/:userId', authController.getCv);

// POST /api/cv
// Save/update active CVData for a user in MongoDB
router.post('/', authController.saveCv);

module.exports = router;
