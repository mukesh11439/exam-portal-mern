import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Clock3, Flag, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';
import QuestionPalette from '../components/QuestionPalette';

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  return `${String(minutes).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
}

export default function TakeExam() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [exam, setExam] = useState(null);
  const [answers, setAnswers] = useState({});
  const [current, setCurrent] = useState(0);
  const [remaining, setRemaining] = useState(0);
  const [startedAt] = useState(Date.now());
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.get(`/exams/${id}`)
      .then(({ data }) => { setExam(data); setRemaining(data.durationMinutes * 60); })
      .catch((error) => { toast.error(error.response?.data?.message || 'Unable to load exam'); navigate('/'); });
  }, [id, navigate]);

  const submit = useCallback(async (automatic = false) => {
    if (!exam || submitting) return;
    setSubmitting(true);
    try {
      const payload = {
        answers: Object.entries(answers).map(([questionId, selectedOptionIndex]) => ({ questionId, selectedOptionIndex })),
        timeTakenSeconds: Math.floor((Date.now() - startedAt) / 1000)
      };
      const { data } = await api.post(`/exams/${id}/submit`, payload);
      toast.success(automatic ? 'Time is up. Your exam has been submitted.' : 'Exam submitted successfully.');
      navigate('/', { state: { latestResult: data } });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not submit the exam');
      setSubmitting(false);
    }
  }, [exam, submitting, answers, startedAt, id, navigate]);

  useEffect(() => {
    if (!exam || submitting) return undefined;
    if (remaining <= 0) {
      submit(true);
      return undefined;
    }
    const timer = window.setTimeout(() => setRemaining((value) => value - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [exam, remaining, submitting, submit]);

  const question = useMemo(() => exam?.questions[current], [exam, current]);
  if (!exam || !question) return <main className="mx-auto max-w-6xl p-6"><div className="h-20 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800" /></main>;

  return (
    <main className="mx-auto max-w-6xl px-4 py-7 sm:px-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div><button onClick={() => navigate('/')} className="mb-2 flex items-center gap-1 text-sm text-slate-500 hover:text-brand-600"><ArrowLeft size={15} /> Exit exam</button><h1 className="text-2xl font-bold text-ink dark:text-white">{exam.title}</h1><p className="text-sm text-slate-500 dark:text-slate-400">{exam.subject} · {exam.questions.length} questions</p></div>
        <div className={`flex items-center gap-2 rounded-xl px-4 py-3 font-mono text-lg font-bold ${remaining <= 60 ? 'bg-rose-50 text-rose-600 dark:bg-rose-950' : 'surface text-ink dark:text-white'}`}><Clock3 size={19} />{formatTime(remaining)}</div>
      </div>
      <div className="grid gap-5 lg:grid-cols-[1fr_280px]">
        <section className="surface p-5 sm:p-8">
          <div className="mb-7 flex items-center justify-between"><span className="rounded-lg bg-brand-50 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-brand-700 dark:bg-brand-900/40 dark:text-blue-200">Question {current + 1} of {exam.questions.length}</span><span className="text-sm text-slate-500">{question.marks} {question.marks === 1 ? 'mark' : 'marks'}</span></div>
          <h2 className="mb-7 text-xl font-semibold leading-relaxed text-ink dark:text-white">{question.questionText}</h2>
          <div className="space-y-3">
            {question.options.map((option, index) => <button key={`${question._id}-${index}`} onClick={() => setAnswers((prev) => ({ ...prev, [question._id]: index }))} className={`flex w-full items-center gap-3 rounded-xl border p-4 text-left transition ${answers[question._id] === index ? 'border-brand-500 bg-brand-50 text-brand-700 ring-1 ring-brand-500 dark:bg-brand-900/30 dark:text-blue-100' : 'border-slate-200 text-slate-700 hover:border-brand-300 dark:border-slate-700 dark:text-slate-200'}`}><span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full border text-xs font-bold ${answers[question._id] === index ? 'border-brand-600 bg-brand-600 text-white' : 'border-slate-300 text-slate-500 dark:border-slate-600'}`}>{String.fromCharCode(65 + index)}</span>{option}</button>)}
          </div>
          <div className="mt-9 flex items-center justify-between border-t border-slate-100 pt-5 dark:border-slate-700">
            <button className="btn-secondary" disabled={current === 0} onClick={() => setCurrent((index) => index - 1)}><ArrowLeft size={16} /> Previous</button>
            {current < exam.questions.length - 1
              ? <button className="btn-primary" onClick={() => setCurrent((index) => index + 1)}>Next <ArrowRight size={16} /></button>
              : <button className="btn-primary bg-emerald-600 hover:bg-emerald-700" onClick={() => submit(false)} disabled={submitting}><Send size={16} />{submitting ? 'Submitting…' : 'Submit exam'}</button>}
          </div>
        </section>
        <aside className="space-y-5">
          <QuestionPalette questions={exam.questions} answers={answers} currentIndex={current} onSelect={setCurrent} />
          <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200"><Flag size={16} className="mb-2" /><p>Review your answers before submitting. The exam will be submitted automatically when the timer ends.</p></div>
        </aside>
      </div>
    </main>
  );
}

