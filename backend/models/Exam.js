const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema(
  {
    questionText: { type: String, required: true, trim: true },
    options: {
      type: [String],
      validate: {
        validator: (options) => options.length >= 2 && options.every((option) => option.trim()),
        message: 'Each question must have at least two non-empty options'
      },
      required: true
    },
    correctOptionIndex: { type: Number, required: true, min: 0 },
    marks: { type: Number, required: true, min: 1, default: 1 }
  },
  { _id: true }
);

const examSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    subject: { type: String, required: true, trim: true },
    durationMinutes: { type: Number, required: true, min: 1 },
    totalMarks: { type: Number, required: true, min: 1 },
    passingMarks: { type: Number, required: true, min: 0 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    isPublished: { type: Boolean, default: true },
    questions: {
      type: [questionSchema],
      validate: {
        validator: (questions) =>
          questions.length > 0 &&
          questions.every((question) => question.correctOptionIndex < question.options.length),
        message: 'Questions must have valid answer indexes'
      },
      required: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Exam', examSchema);

