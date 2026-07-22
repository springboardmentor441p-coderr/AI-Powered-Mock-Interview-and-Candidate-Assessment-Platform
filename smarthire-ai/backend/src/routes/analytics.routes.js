const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analytics.controller');
const authMiddleware = require('../middleware/auth.middleware');
const requireRole = require('../middleware/role.middleware');

router.get('/candidate/:userId', authMiddleware, analyticsController.candidateAnalytics);
router.get('/candidate/:userId/skills', authMiddleware, analyticsController.candidateSkillBreakdown);
router.get('/candidate/:userId/weak-areas', authMiddleware, analyticsController.candidateWeakAreas);
router.get(
  '/recruiter/candidates',
  authMiddleware,
  requireRole('recruiter', 'admin'),
  analyticsController.recruiterCandidates
);
router.get(
  '/summary',
  authMiddleware,
  requireRole('admin'),
  analyticsController.platformSummary
);

module.exports = router;
