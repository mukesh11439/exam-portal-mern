import { useEffect, useState } from 'react';
import { Award, Medal, Trophy } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';

function duration(seconds = 0) {
  return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
}

export default function Leaderboard() {
  const [rows, setRows] = useState([]);
  const [exams, setExams] = useState([]);
  const [examId, setExamId] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/exams?limit=50').then(({ data }) => setExams(data.items)).catch(() => {});
  }, []);
  useEffect(() => {
    setLoading(true);
    api.get('/results/leaderboard', { params: examId ? { examId } : {} })
      .then(({ data }) => setRows(data))
      .catch((error) => toast.error(error.response?.data?.message || 'Unable to load leaderboard'))
      .finally(() => setLoading(false));
  }, [examId]);

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm font-semibold uppercase tracking-widest text-brand-600">Hall of achievement</p><h1 className="mt-2 text-3xl font-bold text-ink dark:text-white">Leaderboard</h1><p className="mt-1 text-slate-500 dark:text-slate-400">Top scores ranked by score, then fastest completion time.</p></div><select className="field max-w-xs" value={examId} onChange={(event) => setExamId(event.target.value)}><option value="">All exams</option>{exams.map((exam) => <option key={exam._id} value={exam._id}>{exam.title}</option>)}</select></div>
      <section className="surface overflow-hidden">
        <div className="grid grid-cols-[60px_1.5fr_1fr_90px_100px_100px] gap-3 border-b border-slate-100 bg-slate-50 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:border-slate-700 dark:bg-slate-800/60 sm:px-7"><span>Rank</span><span>Student</span><span className="hidden sm:block">Exam</span><span>Score</span><span className="hidden sm:block">Status</span><span className="text-right">Time</span></div>
        {loading ? <div className="space-y-3 p-6">{[1, 2, 3].map((item) => <div key={item} className="h-12 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800" />)}</div>
          : rows.length ? rows.map((row) => <div key={row._id} className="grid grid-cols-[60px_1.5fr_1fr_90px_100px_100px] items-center gap-3 border-b border-slate-50 px-5 py-4 text-sm last:border-0 dark:border-slate-800 sm:px-7">
            <span className={`flex h-8 w-8 items-center justify-center rounded-full font-bold ${row.rank === 1 ? 'bg-amber-100 text-amber-700' : row.rank === 2 ? 'bg-slate-200 text-slate-600' : row.rank === 3 ? 'bg-orange-100 text-orange-700' : 'text-slate-500'}`}>{row.rank <= 3 ? <Medal size={16} /> : row.rank}</span>
            <span><b className="block text-ink dark:text-white">{row.student?.name || 'Unknown student'}</b><small className="text-slate-500">{row.student?.department}</small></span>
            <span className="hidden text-slate-600 dark:text-slate-300 sm:block">{row.exam?.title || 'Exam'}</span>
            <span className="font-bold text-ink dark:text-white">{row.score}/{row.totalMarks}<small className="block font-normal text-slate-500">{row.percentage}%</small></span>
            <span className={`hidden w-fit rounded-full px-2.5 py-1 text-xs font-semibold sm:block ${row.status === 'Pass' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300'}`}>{row.status}</span>
            <span className="text-right text-slate-500">{duration(row.timeTakenSeconds)}</span>
          </div>) : <div className="py-16 text-center"><Trophy className="mx-auto mb-3 text-amber-400" size={32} /><p className="font-semibold text-ink dark:text-white">No results yet</p><p className="mt-1 text-sm text-slate-500">The leaderboard will populate after exams are submitted.</p></div>}
      </section>
      <div className="mt-3 flex items-center gap-2 text-xs text-slate-500"><Award size={14} />Rankings include submitted attempts only.</div>
    </main>
  );
}

