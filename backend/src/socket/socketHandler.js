/**
 * Socket.IO handler
 *
 * Each user joins a room named after their userId.
 * To send an alert to a specific user from anywhere in the backend:
 *
 *   const io = req.app.get('io');
 *   io.to(userId.toString()).emit('new_alert', alertData);
 */

const jwt = require('jsonwebtoken');
const User = require('../models/User');

function initSocket(io) {
  // Middleware: authenticate socket connections with JWT
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication required'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-passwordHash');

      if (!user || !user.isActive) {
        return next(new Error('User not found or inactive'));
      }

      socket.user = user;
      next();
    } catch (err) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.user._id.toString();

    // Each user joins their own private room
    socket.join(userId);

    console.log(`🔌 Socket connected: ${socket.user.name} (${socket.user.role}) — room: ${userId}`);

    // ─── Client requests unread alert count ────────────────
    socket.on('get_unread_count', async () => {
      try {
        const Alert = require('../models/Alert');
        const count = await Alert.countDocuments({ userId: socket.user._id, seen: false });
        socket.emit('unread_count', { count });
      } catch (err) {
        console.error('Socket unread count error:', err);
      }
    });

    // ─── Client marks alerts as seen ───────────────────────
    socket.on('mark_alerts_seen', async () => {
      try {
        const Alert = require('../models/Alert');
        await Alert.updateMany(
          { userId: socket.user._id, seen: false },
          { seen: true, seenAt: new Date() }
        );
        socket.emit('alerts_cleared');
      } catch (err) {
        console.error('Socket mark seen error:', err);
      }
    });

    socket.on('disconnect', () => {
      console.log(`🔌 Socket disconnected: ${socket.user.name}`);
    });
  });
}

/**
 * Helper: send a real-time alert to a specific user
 * Call this from anywhere in the backend that has access to io
 *
 * @param {Object} io - Socket.IO server instance
 * @param {string} userId - MongoDB ObjectId as string
 * @param {Object} alertData - The alert object to send
 */
function emitAlert(io, userId, alertData) {
  if (!io) {
    console.warn('Socket.IO not available — alert not sent in real-time');
    return;
  }
  io.to(userId.toString()).emit('new_alert', alertData);

  // Also update badge count
  io.to(userId.toString()).emit('badge_update', { increment: 1 });
}

module.exports = { initSocket, emitAlert };
