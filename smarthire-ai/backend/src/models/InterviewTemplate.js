const mongoose = require('mongoose');

const InterviewTemplateSchema = new mongoose.Schema(
  {
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ['hr', 'technical', 'behavioral', 'aptitude'],
      required: true,
    },
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      default: 'medium',
    },
    domain: { type: String, default: 'general' },
    description: { type: String, default: '' },
    customQuestions: [{ type: String }],
    isPublic: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('InterviewTemplate', InterviewTemplateSchema);
