require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');
const Exam = require('../models/Exam');

const users = [
  { name: 'College Admin', email: 'admin@college.edu', role: 'admin', department: 'Administration' },
  { name: 'Demo Faculty', email: 'faculty@college.edu', role: 'faculty', department: 'Computer Science' },
  { name: 'Demo Student', email: 'student@college.edu', role: 'student', department: 'Computer Science' }
];

const sampleExams = [
  {
    title: 'JavaScript Fundamentals',
    subject: 'Programming',
    durationMinutes: 20,
    questions: [
      { questionText: 'Which keyword declares a block-scoped variable?', options: ['var', 'let', 'define', 'static'], correctOptionIndex: 1, marks: 2 },
      { questionText: 'What does Array.map() return?', options: ['A new array', 'A number', 'The original array only', 'A boolean'], correctOptionIndex: 0, marks: 2 },
      { questionText: 'Which value represents an intentional absence?', options: ['0', 'false', 'null', 'NaN'], correctOptionIndex: 2, marks: 2 }
    ]
  },
  {
    title: 'Database Essentials',
    subject: 'Database Systems',
    durationMinutes: 25,
    questions: [
      { questionText: 'Which command retrieves rows in SQL?', options: ['GET', 'FETCH ALL', 'SELECT', 'READ'], correctOptionIndex: 2, marks: 2 },
      { questionText: 'What does a primary key ensure?', options: ['Unique row identity', 'Encryption', 'Sorting', 'Compression'], correctOptionIndex: 0, marks: 2 },
      { questionText: 'MongoDB stores records primarily as what?', options: ['CSV rows', 'BSON documents', 'XML pages', 'Graph edges'], correctOptionIndex: 1, marks: 2 }
    ]
  }
];

async function seed() {
  await connectDB();
  for (const data of users) {
    let user = await User.findOne({ email: data.email }).select('+password');
    if (!user) user = new User({ ...data, password: 'password123', isActive: true });
    else {
      user.name = data.name;
      user.role = data.role;
      user.department = data.department;
      user.password = 'password123';
      user.isActive = true;
    }
    await user.save();
  }

  const faculty = await User.findOne({ email: 'faculty@college.edu' });
  for (const data of sampleExams) {
    const questions = data.questions;
    await Exam.findOneAndUpdate(
      { title: data.title, createdBy: faculty._id },
      {
        $set: {
          ...data,
          questions,
          totalMarks: questions.reduce((sum, question) => sum + question.marks, 0),
          passingMarks: 3,
          isPublished: true,
          createdBy: faculty._id
        }
      },
      { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
    );
  }
  console.log('Seed complete: demo users and sample exams are ready.');
}

seed()
  .catch((error) => {
    console.error('Seed failed:', error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });

