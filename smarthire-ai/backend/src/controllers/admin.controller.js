const User = require('../models/User');
const InterviewSession = require('../models/InterviewSession');
const ScoreReport = require('../models/ScoreReport');
const Setting = require('../models/Setting');

/**
 * GET /admin/users?page=1&limit=20&role=candidate&search=john
 */
exports.listUsers = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.role && ['candidate', 'recruiter', 'admin'].includes(req.query.role)) {
      filter.role = req.query.role;
    }
    if (req.query.search) {
      const regex = new RegExp(req.query.search, 'i');
      filter.$or = [{ name: regex }, { email: regex }];
    }

    const [users, total] = await Promise.all([
      User.find(filter).select('-passwordHash').sort({ createdAt: -1 }).skip(skip).limit(limit),
      User.countDocuments(filter),
    ]);

    res.json({
      users,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to list users', error: err.message });
  }
};

/**
 * PATCH /admin/users/:id/role   body: { role }
 */
exports.updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    if (!role || !['candidate', 'recruiter', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Valid role is required (candidate, recruiter, admin)' });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true }
    ).select('-passwordHash');

    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ user });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update user role', error: err.message });
  }
};

/**
 * DELETE /admin/users/:id
 */
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete user', error: err.message });
  }
};

/**
 * GET /admin/stats — platform-wide aggregate statistics
 */
exports.platformStats = async (req, res) => {
  try {
    const [
      totalUsers,
      totalCandidates,
      totalRecruiters,
      totalAdmins,
      totalSessions,
      completedSessions,
      reports,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'candidate' }),
      User.countDocuments({ role: 'recruiter' }),
      User.countDocuments({ role: 'admin' }),
      InterviewSession.countDocuments(),
      InterviewSession.countDocuments({ status: 'completed' }),
      ScoreReport.find().select('overallScore rating'),
    ]);

    const avgScore = reports.length > 0
      ? Math.round(reports.reduce((sum, r) => sum + r.overallScore, 0) / reports.length)
      : 0;

    // Rating distribution
    const ratingDist = { Excellent: 0, Good: 0, Average: 0, 'Needs Improvement': 0, Poor: 0 };
    reports.forEach((r) => {
      if (ratingDist[r.rating] !== undefined) ratingDist[r.rating]++;
    });

    res.json({
      totalUsers,
      totalCandidates,
      totalRecruiters,
      totalAdmins,
      totalSessions,
      completedSessions,
      totalReports: reports.length,
      avgScore,
      ratingDistribution: ratingDist,
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch platform stats', error: err.message });
  }
};

/**
 * GET /admin/settings
 */
exports.getSettings = async (req, res) => {
  try {
    let settings = await Setting.findOne();
    if (!settings) {
      settings = await Setting.create({});
    }
    res.json({ settings });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch settings', error: err.message });
  }
};

/**
 * PATCH /admin/settings   body: partial settings update
 */
exports.updateSettings = async (req, res) => {
  try {
    const allowedFields = [
      'maxQuestionsPerSession', 'defaultDifficulty', 'enableEmotionDetection',
      'enableEyeTracking', 'enableWhisperTranscription', 'allowedInterviewTypes',
      'maintenanceMode', 'platformName',
    ];

    const update = {};
    for (const key of allowedFields) {
      if (req.body[key] !== undefined) update[key] = req.body[key];
    }

    const settings = await Setting.findOneAndUpdate({}, update, {
      upsert: true,
      new: true,
      runValidators: true,
    });

    res.json({ settings });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update settings', error: err.message });
  }
};
