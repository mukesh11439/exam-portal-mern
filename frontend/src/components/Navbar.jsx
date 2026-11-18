import { useState } from 'react';
import { BookOpenCheck, KeyRound, LogOut, Moon, Sun, Trophy, X } from 'lucide-react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import api from '../services/api';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [passwordDialog, setPasswordDialog] = useState(false);
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [savingPassword, setSavingPassword] = useState(false);

  const signOut = () => {
    logout();
    navigate('/login');
  };

  const changePassword = async (event) => {
    event.preventDefault();
    if (passwords.newPassword !== passwords.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    setSavingPassword(true);
    try {
      const { data } = await api.patch('/auth/change-password', {
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword
      });
      toast.success(data.message);
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setPasswordDialog(false);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to update password');
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-slate-100 bg-white/90 backdrop-blur dark:border-slate-800 dark:bg-slate-900/90">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2.5 font-bold tracking-tight text-ink dark:text-white">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-600 text-white"><BookOpenCheck size={19} /></span>
            Examly
          </Link>
          <nav className="flex items-center gap-2 sm:gap-5">
            <NavLink to="/" className="hidden text-sm font-medium text-slate-600 hover:text-brand-600 dark:text-slate-300 sm:block">Dashboard</NavLink>
            <NavLink to="/leaderboard" className="flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-brand-600 dark:text-slate-300"><Trophy size={16} /> <span className="hidden sm:inline">Leaderboard</span></NavLink>
            <span className="hidden h-8 w-px bg-slate-200 dark:bg-slate-700 sm:block" />
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold text-ink dark:text-white">{user?.name}</p>
              <p className="text-xs capitalize text-slate-500 dark:text-slate-400">{user?.role}</p>
            </div>
            <button onClick={() => setPasswordDialog(true)} className="flex items-center gap-2 rounded-lg px-2 py-2 text-sm font-medium text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800" aria-label="Change password" title="Change password">
              <KeyRound size={17} /><span className="hidden sm:inline">Password</span>
            </button>
            <button onClick={toggleTheme} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800" aria-label="Toggle theme">
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button onClick={signOut} className="flex items-center gap-2 rounded-lg px-2 py-2 text-sm font-medium text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800" aria-label="Sign out"><LogOut size={17} /><span className="hidden sm:inline">Sign out</span></button>
          </nav>
        </div>
      </header>
      {passwordDialog && <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/50 p-4" onMouseDown={(event) => {
        if (event.target === event.currentTarget) setPasswordDialog(false);
      }}>
        <section role="dialog" aria-modal="true" aria-labelledby="change-password-title" className="surface w-full max-w-md p-6">
          <div className="mb-5 flex items-center justify-between">
            <div><h2 id="change-password-title" className="text-xl font-bold text-ink dark:text-white">Change password</h2><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Choose a new password for your account.</p></div>
            <button type="button" onClick={() => setPasswordDialog(false)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800" aria-label="Close"><X size={18} /></button>
          </div>
          <form onSubmit={changePassword} className="space-y-4">
            <label className="block"><span className="label dark:text-slate-300">Current password</span><input className="field" type="password" autoComplete="current-password" value={passwords.currentPassword} onChange={(event) => setPasswords((current) => ({ ...current, currentPassword: event.target.value }))} required /></label>
            <label className="block"><span className="label dark:text-slate-300">New password</span><input className="field" type="password" autoComplete="new-password" minLength={8} value={passwords.newPassword} onChange={(event) => setPasswords((current) => ({ ...current, newPassword: event.target.value }))} required /><span className="mt-1 block text-xs text-slate-400">At least 8 characters</span></label>
            <label className="block"><span className="label dark:text-slate-300">Confirm new password</span><input className="field" type="password" autoComplete="new-password" minLength={8} value={passwords.confirmPassword} onChange={(event) => setPasswords((current) => ({ ...current, confirmPassword: event.target.value }))} required /></label>
            <button className="btn-primary w-full" disabled={savingPassword}>{savingPassword ? 'Updating…' : 'Update password'}</button>
          </form>
        </section>
      </div>}
    </>
  );
}

