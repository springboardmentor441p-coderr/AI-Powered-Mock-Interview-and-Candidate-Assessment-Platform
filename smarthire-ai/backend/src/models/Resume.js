const mongoose = require('mongoose');

const ResumeSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    fileUrl: { type: String, required: true },
    rawText: { type: String },
    parsedData: {
      skills: [{ type: String }],
      experience: [{ type: String }],
      education: [{ type: String }],
      technologies: [{ type: String }],
    },
    summary: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Resume', ResumeSchema);
