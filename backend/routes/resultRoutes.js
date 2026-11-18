const express = require('express');
const { protect, authorize } = require('../middleware/authMiddleware');
const { getMyResults, getLearningInsights, getLeaderboard, getAnalytics, exportResults } = require('../controllers/resultController');

const router = express.Router();
router.use(protect);
router.get('/mine', authorize('student'), getMyResults);
router.get('/learning-insights', authorize('student'), getLearningInsights);
router.get('/leaderboard', getLeaderboard);
router.get('/analytics', getAnalytics);
router.get('/export', authorize('faculty', 'admin'), exportResults);

module.exports = router;

