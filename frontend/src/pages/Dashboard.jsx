import { useCallback, useEffect, useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Activity, ArrowRight, BookOpen, CheckCircle2, Download, FileUp, GraduationCap, Lightbulb, Plus, Search, Shield, Target, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import generateScorecard from '../utils/generateScorecard';

function StatCard({ label, value, note, icon: Icon, tone = 'blue' }) {
  const tones = {
    blue: 'bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-300',
    green: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-300',
    amber: 'bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-300',
    violet: 'bg-violet-50 text-violet-600 dark:bg-violet-950 dark:text-violet-300'
  };
  return <article className="surface flex items-start justify-between p-5"><div><p className="text-sm text-slate-500 dark:text-slate-400">{label}</p><p className="mt-2 text-3xl font-bold text-ink dark:text-white">{value}</p><p className="mt-1 text-xs text-slate-400">{note}</p></div><span className={`grid h-10 w-10 place-items-center rounded-xl ${tones[tone]}`}><Icon size={19} /></span></article>;
}

function LoadingCards() {
  return <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[1, 2, 3, 4].map((item) => <div key={item} className="surface h-28 animate-pulse bg-slate-100 dark:bg-slate-800" />)}</div>;
}

function StudentDashboard() {
  const { user } = useAuth();
  const [exams, setExams] = useState([]);
  const [results, setResults] = useState([]);
  const [analytics, setAnalytics] = useState({ summary: {}, performance: [] });
  const [insights, setInsights] = useState({ topics: [], weakTopic: null, mistakes: [] });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [subject, setSubject] = useState('');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [examResponse, resultResponse, analyticsResponse, insightsResponse] = await Promise.all([
        api.get('/exams', { params: { search: search || undefined, subject: subject || undefined, page, limit: 6 } }),
        api.get('/results/mine'),
        api.get('/results/analytics'),
        api.get('/results/learning-insights')
      ]);
      const completed = new Set(resultResponse.data.map((result) => String(result.exam?._id)));
      setExams(examResponse.data.items.filter((exam) => !completed.has(String(exam._id))));
      setPages(Math.max(1, examResponse.data.pages));
      setResults(resultResponse.data);
      setAnalytics(analyticsResponse.data);
      setInsights(insightsResponse.data);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to load your dashboard');
    } finally {
      setLoading(false);
    }
  }, [search, subject, page]);

  useEffect(() => { load(); }, [load]);
  const subjects = useMemo(() => [...new Set(exams.map((exam) => exam.subject))], [exams]);
  const avg = analytics.summary.average || 0;

  return <>
    <div className="mb-7"><p className="text-sm font-semibold uppercase tracking-widest text-brand-600">Student workspace</p><h1 className="mt-2 text-3xl font-bold text-ink dark:text-white">Good day, {user.name.split(' ')[0]}</h1><p className="mt-1 text-slate-500 dark:text-slate-400">Find your next exam and keep your learning on track.</p></div>
    {loading ? <LoadingCards /> : <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard label="Exams completed" value={results.length} note="Your submitted assessments" icon={BookOpen} />
      <StatCard label="Average score" value={`${avg}%`} note="Across all completed exams" icon={Activity} tone="violet" />
      <StatCard label="Passed exams" value={analytics.summary.passCount || 0} note="Keep up the great work" icon={CheckCircle2} tone="green" />
      <StatCard label="Available exams" value={exams.length} note="Ready when you are" icon={GraduationCap} tone="amber" />
    </div>}

    <div className="grid gap-5 xl:grid-cols-[1.25fr_.75fr]">
      <section className="surface p-5 sm:p-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-lg font-bold text-ink dark:text-white">Available exams</h2><p className="text-sm text-slate-500 dark:text-slate-400">Choose an assessment to get started.</p></div></div>
        <div className="mb-4 flex flex-wrap gap-2">
          <label className="relative min-w-[180px] flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} /><input className="field pl-9" placeholder="Search exams or subjects" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} /></label>
          <select className="field w-auto min-w-36" value={subject} onChange={(event) => { setSubject(event.target.value); setPage(1); }}><option value="">All subjects</option>{subjects.map((item) => <option key={item}>{item}</option>)}</select>
        </div>
        {loading ? <div className="space-y-3">{[1, 2, 3].map((item) => <div key={item} className="h-20 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />)}</div>
          : exams.length ? <div className="space-y-3">{exams.map((exam) => <article key={exam._id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-100 p-4 dark:border-slate-700"><div><span className="text-xs font-semibold uppercase tracking-wide text-brand-600">{exam.subject}</span><h3 className="mt-1 font-semibold text-ink dark:text-white">{exam.title}</h3><p className="mt-1 text-xs text-slate-500">{exam.durationMinutes} min · {exam.totalMarks} marks · By {exam.createdBy?.name || 'Faculty'}</p></div><Link to={`/exams/${exam._id}`} className="btn-primary !px-3 !py-2">Start <ArrowRight size={15} /></Link></article>)}</div>
            : <div className="rounded-xl bg-slate-50 py-9 text-center text-sm text-slate-500 dark:bg-slate-800/60">{search || subject ? 'No matching exams found.' : 'You’re all caught up. New exams will appear here.'}</div>}
        <div className="mt-4 flex items-center justify-between text-sm text-slate-500"><span>Page {page} of {pages}</span><div className="flex gap-2"><button className="btn-secondary !px-3 !py-1.5" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>Previous</button><button className="btn-secondary !px-3 !py-1.5" disabled={page >= pages} onClick={() => setPage((value) => value + 1)}>Next</button></div></div>
      </section>
      <section className="surface p-5 sm:p-6">
        <div className="mb-4"><h2 className="text-lg font-bold text-ink dark:text-white">Your performance</h2><p className="text-sm text-slate-500 dark:text-slate-400">Average score by assessment</p></div>
        {analytics.performance.length ? <div className="h-64"><ResponsiveContainer width="100%" height="100%"><BarChart data={analytics.performance} margin={{ top: 10, right: 8, left: -20, bottom: 4 }}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e8edf4" /><XAxis dataKey="exam" tick={{ fontSize: 10 }} tickFormatter={(value) => value.length > 12 ? `${value.slice(0, 12)}…` : value} /><YAxis domain={[0, 100]} tick={{ fontSize: 10 }} /><Tooltip formatter={(value) => [`${value}%`, 'Average']} /><Bar dataKey="average" fill="#4678ed" radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer></div> : <div className="grid h-64 place-items-center rounded-xl bg-slate-50 text-center text-sm text-slate-500 dark:bg-slate-800/60">Complete an exam to see your progress chart.</div>}
      </section>
    </div>

    <div className="mt-5 grid gap-5 lg:grid-cols-[.8fr_1.2fr]">
      <section className="surface p-5 sm:p-6">
        <div className="mb-4 flex items-center gap-2"><span className="grid h-9 w-9 place-items-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-300"><Lightbulb size={18} /></span><div><h2 className="font-bold text-ink dark:text-white">Revision Coach</h2><p className="text-xs text-slate-500 dark:text-slate-400">Personalized from your submitted answers</p></div></div>
        {insights.weakTopic ? <div className="rounded-xl bg-amber-50 p-4 dark:bg-amber-950/40"><p className="text-xs font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-300">Focus topic</p><p className="mt-1 text-lg font-bold text-ink dark:text-white">{insights.weakTopic.topic}</p><p className="mt-1 text-sm text-slate-600 dark:text-slate-300">You scored {insights.weakTopic.mastery}% across {insights.weakTopic.attempts} answered questions here. Review your mistakes, then practice this topic again.</p><div className="mt-3 h-2 overflow-hidden rounded-full bg-white dark:bg-slate-800"><div className="h-full rounded-full bg-amber-500" style={{ width: `${insights.weakTopic.mastery}%` }} /></div></div>
          : insights.topics.length ? <div className="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200"><p className="font-semibold">Great progress!</p><p className="mt-1">No weak topics identified yet. Keep practicing to build a more complete mastery map.</p></div>
            : <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600 dark:bg-slate-800/60 dark:text-slate-300">Take an exam to get topic-level recommendations based on your answers.</div>}
        {insights.topics.length > 0 && <div className="mt-4 space-y-2">{insights.topics.slice(0, 4).map((topic) => <div key={topic.topic} className="flex items-center justify-between gap-3 text-sm"><span className="truncate text-slate-600 dark:text-slate-300">{topic.topic}</span><span className={`shrink-0 font-semibold ${topic.mastery < 70 ? 'text-amber-600 dark:text-amber-300' : 'text-emerald-600 dark:text-emerald-300'}`}>{topic.mastery}%</span></div>)}</div>}
      </section>

      <section className="surface p-5 sm:p-6">
        <div className="mb-4 flex items-center gap-2"><span className="grid h-9 w-9 place-items-center rounded-xl bg-violet-50 text-violet-600 dark:bg-violet-950 dark:text-violet-300"><Target size={18} /></span><div><h2 className="font-bold text-ink dark:text-white">Mistake Notebook</h2><p className="text-xs text-slate-500 dark:text-slate-400">Review incorrect answers after each exam</p></div></div>
        {insights.mistakes.length ? <div className="max-h-[390px] space-y-3 overflow-y-auto pr-1">{insights.mistakes.map((mistake, index) => <article key={`${mistake.submittedAt}-${mistake.question}-${index}`} className="rounded-xl border border-slate-100 p-4 dark:border-slate-700"><div className="mb-2 flex flex-wrap items-center gap-2 text-xs"><span className="font-semibold text-brand-600">{mistake.topic}</span><span className="text-slate-400">{mistake.exam}</span></div><h3 className="text-sm font-semibold leading-relaxed text-ink dark:text-white">{mistake.question}</h3><p className="mt-2 text-xs text-rose-600 dark:text-rose-300">Your answer: {mistake.selectedAnswer || '—'}</p><p className="mt-1 text-xs text-emerald-700 dark:text-emerald-300">Correct answer: {mistake.correctAnswer || '—'}</p>{mistake.explanation && <p className="mt-2 border-t border-slate-100 pt-2 text-xs leading-relaxed text-slate-500 dark:border-slate-700 dark:text-slate-400">{mistake.explanation}</p>}</article>)}</div>
          : <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600 dark:bg-slate-800/60 dark:text-slate-300">Missed questions and explanations from your completed exams will be saved here.</div>}
      </section>
    </div>

    <section className="surface mt-5 overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-5 py-4 dark:border-slate-700 sm:px-6"><div><h2 className="font-bold text-ink dark:text-white">Recent results</h2><p className="text-sm text-slate-500 dark:text-slate-400">Your exam history and scorecards.</p></div></div>
      {results.length ? <div className="overflow-x-auto"><table className="w-full min-w-[620px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-slate-800/60"><tr><th className="px-6 py-3">Exam</th><th className="px-6 py-3">Score</th><th className="px-6 py-3">Status</th><th className="px-6 py-3">Date</th><th className="px-6 py-3 text-right">Scorecard</th></tr></thead><tbody>{results.map((result) => <tr key={result._id} className="border-t border-slate-50 dark:border-slate-800"><td className="px-6 py-4"><b className="text-ink dark:text-white">{result.exam?.title || 'Exam'}</b><small className="block text-slate-500">{result.exam?.subject}</small></td><td className="px-6 py-4 font-semibold text-ink dark:text-white">{result.score}/{result.totalMarks} <small className="font-normal text-slate-500">({result.percentage}%)</small></td><td className="px-6 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${result.status === 'Pass' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300'}`}>{result.status}</span></td><td className="px-6 py-4 text-slate-500">{new Date(result.createdAt).toLocaleDateString()}</td><td className="px-6 py-4 text-right"><button onClick={() => generateScorecard(result, user)} className="btn-secondary !px-3 !py-1.5"><Download size={14} />PDF</button></td></tr>)}</tbody></table></div> : <p className="px-6 py-10 text-center text-sm text-slate-500">No completed exams yet.</p>}
    </section>
  </>;
}

function FacultyDashboard() {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [durationMinutes, setDuration] = useState(30);
  const [passingMarks, setPassingMarks] = useState(3);
  const [questions, setQuestions] = useState([{ questionText: '', topic: '', explanation: '', options: ['', '', '', ''], correctOptionIndex: 0, marks: 1 }]);

  const refresh = useCallback(() => api.get('/exams?mine=true&limit=50')
    .then(({ data }) => setExams(data.items))
    .catch((error) => toast.error(error.response?.data?.message || 'Unable to load exams'))
    .finally(() => setLoading(false)), []);
  useEffect(() => { refresh(); }, [refresh]);

  const updateQuestion = (index, key, value) => setQuestions((items) => items.map((item, current) => current === index ? { ...item, [key]: value } : item));
  const updateOption = (index, optionIndex, value) => setQuestions((items) => items.map((item, current) => current === index ? { ...item, options: item.options.map((option, position) => position === optionIndex ? value : option) } : item));
  const create = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const cleanQuestions = questions.map((question) => ({ ...question, options: question.options.map((option) => option.trim()).filter(Boolean) }));
      await api.post('/exams', { title, subject, durationMinutes: Number(durationMinutes), passingMarks: Number(passingMarks), questions: cleanQuestions });
      toast.success('Exam published successfully');
      setTitle(''); setSubject('');
      setQuestions([{ questionText: '', topic: '', explanation: '', options: ['', '', '', ''], correctOptionIndex: 0, marks: 1 }]);
      refresh();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to create exam');
    } finally {
      setSaving(false);
    }
  };
  const uploadCSV = async (examId, file) => {
    if (!file) return;
    const body = new FormData();
    body.append('file', file);
    try {
      const { data } = await api.post(`/exams/${examId}/questions/csv`, body, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success(data.message);
      refresh();
    } catch (error) {
      toast.error(error.response?.data?.message || 'CSV import failed');
    }
  };
  const exportCSV = async (examId) => {
    try {
      const response = await api.get('/results/export', { params: examId ? { examId } : {}, responseType: 'blob' });
      const url = URL.createObjectURL(response.data);
      const anchor = document.createElement('a');
      anchor.href = url; anchor.download = 'exam-results.csv'; anchor.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not export results');
    }
  };

  return <>
    <div className="mb-7"><p className="text-sm font-semibold uppercase tracking-widest text-brand-600">Faculty workspace</p><h1 className="mt-2 text-3xl font-bold text-ink dark:text-white">Manage your exams</h1><p className="mt-1 text-slate-500 dark:text-slate-400">Build assessments, import questions, and review results.</p></div>
    <div className="grid gap-5 xl:grid-cols-[1fr_.95fr]">
      <form onSubmit={create} className="surface p-5 sm:p-6">
        <h2 className="mb-5 flex items-center gap-2 text-lg font-bold text-ink dark:text-white"><Plus className="text-brand-600" size={19} />Create an exam</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <label><span className="label dark:text-slate-300">Exam title</span><input className="field" value={title} onChange={(event) => setTitle(event.target.value)} required /></label>
          <label><span className="label dark:text-slate-300">Subject</span><input className="field" value={subject} onChange={(event) => setSubject(event.target.value)} required /></label>
          <label><span className="label dark:text-slate-300">Duration (minutes)</span><input className="field" type="number" min="1" value={durationMinutes} onChange={(event) => setDuration(event.target.value)} required /></label>
          <label><span className="label dark:text-slate-300">Passing marks</span><input className="field" type="number" min="0" value={passingMarks} onChange={(event) => setPassingMarks(event.target.value)} required /></label>
        </div>
        <div className="mt-6 flex items-center justify-between"><h3 className="font-semibold text-ink dark:text-white">Questions</h3><button type="button" className="text-sm font-semibold text-brand-600" onClick={() => setQuestions((items) => [...items, { questionText: '', topic: '', explanation: '', options: ['', '', '', ''], correctOptionIndex: 0, marks: 1 }])}>+ Add question</button></div>
        <div className="mt-3 max-h-[460px] space-y-4 overflow-y-auto pr-1">
          {questions.map((question, index) => <div key={index} className="rounded-xl border border-slate-100 p-4 dark:border-slate-700">
            <label><span className="label dark:text-slate-300">Question {index + 1}</span><textarea className="field min-h-20" value={question.questionText} onChange={(event) => updateQuestion(index, 'questionText', event.target.value)} required /></label>
            <label className="mt-3 block"><span className="label dark:text-slate-300">Topic (for student revision insights)</span><input className="field" placeholder="e.g. Arrays, SQL joins" value={question.topic} onChange={(event) => updateQuestion(index, 'topic', event.target.value)} /></label>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">{question.options.map((option, optionIndex) => <input key={optionIndex} className="field" placeholder={`Option ${optionIndex + 1}`} value={option} onChange={(event) => updateOption(index, optionIndex, event.target.value)} required />)}</div>
            <div className="mt-3 flex flex-wrap gap-3"><label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">Correct option<select className="field w-auto" value={question.correctOptionIndex} onChange={(event) => updateQuestion(index, 'correctOptionIndex', Number(event.target.value))}>{question.options.map((option, optionIndex) => <option key={optionIndex} value={optionIndex}>{String.fromCharCode(65 + optionIndex)}</option>)}</select></label><label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">Marks<input className="field w-20" type="number" min="1" value={question.marks} onChange={(event) => updateQuestion(index, 'marks', Number(event.target.value))} /></label>{questions.length > 1 && <button type="button" className="text-sm text-rose-600" onClick={() => setQuestions((items) => items.filter((_, position) => position !== index))}>Remove</button>}</div>
            <label className="mt-3 block"><span className="label dark:text-slate-300">Answer explanation (shown after submission)</span><textarea className="field min-h-16" placeholder="Explain why this answer is correct" value={question.explanation} onChange={(event) => updateQuestion(index, 'explanation', event.target.value)} /></label>
          </div>)}
        </div>
        <button className="btn-primary mt-5 w-full" disabled={saving}>{saving ? 'Creating…' : 'Publish exam'} <ArrowRight size={16} /></button>
      </form>

      <section className="surface p-5 sm:p-6">
        <div className="mb-5 flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-lg font-bold text-ink dark:text-white">Your exams</h2><p className="text-sm text-slate-500 dark:text-slate-400">Import questions or export student results.</p></div><button className="btn-secondary !px-3 !py-2" onClick={() => exportCSV()}><Download size={15} />Export all</button></div>
        {loading ? <div className="space-y-3">{[1, 2, 3].map((item) => <div key={item} className="h-24 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />)}</div>
          : exams.length ? <div className="space-y-3">{exams.map((exam) => <article key={exam._id} className="rounded-xl border border-slate-100 p-4 dark:border-slate-700"><div className="flex items-start justify-between gap-2"><div><span className="text-xs font-semibold uppercase tracking-wide text-brand-600">{exam.subject}</span><h3 className="mt-1 font-semibold text-ink dark:text-white">{exam.title}</h3><p className="mt-1 text-xs text-slate-500">{exam.questions.length} questions · {exam.totalMarks} marks</p></div><button onClick={() => exportCSV(exam._id)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800" title="Export results"><Download size={17} /></button></div><label className="mt-3 flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 px-3 py-2 text-xs font-semibold text-slate-600 hover:border-brand-400 hover:text-brand-600 dark:border-slate-600 dark:text-slate-300"><FileUp size={15} />Import questions CSV<input type="file" accept=".csv,text/csv" className="hidden" onChange={(event) => { uploadCSV(exam._id, event.target.files?.[0]); event.target.value = ''; }} /></label></article>)}
            <div className="rounded-xl bg-blue-50 p-3 text-xs leading-5 text-blue-800 dark:bg-blue-950/50 dark:text-blue-200">CSV columns: <code>questionText, option1, option2, option3, option4, correctOptionIndex, marks, topic, explanation</code>. Answer index is zero-based, or provide the exact option text. Topic and explanation are optional.</div></div>
            : <div className="rounded-xl bg-slate-50 py-10 text-center text-sm text-slate-500 dark:bg-slate-800/60">Your created exams will appear here.</div>}
      </section>
    </div>
  </>;
}

function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [exams, setExams] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [userResponse, examResponse, analyticResponse] = await Promise.all([
        api.get('/auth/users'),
        api.get('/exams?limit=50'),
        api.get('/results/analytics')
      ]);
      setUsers(userResponse.data);
      setExams(examResponse.data.items);
      setStats(analyticResponse.data.summary);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to load admin overview');
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { refresh(); }, [refresh]);
  const toggle = async (id) => {
    try {
      await api.patch(`/auth/users/${id}/status`);
      toast.success('User status updated');
      refresh();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not update user');
    }
  };

  return <>
    <div className="mb-7"><p className="text-sm font-semibold uppercase tracking-widest text-brand-600">Administration</p><h1 className="mt-2 text-3xl font-bold text-ink dark:text-white">System overview</h1><p className="mt-1 text-slate-500 dark:text-slate-400">Manage access and monitor examination activity.</p></div>
    {loading ? <LoadingCards /> : <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard label="Total users" value={stats.totalUsers ?? users.length} note="Registered accounts" icon={Users} />
      <StatCard label="Published exams" value={stats.publishedExams ?? exams.filter((exam) => exam.isPublished).length} note="Available assessments" icon={BookOpen} tone="green" />
      <StatCard label="Exam attempts" value={stats.attempts ?? 0} note="Submitted assessments" icon={Activity} tone="violet" />
      <StatCard label="Average score" value={`${stats.average ?? 0}%`} note="Across all submissions" icon={Shield} tone="amber" />
    </div>}
    <section className="surface overflow-hidden">
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-700 sm:px-6"><div><h2 className="font-bold text-ink dark:text-white">User management</h2><p className="text-sm text-slate-500 dark:text-slate-400">Activate or suspend portal accounts.</p></div><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">{users.length} accounts</span></div>
      {loading ? <div className="space-y-3 p-6">{[1, 2, 3].map((item) => <div key={item} className="h-12 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800" />)}</div> : <div className="overflow-x-auto"><table className="w-full min-w-[650px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-slate-800/60"><tr><th className="px-6 py-3">User</th><th className="px-6 py-3">Role</th><th className="px-6 py-3">Department</th><th className="px-6 py-3">Status</th><th className="px-6 py-3 text-right">Action</th></tr></thead><tbody>{users.map((person) => <tr key={person._id} className="border-t border-slate-50 dark:border-slate-800"><td className="px-6 py-4"><b className="block text-ink dark:text-white">{person.name}</b><small className="text-slate-500">{person.email}</small></td><td className="px-6 py-4 capitalize text-slate-600 dark:text-slate-300">{person.role}</td><td className="px-6 py-4 text-slate-500">{person.department || '—'}</td><td className="px-6 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${person.isActive ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-slate-100 text-slate-500 dark:bg-slate-800'}`}>{person.isActive ? 'Active' : 'Inactive'}</span></td><td className="px-6 py-4 text-right"><button className="text-sm font-semibold text-brand-600" onClick={() => toggle(person._id)}>{person.isActive ? 'Deactivate' : 'Activate'}</button></td></tr>)}</tbody></table></div>}
    </section>
    <section className="surface mt-5 overflow-hidden">
      <div className="border-b border-slate-100 px-5 py-4 dark:border-slate-700 sm:px-6"><h2 className="font-bold text-ink dark:text-white">Exam monitoring</h2><p className="text-sm text-slate-500 dark:text-slate-400">Recently published assessments.</p></div>
      {exams.length ? <div className="divide-y divide-slate-100 dark:divide-slate-800">{exams.map((exam) => <div key={exam._id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 sm:px-6"><div><b className="text-ink dark:text-white">{exam.title}</b><p className="text-sm text-slate-500">{exam.subject} · {exam.questions.length} questions · {exam.createdBy?.name || 'Faculty'}</p></div><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${exam.isPublished ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-slate-100 text-slate-500'}`}>{exam.isPublished ? 'Published' : 'Draft'}</span></div>)}</div> : <p className="p-6 text-sm text-slate-500">No exams have been created.</p>}
    </section>
  </>;
}

export default function Dashboard() {
  const { user } = useAuth();
  return <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
    {user.role === 'student' && <StudentDashboard />}
    {user.role === 'faculty' && <FacultyDashboard />}
    {user.role === 'admin' && <AdminDashboard />}
  </main>;
}

