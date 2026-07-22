const Notification = require('../models/Notification');
const User = require('../models/User');
const { sendEmail } = require('../services/email.service');


/**
 * GET /notifications?unread=true
 */
exports.getNotifications = async (req, res) => {
  try {
    const filter = { userId: req.user.id };
    if (req.query.unread === 'true') filter.read = false;

    const notifications = await Notification.find(filter)
      .sort({ createdAt: -1 })
      .limit(50);

    const unreadCount = await Notification.countDocuments({ userId: req.user.id, read: false });

    res.json({ notifications, unreadCount });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch notifications', error: err.message });
  }
};

/**
 * PATCH /notifications/:id/read
 */
exports.markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { read: true },
      { new: true }
    );
    if (!notification) return res.status(404).json({ message: 'Notification not found' });
    res.json({ notification });
  } catch (err) {
    res.status(500).json({ message: 'Failed to mark notification as read', error: err.message });
  }
};

/**
 * POST /notifications/mark-all-read
 */
exports.markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { userId: req.user.id, read: false },
      { read: true }
    );
    res.json({ message: 'All notifications marked as read' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to mark all as read', error: err.message });
  }
};

/**
 * Utility: create a notification (used internally by other controllers)
 */
exports.createNotification = async ({ userId, type, title, message, link }) => {
  try {
    const notification = await Notification.create({ userId, type, title, message, link });
    
    // Send email for critical alerts
    if (type === 'interview_complete' || type === 'report_ready') {
      const user = await User.findById(userId);
      if (user && user.email) {
        const emailHtml = `
          <div style="font-family: sans-serif; max-w: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #4f46e5;">SmartHire AI</h2>
            <h3>${title}</h3>
            <p>${message}</p>
            ${link ? `<a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}${link}" style="display: inline-block; padding: 10px 20px; background-color: #4f46e5; color: white; text-decoration: none; border-radius: 5px; margin-top: 15px;">View Details</a>` : ''}
          </div>
        `;
        await sendEmail(user.email, title, emailHtml);
      }
    }
    
    return notification;
  } catch (err) {
    console.warn('[notification] Failed to create notification:', err.message);
    return null;
  }
};

