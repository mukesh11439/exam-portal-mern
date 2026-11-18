import { useState } from 'react';
import { ArrowRight, BookOpenCheck, GraduationCap, ShieldCheck, Users } from 'lucide-react';
import { Navigate, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const demos = [
  { role: 'Admin', email: 'admin@college.edu', icon: ShieldCheck },
  { role: 'Faculty', email: 'faculty@college.edu', icon: Users },
  { role: 'Student', email: 'student@college.edu', icon: GraduationCap }
];

export default function Login() {
  const { user, login, register, loading } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [isRegister, setIsRegister] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', department: '' });
  if (user) return <Navigate to="/" replace />;

  const change = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  const submit = async (event) => {
    event.preventDefault();
    try {
      await (isRegister ? register(form) : login({ email: form.email, password: form.password }));
      toast.success(isRegister ? 'Account created. Welcome!' : 'Welcome back!');
      navigate('/');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to sign in. Please try again.');
    }
  };
  const useDemo = (email) => setForm({ name: '', email, password: 'password123', department: '' });

  return (
    <main className="grid min-h-screen bg-slate-50 dark:bg-slate-950 lg:grid-cols-[1.05fr_.95fr]">
      <section className="relative hidden overflow-hidden bg-[#172c4e] p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="absolute -right-36 -top-20 h-96 w-96 rounded-full border-[56px] border-white/5" />
        <div className="absolute -bottom-48 -left-20 h-[30rem] w-[30rem] rounded-full border-[70px] border-white/5" />
        <div className="relative flex items-center gap-3 text-lg font-bold"><span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-500"><BookOpenCheck /></span> Examly</div>
        <div className="relative max-w-xl">
          <p className="mb-4 text-sm font-semibold uppercase tracking-[.2em] text-blue-200">Exams, made clearer</p>
          <h1 className="text-5xl font-bold leading-tight">A smarter way to measure what you know.</h1>
          <p className="mt-5 max-w-lg text-lg leading-8 text-blue-100/80">Take assessments, track your progress, and turn every result into a next step.</p>
          <div className="mt-10 flex gap-8 text-sm text-blue-100/80"><span>Secure assessments</span><span>Instant results</span><span>Live rankings</span></div>
        </div>
        <p className="relative text-sm text-blue-100/50">Online Examination &amp; Result Management</p>
      </section>
      <section className="flex items-center justify-center px-5 py-10 sm:px-10">
        <div className="w-full max-w-md">
          <div className="mb-10 flex items-center justify-between lg:hidden">
            <span className="flex items-center gap-2 font-bold text-ink dark:text-white"><BookOpenCheck className="text-brand-600" /> Examly</span>
            <button onClick={toggleTheme} className="text-sm text-slate-500">{theme === 'dark' ? 'Light mode' : 'Dark mode'}</button>
          </div>
          <p className="text-sm font-semibold uppercase tracking-widest text-brand-600">{isRegister ? 'Get started' : 'Welcome back'}</p>
          <h2 className="mt-2 text-3xl font-bold text-ink dark:text-white">{isRegister ? 'Create your account' : 'Sign in to Examly'}</h2>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{isRegister ? 'Student accounts are ready in seconds.' : 'Enter your credentials to continue.'}</p>

          <form onSubmit={submit} className="mt-7 space-y-4">
            {isRegister && <>
              <label className="block"><span className="label dark:text-slate-300">Full name</span><input className="field" name="name" value={form.name} onChange={change} autoComplete="name" required /></label>
              <label className="block"><span className="label dark:text-slate-300">Department</span><input className="field" name="department" value={form.department} onChange={change} placeholder="e.g. Computer Science" /></label>
            </>}
            <label className="block"><span className="label dark:text-slate-300">Email address</span><input className="field" type="email" name="email" value={form.email} onChange={change} autoComplete="email" required /></label>
            <label className="block"><span className="label dark:text-slate-300">Password</span><input className="field" type="password" name="password" value={form.password} onChange={change} autoComplete={isRegister ? 'new-password' : 'current-password'} minLength={8} required /></label>
            <button className="btn-primary w-full !py-3" disabled={loading}>{loading ? 'Please wait…' : isRegister ? 'Create account' : 'Sign in'} <ArrowRight size={17} /></button>
          </form>

          {!isRegister && <div className="mt-7">
            <div className="mb-3 flex items-center gap-3 text-xs font-medium uppercase tracking-wide text-slate-400"><span className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />Quick demo access<span className="h-px flex-1 bg-slate-200 dark:bg-slate-700" /></div>
            <div className="grid grid-cols-3 gap-2">
              {demos.map(({ role, email, icon: Icon }) => <button key={role} onClick={() => useDemo(email)} className="flex flex-col items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2 py-3 text-xs font-semibold text-slate-600 hover:border-brand-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"><Icon size={17} className="text-brand-600" />{role}</button>)}
            </div>
            <p className="mt-2 text-center text-xs text-slate-400">Demo password: password123 — seed the backend first.</p>
          </div>}
          <p className="mt-7 text-center text-sm text-slate-500 dark:text-slate-400">
            {isRegister ? 'Already have an account?' : 'New to Examly?'}{' '}
            <button onClick={() => setIsRegister((current) => !current)} className="font-semibold text-brand-600 hover:text-brand-700">{isRegister ? 'Sign in' : 'Create a student account'}</button>
          </p>
        </div>
      </section>
    </main>
  );
}

