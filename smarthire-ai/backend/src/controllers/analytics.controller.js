const ScoreReport = require('../models/ScoreReport');
const InterviewSession = require('../models/InterviewSession');
const User = require('../models/User');

exports.candidateAnalytics = async (req, res) => {
  try {
    const { userId } = req.params;
    if (req.user.role === 'candidate' && req.user.id !== userId) {
      return res.status(403).json({ message: 'Not authorized to view this data' });
    }

    const reports = await ScoreReport.find({ userId }).sort({ createdAt: 1 });
    const sessions = await InterviewSession.find({ userId }).sort({ createdAt: -1 });

    res.json({ reports, sessions });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch candidate analytics', error: err.message });
  }
};

/**
 * GET /analytics/candidate/:userId/skills — Skill-wise score breakdown
 * Returns average scores per category across all completed sessions.
 */
exports.candidateSkillBreakdown = async (req, res) => {
  try {
    const { userId } = req.params;
    if (req.user.role === 'candidate' && req.user.id !== userId) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const reports = await ScoreReport.find({ userId }).sort({ createdAt: 1 });

    if (reports.length === 0) {
      return res.json({
        avgCommunication: 0,
        avgConfidence: 0,
        avgTechnical: 0,
        avgProfessionalism: 0,
        sessionCount: 0,
        trend: [],
      });
    }

    const sum = { comm: 0, conf: 0, tech: 0, prof: 0 };
    const trend = reports.map((r, idx) => {
      sum.comm += r.communicationScore;
      sum.conf += r.confidenceScore;
      sum.tech += r.technicalScore;
      sum.prof += r.professionalismScore;
      return {
        session: idx + 1,
        date: r.createdAt,
        communication: r.communicationScore,
        confidence: r.confidenceScore,
        technical: r.technicalScore,
        professionalism: r.professionalismScore,
        overall: Math.round(r.overallScore),
      };
    });

    const n = reports.length;
    res.json({
      avgCommunication: Math.round(sum.comm / n),
      avgConfidence: Math.round(sum.conf / n),
      avgTechnical: Math.round(sum.tech / n),
      avgProfessionalism: Math.round(sum.prof / n),
      sessionCount: n,
      trend,
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch skill breakdown', error: err.message });
  }
};

/**
 * GET /analytics/candidate/:userId/weak-areas — Predicted weak areas
 * Looks at the last 3 sessions and identifies consistently low-scoring categories.
 */
exports.candidateWeakAreas = async (req, res) => {
  try {
    const { userId } = req.params;
    if (req.user.role === 'candidate' && req.user.id !== userId) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const recentReports = await ScoreReport.find({ userId })
      .sort({ createdAt: -1 })
      .limit(3);

    if (recentReports.length === 0) {
      return res.json({ weakAreas: [], recommendations: [] });
    }

    const n = recentReports.length;
    const avgs = {
      Communication: Math.round(recentReports.reduce((s, r) => s + r.communicationScore, 0) / n),
      Confidence: Math.round(recentReports.reduce((s, r) => s + r.confidenceScore, 0) / n),
      Technical: Math.round(recentReports.reduce((s, r) => s + r.technicalScore, 0) / n),
      Professionalism: Math.round(recentReports.reduce((s, r) => s + r.professionalismScore, 0) / n),
    };

    const weakAreas = [];
    const recommendations = [];

    if (avgs.Communication < 60) {
      weakAreas.push({ area: 'Communication', score: avgs.Communication });
      recommendations.push('Practice articulating answers clearly. Reduce filler words by pausing instead of using "um" or "like".');
    }
    if (avgs.Confidence < 60) {
      weakAreas.push({ area: 'Confidence', score: avgs.Confidence });
      recommendations.push('Maintain consistent eye contact with the camera. Practice speaking with a steady pace and clear posture.');
    }
    if (avgs.Technical < 60) {
      weakAreas.push({ area: 'Technical', score: avgs.Technical });
      recommendations.push('Review core technical concepts in your domain. Practice explaining solutions step-by-step.');
    }
    if (avgs.Professionalism < 60) {
      weakAreas.push({ area: 'Professionalism', score: avgs.Professionalism });
      recommendations.push('Structure your answers using the STAR method. Keep responses concise and time-aware.');
    }

    // Sort weakest first
    weakAreas.sort((a, b) => a.score - b.score);

    res.json({ weakAreas, recommendations, recentAverages: avgs });
  } catch (err) {
    res.status(500).json({ message: 'Failed to predict weak areas', error: err.message });
  }
};

/**
 * GET /analytics/recruiter/candidates — Comparison table with populated user data
 */
exports.recruiterCandidates = async (req, res) => {
  try {
    const latestReports = await ScoreReport.aggregate([
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: '$userId',
          latestReport: { $first: '$$ROOT' },
        },
      },
    ]);

    // Populate user names for the comparison table
    const userIds = latestReports.map((r) => r._id);
    const users = await User.find({ _id: { $in: userIds } }).select('name email role');
    const userMap = {};
    users.forEach((u) => { userMap[u._id.toString()] = u; });

    const candidates = latestReports.map((r) => ({
      ...r,
      user: userMap[r._id.toString()] || { name: 'Unknown', email: '' },
    }));

    res.json({ candidates });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch recruiter analytics', error: err.message });
  }
};

/**
 * GET /analytics/summary — Admin dashboard stats
 */
exports.platformSummary = async (req, res) => {
  try {
    const [totalUsers, totalSessions, reports] = await Promise.all([
      User.countDocuments(),
      InterviewSession.countDocuments(),
      ScoreReport.find().select('overallScore rating createdAt'),
    ]);

    const avgScore = reports.length > 0
      ? Math.round(reports.reduce((s, r) => s + r.overallScore, 0) / reports.length)
      : 0;

    const ratingDist = { Excellent: 0, Good: 0, Average: 0, 'Needs Improvement': 0, Poor: 0 };
    reports.forEach((r) => {
      if (ratingDist[r.rating] !== undefined) ratingDist[r.rating]++;
    });

    res.json({ totalUsers, totalSessions, totalReports: reports.length, avgScore, ratingDistribution: ratingDist });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch platform summary', error: err.message });
  }
};
