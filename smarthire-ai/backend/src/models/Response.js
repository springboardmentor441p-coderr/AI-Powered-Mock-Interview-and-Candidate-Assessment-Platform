const mongoose = require('mongoose');

const ResponseSchema = new mongoose.Schema(
  {
    sessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'InterviewSession', required: true },
    questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Question', required: true },
    audioUrl: { type: String },
    videoUrl: { type: String },
    transcript: { type: String },
    speechMetrics: {
      fillerWordCount: { type: Number, default: 0 },
      paceWpm: { type: Number, default: 0 },
      grammarScore: { type: Number, default: 0 },
    },
    visualMetrics: {
      eyeContactPct: { type: Number, default: 0 },
      emotionScores: { type: mongoose.Schema.Types.Mixed, default: {} },
      engagementScore: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Response', ResponseSchema);
