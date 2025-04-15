const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const authRouter = require('./routes/auth');
const usersRouter = require('./routes/users');
const applicationsRouter = require('./routes/applications');
const meetingsRouter = require('./routes/meetings');
const auth = require('./middleware/auth');

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRouter);
app.use('/api/users', auth, usersRouter);  // Add auth middleware
app.use('/api/applications', auth, applicationsRouter);
app.use('/api/meetings', auth, meetingsRouter);

// ... rest of the file 