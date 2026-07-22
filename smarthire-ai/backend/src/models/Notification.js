const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: {
      type: String,
      enum: ['interview_complete', 'report_ready', 'reminder', 'system', 'welcome'],
      required: true,
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    read: { type: Boolean, default: false },
    // Optional link for click-through (e.g. "/report/abc123")
    link: { type: String, default: null },
  },
  { timestamps: true }
);

// Index for efficient queries: user's unread notifications, sorted by date
NotificationSchema.index({ userId: 1, read: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', NotificationSchema);
