const fs = require('fs');
const csv = require('csv-parser');
const Exam = require('../models/Exam');
const Result = require('../models/Result');

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

async function getExams(req, res, next) {
  try {
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, Number.parseInt(req.query.limit, 10) || 10));
    const filter = {};
    if (req.query.search) {
      const regex = new RegExp(escapeRegex(String(req.query.search).trim()), 'i');
      filter.$or = [{ title: regex }, { subject: regex }];
    }
    if (req.query.subject) filter.subject = new RegExp(`^${escapeRegex(String(req.query.subject).trim())}$`, 'i');
    if (req.user.role === 'student') filter.isPublished = true;
    if (req.query.mine === 'true' && ['faculty', 'admin'].includes(req.user.role)) {
      filter.createdBy = req.user._id;
    }

    const [items, total] = await Promise.all([
      Exam.find(filter)
        .select(req.user.role === 'student' ? '-questions.correctOptionIndex' : '')
        .populate('createdBy', 'name')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Exam.countDocuments(filter)
    ]);
    return res.json({ items, page, limit, total, pages: Math.ceil(total / limit) });
  } catch (error) {
    return next(error);
  }
}

async function getExamById(req, res, next) {
  try {
    const exam = await Exam.findById(req.params.id)
      .select(req.user.role === 'student' ? '-questions.correctOptionIndex' : '')
      .populate('createdBy', 'name')
      .lean();
    if (!exam || (req.user.role === 'student' && !exam.isPublished)) {
      return res.status(404).json({ message: 'Exam not found' });
    }
    return res.json(exam);
  } catch (error) {
    return next(error);
  }
}

function validateExamInput(body) {
  if (!body.title || !body.subject || !Array.isArray(body.questions) || body.questions.length === 0) {
    return 'Title, subject, and at least one question are required';
  }
  const questions = body.questions.map((question) => ({
    questionText: String(question.questionText || '').trim(),
    options: Array.isArray(question.options) ? question.options.map(String) : [],
    correctOptionIndex: Number(question.correctOptionIndex),
    marks: Number(question.marks) || 1
  }));
  if (
    questions.some(
      (question) =>
        !question.questionText ||
        question.options.length < 2 ||
        question.correctOptionIndex < 0 ||
        question.correctOptionIndex >= question.options.length ||
        !Number.isInteger(question.correctOptionIndex) ||
        question.marks < 1
    )
  ) {
    return 'Every question must include text, at least two options, a valid correct option, and positive marks';
  }
  return questions;
}

async function createExam(req, res, next) {
  try {
    const questions = validateExamInput(req.body);
    if (typeof questions === 'string') return res.status(400).json({ message: questions });
    const totalMarks = questions.reduce((sum, question) => sum + question.marks, 0);
    const requestedTotal = Number(req.body.totalMarks);
    if (requestedTotal && requestedTotal !== totalMarks) {
      return res.status(400).json({ message: 'Total marks must equal the sum of question marks' });
    }
    const passingMarks = Number(req.body.passingMarks);
    if (!Number.isFinite(passingMarks) || passingMarks < 0 || passingMarks > totalMarks) {
      return res.status(400).json({ message: 'Passing marks must be between zero and total marks' });
    }
    const exam = await Exam.create({
      title: req.body.title,
      subject: req.body.subject,
      durationMinutes: Number(req.body.durationMinutes),
      totalMarks,
      passingMarks,
      isPublished: req.body.isPublished !== false,
      createdBy: req.user._id,
      questions
    });
    return res.status(201).json(exam);
  } catch (error) {
    return next(error);
  }
}

function parseQuestionCSV(filePath) {
  return new Promise((resolve, reject) => {
    const questions = [];
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (row) => {
        const options = [row.option1, row.option2, row.option3, row.option4]
          .filter((option) => option !== undefined && String(option).trim() !== '')
          .map((option) => String(option).trim());
        const answer = String(row.correctOptionIndex || '').trim();
        const index = /^\d+$/.test(answer) ? Number(answer) : options.indexOf(answer);
        questions.push({
          questionText: String(row.questionText || '').trim(),
          options,
          correctOptionIndex: index,
          marks: Number(row.marks) || 1
        });
      })
      .on('error', reject)
      .on('end', () => resolve(questions));
  });
}

async function uploadQuestionsCSV(req, res, next) {
  if (!req.file) return res.status(400).json({ message: 'CSV file is required' });
  try {
    const exam = await Exam.findById(req.params.id);
    if (!exam) return res.status(404).json({ message: 'Exam not found' });
    if (req.user.role !== 'admin' && String(exam.createdBy) !== String(req.user._id)) {
      return res.status(403).json({ message: 'You can only update exams you created' });
    }
    const questions = await parseQuestionCSV(req.file.path);
    if (!questions.length || questions.some((question) =>
      !question.questionText ||
      question.options.length < 2 ||
      !Number.isInteger(question.correctOptionIndex) ||
      question.correctOptionIndex < 0 ||
      question.correctOptionIndex >= question.options.length ||
      question.marks < 1
    )) {
      return res.status(400).json({
        message: 'CSV rows need questionText, option1, option2, optional option3/option4, correctOptionIndex (zero-based or option text), and optional marks'
      });
    }
    exam.questions.push(...questions);
    exam.totalMarks = exam.questions.reduce((sum, question) => sum + question.marks, 0);
    if (exam.passingMarks > exam.totalMarks) exam.passingMarks = exam.totalMarks;
    await exam.save();
    return res.status(201).json({ message: `${questions.length} questions imported`, exam });
  } catch (error) {
    return next(error);
  } finally {
    await fs.promises.unlink(req.file.path).catch((error) => {
      if (error.code !== 'ENOENT') console.error('Unable to remove uploaded CSV:', error);
    });
  }
}

async function submitExam(req, res, next) {
  try {
    const exam = await Exam.findById(req.params.id);
    if (!exam || !exam.isPublished) return res.status(404).json({ message: 'Exam not found' });
    if (req.user.role !== 'student') return res.status(403).json({ message: 'Only students can submit exams' });
    const existing = await Result.findOne({ student: req.user._id, exam: exam._id });
    if (existing) return res.status(409).json({ message: 'You have already submitted this exam' });

    const submittedAnswers = req.body.answers;
    if (!Array.isArray(submittedAnswers)) return res.status(400).json({ message: 'Answers must be an array' });
    const answerMap = new Map(
      submittedAnswers.map((answer) => [String(answer.questionId || answer.question), Number(answer.selectedOptionIndex)])
    );
    if (answerMap.size !== submittedAnswers.length) {
      return res.status(400).json({ message: 'Each question can only have one answer' });
    }
    const validIds = new Set(exam.questions.map((question) => String(question._id)));
    if ([...answerMap.keys()].some((id) => !validIds.has(id))) {
      return res.status(400).json({ message: 'Submission contains a question outside this exam' });
    }

    const answers = exam.questions.map((question) => {
      const selectedOptionIndex = answerMap.has(String(question._id)) ? answerMap.get(String(question._id)) : null;
      if (selectedOptionIndex !== null &&
        (!Number.isInteger(selectedOptionIndex) || selectedOptionIndex < 0 || selectedOptionIndex >= question.options.length)) {
        throw Object.assign(new Error('A selected option is invalid'), { statusCode: 400 });
      }
      const isCorrect = selectedOptionIndex === question.correctOptionIndex;
      return {
        question: question._id,
        selectedOptionIndex,
        isCorrect,
        marksAwarded: isCorrect ? question.marks : 0
      };
    });
    const score = answers.reduce((sum, answer) => sum + answer.marksAwarded, 0);
    const timeTakenSeconds = Math.max(0, Math.min(
      Number(req.body.timeTakenSeconds) || 0,
      exam.durationMinutes * 60
    ));
    const result = await Result.create({
      student: req.user._id,
      exam: exam._id,
      score,
      totalMarks: exam.totalMarks,
      percentage: Number(((score / exam.totalMarks) * 100).toFixed(2)),
      status: score >= exam.passingMarks ? 'Pass' : 'Fail',
      timeTakenSeconds,
      answers
    });
    return res.status(201).json(result);
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ message: 'You have already submitted this exam' });
    return next(error);
  }
}

module.exports = {
  getExams,
  getExamById,
  createExam,
  uploadQuestionsCSV,
  submitExam
};

