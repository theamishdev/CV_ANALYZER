const express = require('express');
const cors = require('cors');
const session = require('express-session');
const MongoStore = require('connect-mongo').default;
const authRoutes = require('./routes/authRoutes');
const cvRoutes = require('./routes/cvRoutes');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Request logger middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Configure CORS
const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:4200';
app.use(cors({
  origin: corsOrigin,
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Configure Session Middleware with MongoDB Store persistent cookie mapping
const sessionSecret = process.env.SESSION_SECRET || 'cv_analyzer_fallback_secret';
const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/cv_analyzer';

app.use(session({
  secret: sessionSecret,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: mongoUri,
    collectionName: 'sessions',
    ttl: 14 * 24 * 60 * 60 // 14 days
  }),
  cookie: {
    maxAge: 14 * 24 * 60 * 60 * 1000, // 14 days in ms
    secure: false, // Set to true if running over HTTPS
    httpOnly: true,
    sameSite: 'lax'
  }
}));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/cv', cvRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'CV Analyzer API is running',
    version: '1.0.0'
  });
});

// Base route for health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date() });
});

// 404 Route handler
app.use((req, res, next) => {
  res.status(404).json({ success: false, message: 'Resource not found' });
});

// Error handling middleware
app.use(errorHandler);

module.exports = app;
