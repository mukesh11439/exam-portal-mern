const { Parser } = require('json2csv');
const Result = require('../models/Result');
const Exam = require('../models/Exam');

async function getMyResults(req, res, next) {
  try {
    const results = await Result.find({ student: req.user._id })
      .populate('exam', 'title subject totalMarks passingMarks')
      .sort({ createdAt: -1 })
      .lean();
    return res.json(results);
  } catch (error) {
    return next(error);
  }
}

async function getLeaderboard(req, res, next) {
  try {
    const filter = {};
    if (req.query.examId) filter.exam = req.query.examId;
    const results = await Result.find(filter)
      .populate('student', 'name department')
      .populate('exam', 'title subject')
      .sort({ score: -1, timeTakenSeconds: 1, createdAt: 1 })
      .limit(Math.min(100, Math.max(1, Number.parseInt(req.query.limit, 10) || 50)))
      .lean();
    return res.json(results.map((result, index) => ({ ...result, rank: index + 1 })));
  } catch (error) {
    return next(error);
  }
}

async function getAnalytics(req, res, next) {
  try {
    const isAdmin = req.user.role === 'admin';
    const match = isAdmin ? {} : { student: req.user._id };
    const [results, totalExams, totalUsers, publishedExams] = await Promise.all([
      Result.find(match).populate('exam', 'title subject').sort({ createdAt: 1 }).lean(),
      Exam.countDocuments(isAdmin ? {} : { isPublished: true }),
      isAdmin ? require('../models/User').countDocuments() : Promise.resolve(undefined),
      isAdmin ? Exam.countDocuments({ isPublished: true }) : Promise.resolve(undefined)
    ]);
    const average = results.length
      ? Number((results.reduce((sum, result) => sum + result.percentage, 0) / results.length).toFixed(1))
      : 0;
    const byExam = new Map();
    results.forEach((result) => {
      const key = String(result.exam?._id || 'unknown');
      const existing = byExam.get(key) || {
        exam: result.exam?.title || 'Exam',
        subject: result.exam?.subject || '',
        attempts: 0,
        score: 0,
        pass: 0
      };
      existing.attempts += 1;
      existing.score += result.percentage;
      if (result.status === 'Pass') existing.pass += 1;
      byExam.set(key, existing);
    });
    const performance = [...byExam.values()].map((item) => ({
      ...item,
      average: Number((item.score / item.attempts).toFixed(1)),
      passRate: Number(((item.pass / item.attempts) * 100).toFixed(1))
    }));
    return res.json({
      summary: {
        attempts: results.length,
        average,
        passCount: results.filter((result) => result.status === 'Pass').length,
        totalExams,
        ...(isAdmin ? { totalUsers, publishedExams } : {})
      },
      performance
    });
  } catch (error) {
    return next(error);
  }
}

async function exportResults(req, res, next) {
  try {
    const filter = {};
    if (req.query.examId) filter.exam = req.query.examId;
    if (req.user.role === 'faculty') {
      const ownExams = await Exam.find({ createdBy: req.user._id }).select('_id').lean();
      filter.exam = { $in: ownExams.map((exam) => exam._id) };
      if (req.query.examId) filter.exam = req.query.examId;
    }
    if (req.user.role === 'student') filter.student = req.user._id;
    const results = await Result.find(filter)
      .populate('student', 'name email department')
      .populate('exam', 'title subject')
      .sort({ score: -1, timeTakenSeconds: 1 })
      .lean();
    const parser = new Parser({
      fields: [
        { label: 'Student', value: 'student.name' },
        { label: 'Email', value: 'student.email' },
        { label: 'Department', value: 'student.department' },
        { label: 'Exam', value: 'exam.title' },
        { label: 'Subject', value: 'exam.subject' },
        'score',
        'totalMarks',
        'percentage',
        'status',
        'timeTakenSeconds',
        { label: 'Submitted At', value: 'createdAt' }
      ]
    });
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="exam-results.csv"');
    return res.send(parser.parse(results));
  } catch (error) {
    return next(error);
  }
}

module.exports = { getMyResults, getLeaderboard, getAnalytics, exportResults };

