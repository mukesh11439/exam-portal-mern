import { BookOpenCheck, LogOut, Moon, Sun, Trophy } from 'lucide-react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const signOut = () => {
    logout();
    navigate('/login');
  };

  return (
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
          <button onClick={toggleTheme} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800" aria-label="Toggle theme">
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button onClick={signOut} className="flex items-center gap-2 rounded-lg px-2 py-2 text-sm font-medium text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800" aria-label="Sign out"><LogOut size={17} /><span className="hidden sm:inline">Sign out</span></button>
        </nav>
      </div>
    </header>
  );
}

