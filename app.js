require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const prometheus = require('prom-client');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');

const logger = require('./utils/logger');
const connectDB = require('./database/mongoose');
const errorHandler = require('./middleware/errorHandler');
const rateLimiter = require('./middleware/rateLimiter');
const auth = require('./middleware/auth');
const { initTelegramBot } = require('./utils/telegramBot');
const { authenticateTelegram } = require('./controllers/userController');
const { validateTelegramAuth } = require('./validation/userValidation');
const userController = require('./controllers/userController');

// Import route files
const config = require('./config');
const userRoutes = require('./routes/userRoutes');
const questRoutes = require('./routes/questRoutes');
const leaderboardRoutes = require('./routes/leaderboardRoutes');
const profileDashboardRoutes = require('./routes/profileDashboardRoutes');
const referralRoutes = require('./routes/referralRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const achievementRoutes = require('./routes/achievementRoutes');

const { initCronJobs } = require('./utils/cronJobs');

const app = express();

// Connect to MongoDB
connectDB();

// Enhanced security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", 'cdnjs.cloudflare.com'],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
  referrerPolicy: {
    policy: 'strict-origin-when-cross-origin',
  },
}));

// CORS configuration
app.use(cors({
  origin: [process.env.CORS_ORIGIN, 'https://web.telegram.org'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Telegram-Data'],
}));

app.use(compression());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(rateLimiter);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', limiter);

// Prometheus metrics
prometheus.collectDefaultMetrics({ timeout: 5000 });
const httpRequestDurationMicroseconds = new prometheus.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'code'],
  buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10]
});

// Middleware to collect HTTP metrics
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    httpRequestDurationMicroseconds
      .labels(req.method, req.route ? req.route.path : req.path, res.statusCode)
      .observe(duration);
  });
  next();
});

// Health check route
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK' });
});

// Telegram authentication route
app.post('/auth/telegram', validateTelegramAuth, userController.authenticateTelegram);
// API Routes
app.use('/api/users', userRoutes);
app.use('/api/quests', auth, questRoutes);
app.use('/api/leaderboard', auth, leaderboardRoutes);
app.use('/api/profile-dashboard', auth, profileDashboardRoutes);
app.use('/api/referral', auth, referralRoutes);
app.use('/api/settings', auth, settingsRoutes);
app.use('/api/achievements', auth, achievementRoutes);

// Expose metrics endpoint for Prometheus
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', prometheus.register.contentType);
  res.end(await prometheus.register.metrics());
});

// Initialize Telegram bot
const botPromise = initTelegramBot().catch(error => {
  logger.error('Failed to initialize Telegram bot:', error);
  return null;
});

// Telegram bot webhook route
app.post(`/bot${process.env.TELEGRAM_BOT_TOKEN}`, (req, res) => {
  botPromise.then(bot => {
    if (bot) {
      bot.processUpdate(req.body);
    } else {
      logger.error('Telegram bot not initialized');
    }
    res.sendStatus(200);
  });
});

// Error handling middleware
app.use(errorHandler);

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received.');
  logger.info('Closing HTTP server.');
  server.close(() => {
    logger.info('HTTP server closed.');
    // Close database connection
    mongoose.connection.close(false, () => {
      logger.info('MongoDB connection closed.');
      process.exit(0);
    });
  });
});

const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => logger.info(`Server running on port ${PORT}`));

module.exports = app;