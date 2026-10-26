require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const authRoutes = require('./routes/authRoute');
const userRoutes = require('./routes/userRoute');
const taskRoutes = require('./routes/taskRoute');
const notFound = require('./middlewares/notFound');
const errorMiddleware = require('./middlewares/errorMiddleware');

const app = express();

// Connect to DB
mongoose.connect(process.env.DB_URL)
  .then(() => console.log(' DB connected'))
  .catch(err => console.error(' DB connection error:', err));

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/tasks', taskRoutes);

// 404 Not Found Handler
app.use(notFound);

// Global Error Handler
app.use(errorMiddleware);

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
