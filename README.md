# Examly — Online Examination & Result Management

Examly is a role-based MERN application for delivering multiple-choice exams, automatically grading student submissions, and reviewing performance through dashboards, leaderboards, and downloadable scorecards.

## Features

- **Students:** searchable/paginated published exams, timed assessments, automatic grading, results history, analytics, leaderboard, and PDF scorecards.
- **Students:** topic-level Revision Coach and a Mistake Notebook with incorrect answers and faculty explanations after submission.
- **Faculty:** create and publish MCQ exams, tag questions by topic, add answer explanations, import questions from CSV, and export exam results.
- **Administrators:** system overview, account activation controls, and exam monitoring.
- **Platform:** JWT authentication, bcrypt password hashing, role-based access control, persisted light/dark theme, responsive UI, and centralized API errors.

## Technology

| Area | Stack |
| --- | --- |
| Frontend | React 18, Vite, Tailwind CSS, React Router, Axios |
| Charts and exports | Recharts, jsPDF, jsPDF-AutoTable, json2csv |
| Backend | Node.js, Express, Mongoose, MongoDB Atlas |
| Authentication | JSON Web Tokens, bcryptjs |

## Architecture

```text
frontend/src/
  components/       Shared navigation, access guard, question palette
  context/          Authentication and theme state
  pages/            Login, role dashboards, live exam, leaderboard
  services/         Axios client and session handling
  utils/            PDF scorecard generation
backend/
  config/           MongoDB connection
  controllers/      Auth, exam, and result workflows
  middleware/       JWT/RBAC and centralized error handling
  models/           User, exam, and result schemas
  routes/           /api/auth, /api/exams, /api/results
  utils/            Repeatable demo-data seeder
```

## API

All endpoints are prefixed with `/api`. Protected routes require `Authorization: Bearer <token>`. Public registration creates student accounts only.

| Method | Endpoint | Access | Description |
| --- | --- | --- | --- |
| `POST` | `/auth/register` | Public | Register a student |
| `POST` | `/auth/login` | Public | Sign in and receive a JWT and profile |
| `PATCH` | `/auth/change-password` | Signed in | Change password after verifying the current password |
| `GET` | `/auth/users` | Admin | List users |
| `PATCH` | `/auth/users/:id/status` | Admin | Toggle user active status |
| `GET` | `/exams?search=&subject=&page=&limit=` | Signed in | Search/paginate exams; students do not receive answer keys |
| `GET` | `/exams/:id` | Signed in | Get exam detail; answer keys are restricted to faculty/admin |
| `POST` | `/exams` | Faculty/Admin | Create and publish an MCQ exam |
| `POST` | `/exams/:id/questions/csv` | Exam owner/Admin | Append questions from a CSV multipart file (`file`) |
| `POST` | `/exams/:id/submit` | Student | Submit answers for one-time automatic grading |
| `GET` | `/results/mine` | Student | List own results |
| `GET` | `/results/learning-insights` | Student | Topic mastery and post-submission mistake review |
| `GET` | `/results/leaderboard?examId=` | Signed in | Global or exam leaderboard |
| `GET` | `/results/analytics` | Signed in | Role-aware dashboard summaries and chart data |
| `GET` | `/results/export?examId=` | Faculty/Admin | Export permitted exam results as CSV |
| `GET` | `/api/health` | Public | Health check |

CSV uploads expect headers `questionText,option1,option2,option3,option4,correctOptionIndex,marks,topic,explanation`. `option3`, `option4`, `marks`, `topic`, and `explanation` are optional; correct answers can be represented by a zero-based index or the exact option text. Question explanations are only returned to students after exam submission.

## Local setup

Requirements: Node.js 18+ and an accessible MongoDB database (Atlas or local MongoDB).

1. Install backend dependencies and configure its environment:

   ```powershell
   cd backend
   npm install
   Copy-Item .env.example .env
   ```

   Set `MONGO_URI` to your database connection string and replace `JWT_SECRET` with a long random secret. Set `CLIENT_URL` to the frontend origin if it differs from `http://localhost:5173`.

2. Seed demo data and start the API:

   ```powershell
   npm run seed
   npm run dev
   ```

   The repeatable seed creates `admin@college.edu`, `faculty@college.edu`, and `student@college.edu`, all with password `password123`, plus two sample exams. Protect these demo accounts and change their passwords before deploying.

3. In a separate terminal, install and start the frontend:

   ```powershell
   cd frontend
   npm install
   Copy-Item .env.example .env
   npm run dev
   ```

   The app runs at `http://localhost:5173`; the API defaults to `http://localhost:5000`.

## Deployment

### MongoDB Atlas

Create a database user with a strong password, allow only the network ranges needed by the deployed backend, and copy the Atlas connection URI. Configure the database name in the URI and URL-encode special characters in the password. Never commit `.env` files.

### Backend on Render

Create a Render Web Service from the repository, set the root directory to `backend`, build command to `npm install`, and start command to `npm start`. Add `MONGO_URI`, `JWT_SECRET`, `CLIENT_URL` (the deployed frontend origin), and optionally `PORT` as environment variables. Run `npm run seed` from the service shell only when you intend to provision/reset the demo users and sample exams.

### Frontend on Vercel

Import the repository into Vercel and set the project root to `frontend`. Configure `VITE_API_URL` to the deployed backend API URL, such as `https://<service>.onrender.com/api`, then build with `npm run build` and output directory `dist`. Add the Vercel origin to backend `CLIENT_URL` and redeploy the backend if changed.

## Security notes

- `.env`, dependencies, and build artifacts are excluded by Git ignore rules.
- Never use the seeded demo credentials in production; rotate or remove them after setup.
- Student registration cannot choose an elevated role.
- Exam answers are hidden from student-facing API responses and grading occurs on the server.
- Result submissions have a unique student/exam index to prevent duplicate attempts.
