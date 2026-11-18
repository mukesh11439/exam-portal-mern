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

async function getLearningInsights(req, res, next) {
  try {
    const results = await Result.find({ student: req.user._id }).sort({ createdAt: -1 }).lean();
    const examIds = [...new Set(results.map((result) => String(result.exam)))];
    const exams = await Exam.find({ _id: { $in: examIds } })
      .select('title subject questions.questionText questions.topic questions.explanation questions.options questions.correctOptionIndex')
      .lean();
    const examById = new Map(exams.map((exam) => [String(exam._id), exam]));
    const topics = new Map();
    const mistakes = [];

    results.forEach((result) => {
      const exam = examById.get(String(result.exam));
      if (!exam) return;
      const questions = new Map(exam.questions.map((question) => [String(question._id), question]));

      result.answers.forEach((answer) => {
        const question = questions.get(String(answer.question));
        if (!question || answer.selectedOptionIndex === null || answer.selectedOptionIndex === undefined) return;
        const topic = question.topic || exam.subject || 'General';
        const stats = topics.get(topic) || { topic, attempts: 0, correct: 0, marksEarned: 0, possibleMarks: 0 };
        stats.attempts += 1;
        stats.possibleMarks += question.marks;
        stats.marksEarned += answer.marksAwarded;
        if (answer.isCorrect) {
          stats.correct += 1;
        } else {
          mistakes.push({
            exam: exam.title,
            subject: exam.subject,
            topic,
            question: question.questionText,
            selectedAnswer: question.options[answer.selectedOptionIndex],
            correctAnswer: question.options[question.correctOptionIndex],
            explanation: question.explanation,
            submittedAt: result.createdAt
          });
        }
        topics.set(topic, stats);
      });
    });

    const topicStats = [...topics.values()]
      .map((stats) => ({
        ...stats,
        mastery: stats.possibleMarks
          ? Number(((stats.marksEarned / stats.possibleMarks) * 100).toFixed(1))
          : 0
      }))
      .sort((a, b) => a.mastery - b.mastery || b.attempts - a.attempts);
    return res.json({
      topics: topicStats,
      weakTopic: topicStats.find((topic) => topic.mastery < 70) || null,
      mistakes: mistakes.slice(0, 30)
    });
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

module.exports = { getMyResults, getLearningInsights, getLeaderboard, getAnalytics, exportResults };

