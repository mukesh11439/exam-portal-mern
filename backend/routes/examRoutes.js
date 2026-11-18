const express = require('express');
const multer = require('multer');
const os = require('os');
const { protect, authorize } = require('../middleware/authMiddleware');
const {
  getExams,
  getExamById,
  createExam,
  uploadQuestionsCSV,
  submitExam
} = require('../controllers/examController');

const router = express.Router();
const upload = multer({
  dest: os.tmpdir(),
  limits: { fileSize: 2 * 1024 * 1024, files: 1 },
  fileFilter: (req, file, callback) => {
    if (file.mimetype !== 'text/csv' && !file.originalname.toLowerCase().endsWith('.csv')) {
      return callback(Object.assign(new Error('Only CSV files are accepted'), { statusCode: 400 }));
    }
    return callback(null, true);
  }
});

router.use(protect);
router.get('/', getExams);
router.post('/', authorize('faculty', 'admin'), createExam);
router.get('/:id', getExamById);
router.post('/:id/questions/csv', authorize('faculty', 'admin'), upload.single('file'), uploadQuestionsCSV);
router.post('/:id/submit', authorize('student'), submitExam);

module.exports = router;

