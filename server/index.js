require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const path = require('path');

const { initializeDb, startBackupSchedule } = require('./services/databaseService');
const { generalLimiter } = require('./middleware/rateLimiter');
const { sanitizeRequest } = require('./middleware/validator');
const errorHandler = require('./middleware/errorHandler');

// Route imports
const authRoutes = require('./routes/auth');
const leadsRoutes = require('./routes/leads');
const studentsRoutes = require('./routes/students');
const mastersRoutes = require('./routes/masters');
const configRoutes = require('./routes/config');

// Validate critical environment variables before startup
if (!process.env.JWT_SECRET) {
  console.error('FATAL: JWT_SECRET is not set. Set JWT_SECRET in your environment and restart.');
  process.exit(1);
}
// Require admin seed vars for first-time setup
if (!process.env.DEFAULT_ADMIN_USERNAME) {
  console.error('[CONFIG ERROR] DEFAULT_ADMIN_USERNAME environment variable is required.');
  process.exit(1);
}
if (!process.env.DEFAULT_ADMIN_PASSWORD) {
  console.error('[CONFIG ERROR] DEFAULT_ADMIN_PASSWORD environment variable is required.');
  process.exit(1);
}

const app = express();
app.set("trust proxy", 1);
const PORT = process.env.PORT || 5000;

// Initialize database and then start server
initializeDb()
  .then(() => {
    console.log('Database verification complete.');
    // Start scheduled backups
    startBackupSchedule();

    // Start server after DB is ready
    app.listen(PORT, () => {
      console.log(`Server is running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('Critical database initialization failed:', err);
    process.exit(1);
  });

// HTTP Request Logger
app.use(morgan('dev'));

// Security Headers
app.use(helmet({
  contentSecurityPolicy: false, // Turn off CSP if we need to render React bundle directly
}));

// CORS Configuration
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Gzip Compression
app.use(compression());

// Body Parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Apply global rate limiting and request sanitization
app.use(generalLimiter);
app.use(sanitizeRequest);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/leads', leadsRoutes);
app.use('/api/students', studentsRoutes);
app.use('/api/masters', mastersRoutes);
app.use('/api/config', configRoutes);

// Base route for health check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'UP',
    timestamp: new Date().toISOString(),
    database: 'SQLite connected'
  });
});

// Central Error Handler
app.use(errorHandler);

// Note: server is started after DB initialization above
