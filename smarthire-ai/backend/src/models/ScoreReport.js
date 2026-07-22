const mongoose = require('mongoose');

const ScoreReportSchema = new mongoose.Schema(
  {
    sessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'InterviewSession', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    communicationScore: { type: Number, required: true },
    confidenceScore: { type: Number, required: true },
    technicalScore: { type: Number, required: true },
    professionalismScore: { type: Number, required: true },
    overallScore: { type: Number, required: true },
    rating: {
      type: String,
      enum: ['Excellent', 'Good', 'Average', 'Needs Improvement', 'Poor'],
      required: true,
    },
    strengths: [{ type: String }],
    weaknesses: [{ type: String }],
    suggestions: [{ type: String }],
  },
  { timestamps: true }
);

module.exports = mongoose.model('ScoreReport', ScoreReportSchema);
