const express = require('express');
const router = express.Router();
const resumeController = require('../controllers/resume.controller');
const authMiddleware = require('../middleware/auth.middleware');
const { resumeUpload } = require('../middleware/upload.middleware');

router.get('/my', authMiddleware, resumeController.listMyResumes);
router.post('/upload', authMiddleware, resumeUpload.single('resume'), resumeController.uploadResume);
router.get('/:id', authMiddleware, resumeController.getResume);

module.exports = router;
