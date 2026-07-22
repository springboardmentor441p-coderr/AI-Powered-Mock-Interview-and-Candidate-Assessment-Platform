const mongoose = require('mongoose');

const SettingSchema = new mongoose.Schema(
  {
    // Singleton pattern — only one settings document should exist.
    // Use Setting.findOneAndUpdate({}, updates, { upsert: true, new: true })
    maxQuestionsPerSession: { type: Number, default: 8 },
    defaultDifficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      default: 'medium',
    },
    enableEmotionDetection: { type: Boolean, default: true },
    enableEyeTracking: { type: Boolean, default: true },
    enableWhisperTranscription: { type: Boolean, default: true },
    allowedInterviewTypes: {
      type: [String],
      default: ['hr', 'technical', 'behavioral', 'aptitude'],
    },
    maintenanceMode: { type: Boolean, default: false },
    platformName: { type: String, default: 'SmartHire AI' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Setting', SettingSchema);
