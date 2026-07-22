const express = require('express');
const router = express.Router();
const interviewController = require('../controllers/interview.controller');
const authMiddleware = require('../middleware/auth.middleware');
const requireRole = require('../middleware/role.middleware');
const { mediaUpload } = require('../middleware/upload.middleware');

// Interview session routes
router.post('/generate', authMiddleware, interviewController.generateInterview);
router.get('/templates', authMiddleware, interviewController.listTemplates);
router.post('/template', authMiddleware, requireRole('recruiter', 'admin'), interviewController.createTemplate);
router.delete('/template/:id', authMiddleware, requireRole('recruiter', 'admin'), interviewController.deleteTemplate);
router.get('/:id', authMiddleware, interviewController.getSession);
router.post('/:id/start', authMiddleware, interviewController.startSession);
router.post('/:id/response', authMiddleware, mediaUpload.single('media'), interviewController.submitResponse);
router.post('/:id/complete', authMiddleware, interviewController.completeSession);
router.get('/:id/report', authMiddleware, interviewController.getReport);

module.exports = router;
