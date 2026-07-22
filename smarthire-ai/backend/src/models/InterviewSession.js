const mongoose = require('mongoose');

const InterviewSessionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    resumeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Resume' },
    type: {
      type: String,
      enum: ['hr', 'technical', 'behavioral', 'aptitude'],
      required: true,
    },
    domain: { type: String, default: 'general' },
    difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'completed'],
      default: 'pending',
    },
    startedAt: { type: Date },
    completedAt: { type: Date },
    questionIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Question' }],
    responseIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Response' }],
  },
  { timestamps: true }
);

module.exports = mongoose.model('InterviewSession', InterviewSessionSchema);
