const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');

dotenv.config();

const app = express();

// Basic security headers
app.use(helmet({
  // Disable CSP for development
  contentSecurityPolicy: process.env.NODE_ENV === 'production',
  // Allow iframe loading in development
  frameguard: process.env.NODE_ENV === 'production'
}));

// Simple CORS configuration
app.use(cors({
  origin: (origin, callback) => {
    const allowedOrigins = [
      'http://localhost:5173',
      'http://localhost:3000',
      'https://3gpp-visa-letter-request-portal.vercel.app',
      'https://visas.3gppmeetings.atis.org',
      'https://visa-request-management-sg.vercel.app', // Singapore frontend
      'https://visa-request-management-sg-git-main-hankdaughertys-projects.vercel.app', // Actual Singapore frontend URL
      // Add any new domains here
    ];
    
    console.log('CORS request from origin:', origin);
    
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) {
      console.log('No origin, allowing request');
      return callback(null, true);
    }
    
    if (allowedOrigins.indexOf(origin) === -1) {
      console.log('Origin not allowed:', origin);
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    
    console.log('Origin allowed:', origin);
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400 // Cache preflight for 24 hours
}));

// Add health check endpoint for monitoring
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    region: 'singapore',
    service: 'visa-request-management',
    version: '1.0.0',
    connectivity: 'active'
  });
});

// Add detailed connectivity test endpoint
app.get('/connectivity-test', async (req, res) => {
  try {
    // Test database connectivity
    const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: dbStatus,
      region: 'singapore',
      clientIP: req.ip,
      userAgent: req.get('User-Agent'),
      headers: req.headers
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
const authRoutes = require('./routes/authRoutes');
const applicationRoutes = require('./routes/applications');
const uploadRoutes = require('./routes/upload');
const adminRoutes = require('./routes/admin');
const meetingRoutes = require('./routes/meetings');
const userRoutes = require('./routes/users');

// Mount routes - REMOVED global authMiddleware to fix routing issues
app.use('/api/auth', authRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/meetings', meetingRoutes);
app.use('/api/users', userRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('MongoDB Connected');
  })
  .catch(err => {
    console.error('MongoDB Connection Error:', err);
    process.exit(1);
  });

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`)); 