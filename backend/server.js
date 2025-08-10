const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const authMiddleware = require('./middleware/authMiddleware');

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
      'https://3gpp-visa-letter-request-portal.vercel.app',
      'https://visas.3gppmeetings.atis.org',
      'https://visa-request-management-sg.vercel.app' // Singapore frontend
    ];
    
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Content-Type', 'Authorization']
}));

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

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/applications', authMiddleware, applicationRoutes);
app.use('/api/upload', authMiddleware, uploadRoutes);
app.use('/api/admin', authMiddleware, adminRoutes);
app.use('/api/meetings', authMiddleware, meetingRoutes);
app.use('/api/users', authMiddleware, userRoutes);

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