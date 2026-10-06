const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { createServer } = require('http');
const { Server } = require('socket.io');
const cron = require('node-cron');
const cookieParser = require('cookie-parser');
const mongoSanitize = require('express-mongo-sanitize');
require('dotenv').config();

// ─── Import routes ───────────────────────────────────────────
const authRoutes       = require('./routes/auth');
const userRoutes       = require('./routes/users');
const assessmentRoutes = require('./routes/assessments');
const ktPlanRoutes     = require('./routes/ktPlans');
const ktTaskRoutes     = require('./routes/ktTasks');
const aiRoutes         = require('./routes/ai');
const improvementActionRoutes = require('./routes/improvementActions');
const importRoutes     = require('./routes/importExport');
const researchRoutes   = require('./routes/research');
const alertRoutes      = require('./routes/alerts');
const webhookRoutes    = require('./routes/webhooks');

// ─── Import socket handler ───────────────────────────────────
const { initSocket } = require('./socket/socketHandler');

// ─── Import cron jobs ────────────────────────────────────────
const { runAssessmentReminders } = require('./jobs/assessmentReminder');
const { runKTOverdueCheck }      = require('./jobs/ktOverdueCheck');
const { initHRDeadlineReminder } = require('./jobs/hrDeadlineReminder');

// ─── App setup ───────────────────────────────────────────────
const app = express();
const httpServer = createServer(app);

// ─── Socket.IO setup ─────────────────────────────────────────
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:5173',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
];

function isAllowedOrigin(origin) {
  return !origin || allowedOrigins.includes(origin);
}

const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Make io accessible throughout the app via req.io
app.set('io', io);

// Initialize socket connection handler
initSocket(io);

// ─── Middleware ───────────────────────────────────────────────
app.use(helmet({
  crossOriginEmbedderPolicy: false, // needed for Socket.IO
  crossOriginResourcePolicy: { policy: 'cross-origin' }, // allow GridFS avatars on frontend origin
}));

app.use(cors({
  origin(origin, callback) {
    if (isAllowedOrigin(origin)) return callback(null, true);
    return callback(new Error(`CORS origin not allowed: ${origin}`));
  },
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(mongoSanitize());

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// ─── Health check ─────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    system: 'KnowledgeGuard 3.0',
    time: new Date().toISOString(),
    db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    services: {
      email: Boolean(process.env.GMAIL_USER && process.env.GMAIL_PASS),
      ai: Boolean(process.env.GROQ_API_KEY),
      ml: Boolean(process.env.ML_SERVICE_URL),
    },
  });
});

// ─── Routes ───────────────────────────────────────────────────
app.use('/api/auth',     authRoutes);
app.use('/api/users',    userRoutes);
app.use('/api/assessments', assessmentRoutes);
app.use('/api/kt-plans', ktPlanRoutes);
app.use('/api/kt-tasks', ktTaskRoutes);
app.use('/api/ai',       aiRoutes);
app.use('/api/improvement-actions', improvementActionRoutes);
app.use('/api',          importRoutes);   // /api/import/... and /api/export/...
app.use('/api/research', researchRoutes);
app.use('/api/alerts',   alertRoutes);
app.use('/api/webhooks', webhookRoutes);

// ─── Global error handler ─────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Global error:', err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// ─── 404 handler ─────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// ─── Database connection ──────────────────────────────────────
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ MongoDB connected successfully');

    // Start cron jobs after DB is ready
    // Assessment reminders — runs every day at 08:00
    cron.schedule('0 8 * * *', () => {
      console.log('⏰ Running assessment reminder job');
      runAssessmentReminders();
    });

    // KT overdue check — runs every day at 08:30
    cron.schedule('30 8 * * *', () => {
      console.log('⏰ Running KT overdue check job');
      runKTOverdueCheck();
    });

    // Initialize HR deadline reminder
    initHRDeadlineReminder();

    console.log('⏰ Cron jobs scheduled');

    // Start server
    const PORT = process.env.PORT || 5000;
    httpServer.listen(PORT, () => {
      console.log(`🚀 KnowledgeGuard backend running on port ${PORT}`);
      console.log(`   Health check: http://localhost:${PORT}/api/health`);
    });
  })
  .catch((err) => {
    console.error('❌ MongoDB connection failed:', err.message);
    process.exit(1);
  });

module.exports = { app, io };
