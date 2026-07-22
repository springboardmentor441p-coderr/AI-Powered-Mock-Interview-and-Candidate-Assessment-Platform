const mongoose = require('mongoose');

const QuestionSchema = new mongoose.Schema(
  {
    sessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'InterviewSession', required: true },
    text: { type: String, required: true },
    type: {
      type: String,
      enum: ['hr', 'technical', 'behavioral', 'aptitude'],
      required: true,
    },
    order: { type: Number, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Question', QuestionSchema);
