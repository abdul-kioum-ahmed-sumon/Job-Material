import { Link, useLocation } from 'react-router-dom';
import { FileText, Sun, Moon, Monitor, Menu, X, Home, History, Shield, Code2, Sparkles } from 'lucide-react';
import { useState } from 'react';
import type { Theme } from '../types';

interface HeaderProps {
  theme: Theme;
  setTheme: (t: Theme) => void;
}

export default function Header({ theme, setTheme }: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  const navLinks = [
    { to: '/', label: 'Studio', icon: Home },
    { to: '/history', label: 'My PDFs', icon: History },
    { to: '/about', label: 'About & Privacy', icon: Shield },
  ];

  const themeIcon = theme === 'dark' ? Moon : theme === 'light' ? Sun : Monitor;
  const nextTheme: Theme = theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light';
  const themeLabel = theme === 'light' ? 'Light' : theme === 'dark' ? 'Dark' : 'System';

  return (
    <header className="sticky top-0 z-40 backdrop-blur-xl bg-white/80 dark:bg-[#0b101b]/80 border-b border-slate-200/80 dark:border-slate-800/80 transition-colors duration-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Dev Badge */}
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="flex items-center gap-2.5 group"
              aria-label="Post2PDF Home"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 via-indigo-600 to-purple-600 flex items-center justify-center shadow-md shadow-brand-500/25 group-hover:shadow-brand-500/40 group-hover:scale-105 transition-all duration-300">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-brand-600 via-indigo-600 to-purple-600 dark:from-brand-400 dark:via-indigo-300 dark:to-purple-400 bg-clip-text text-transparent">
                  Post2PDF
                </span>
                <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 dark:text-slate-500 -mt-1 hidden sm:block">
                  Pro Converter
                </span>
              </div>
            </Link>

            {/* Developer pill */}
            <Link
              to="/about"
              className="badge-dev hidden sm:inline-flex items-center group/dev ml-1"
              title="Engineered by A.K.A.SUMON"
            >
              <Code2 className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400 group-hover/dev:scale-110 transition-transform" />
              <span className="text-xs">
                Dev: <span className="font-bold text-brand-700 dark:text-brand-300">A.K.A.SUMON</span>
              </span>
            </Link>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1.5 p-1 rounded-2xl bg-slate-100/80 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700/50" aria-label="Main navigation">
            {navLinks.map(({ to, label, icon: Icon }) => {
              const active = location.pathname === to;
              return (
                <Link
                  key={to}
                  to={to}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200
                    ${active
                      ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-xs shadow-black/5'
                      : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
                    }`}
                  aria-current={active ? 'page' : undefined}
                >
                  <Icon className={`w-3.5 h-3.5 ${active ? 'text-brand-600 dark:text-brand-400' : 'text-slate-400'}`} />
                  {label}
                </Link>
              );
            })}
          </nav>

          {/* Right side Actions */}
          <div className="flex items-center gap-2">
            {/* Theme toggle */}
            <button
              onClick={() => setTheme(nextTheme)}
              className="p-2 rounded-xl text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white bg-slate-100/80 dark:bg-slate-800/80 hover:bg-slate-200/70 dark:hover:bg-slate-700/80 border border-slate-200/60 dark:border-slate-700/60 transition-all duration-200"
              aria-label={`Switch to ${nextTheme} theme (current: ${themeLabel})`}
              title={`Theme: ${themeLabel}`}
            >
              {(() => {
                const ThemeIcon = themeIcon;
                return <ThemeIcon className="w-4 h-4 transition-transform hover:rotate-12" />;
              })()}
            </button>

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-2 rounded-xl text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 md:hidden transition-all duration-200"
              aria-label="Toggle menu"
              aria-expanded={menuOpen}
            >
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Nav */}
      {menuOpen && (
        <nav
          className="md:hidden border-t border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-[#0b101b]/95 backdrop-blur-xl animate-fade-in"
          aria-label="Mobile navigation"
        >
          <div className="px-4 py-3 space-y-1">
            {navLinks.map(({ to, label, icon: Icon }) => {
              const active = location.pathname === to;
              return (
                <Link
                  key={to}
                  to={to}
                  onClick={() => setMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all
                    ${active
                      ? 'bg-brand-50 text-brand-600 dark:bg-brand-900/30 dark:text-brand-300 font-semibold'
                      : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800/70'
                    }`}
                  aria-current={active ? 'page' : undefined}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </Link>
              );
            })}

            {/* Mobile dev credit */}
            <div className="pt-2 mt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between px-2 text-xs text-slate-500">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-brand-500" />
                Developer
              </span>
              <span className="font-bold text-brand-600 dark:text-brand-400">A.K.A.SUMON</span>
            </div>
          </div>
        </nav>
      )}
    </header>
  );
}
