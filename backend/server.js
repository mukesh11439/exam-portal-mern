require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const examRoutes = require('./routes/examRoutes');
const resultRoutes = require('./routes/resultRoutes');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

const app = express();
const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim());

app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.get('/api', (req, res) => res.json({
  name: 'Examly API',
  status: 'running',
  endpoints: ['/api/health', '/api/auth', '/api/exams', '/api/results']
}));
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
app.use('/api/auth', authRoutes);
app.use('/api/exams', examRoutes);
app.use('/api/results', resultRoutes);
app.use(notFound);
app.use(errorHandler);

const port = Number(process.env.PORT) || 5000;
if (require.main === module) {
  connectDB()
    .then(() => app.listen(port, () => console.log(`API listening on port ${port}`)))
    .catch((error) => {
      console.error('Unable to start server:', error.message);
      process.exitCode = 1;
    });
}

module.exports = app;

