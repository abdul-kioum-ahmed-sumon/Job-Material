import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import HistoryPage from './pages/HistoryPage';
import AboutPage from './pages/AboutPage';
import { useTheme } from './hooks/useTheme';

export default function App() {
  const { theme, setTheme } = useTheme();

  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#0b101b] text-slate-900 dark:text-slate-100 transition-colors duration-300 relative overflow-x-hidden selection:bg-brand-500 selection:text-white">
        {/* Background ambient glow effects */}
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
          <div className="ambient-glow -top-32 left-1/2 -translate-x-1/2 w-[700px] h-[380px] bg-gradient-to-r from-brand-500/15 via-purple-500/10 to-indigo-500/10 dark:from-brand-600/20 dark:via-purple-600/15 dark:to-cyan-600/10" />
          <div className="ambient-glow top-[45%] -right-48 w-[450px] h-[450px] bg-indigo-500/10 dark:bg-brand-500/10" />
          <div className="ambient-glow bottom-0 -left-48 w-[450px] h-[450px] bg-purple-500/10 dark:bg-purple-600/10" />
        </div>

        <Header theme={theme} setTheme={setTheme} />
        <main className="flex-1 relative z-10">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/app" element={<Navigate to="/" replace />} />
            <Route path="/history" element={<HistoryPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  );
}
