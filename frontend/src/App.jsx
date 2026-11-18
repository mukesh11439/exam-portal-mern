import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import Dashboard from './pages/Dashboard';
import Leaderboard from './pages/Leaderboard';
import Login from './pages/Login';
import TakeExam from './pages/TakeExam';

function PortalLayout() {
  return <><Navbar /><Routes>
    <Route path="/" element={<Dashboard />} />
    <Route path="/leaderboard" element={<Leaderboard />} />
    <Route path="/exams/:id" element={<TakeExam />} />
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes></>;
}

export default function App() {
  return <BrowserRouter>
    <Toaster position="top-right" toastOptions={{ duration: 3500 }} />
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/*" element={<PortalLayout />} />
      </Route>
    </Routes>
  </BrowserRouter>;
}

