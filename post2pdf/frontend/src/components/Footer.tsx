import { Link } from 'react-router-dom';
import { FileText, Shield, Heart, Sparkles, Code2, ExternalLink } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-slate-200 dark:border-slate-800/80 bg-white/70 dark:bg-[#0b101b]/80 backdrop-blur-xl transition-colors duration-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 space-y-8">
        {/* Privacy Note Banner */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-brand-50/70 via-indigo-50/50 to-purple-50/60 dark:from-brand-950/30 dark:via-slate-900/60 dark:to-purple-950/30 border border-brand-100/80 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600 dark:text-slate-300 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-brand-500/10 dark:bg-brand-500/20 text-brand-600 dark:text-brand-400 flex items-center justify-center shrink-0">
              <Shield className="w-4 h-4" />
            </div>
            <span>
              <strong className="text-slate-900 dark:text-white font-semibold">Privacy First Guarantee:</strong> Images are processed locally inside your browser. No personal data, tracking cookies, or Facebook credentials are ever stored.
            </span>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-100/70 dark:bg-brand-900/40 text-brand-700 dark:text-brand-300 font-medium whitespace-nowrap text-[11px]">
            <Sparkles className="w-3 h-3 text-brand-500" />
            ফেসবুক পোস্ট থেকে পরিষ্কার PDF
          </span>
        </div>

        {/* 3-Column Footer Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-2">
          {/* Column 1: Brand & Purpose */}
          <div className="space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-600 flex items-center justify-center text-white shadow-sm shadow-brand-500/30">
                <FileText className="w-4 h-4" />
              </div>
              <span className="font-extrabold text-lg text-slate-900 dark:text-white">Post2PDF</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              A high-performance educational utility created to transform multi-photo Facebook study materials, notes, and exam solutions into beautifully formatted, printable PDFs.
            </p>
          </div>

          {/* Column 2: Developer Spotlight Card */}
          <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 flex items-center gap-4 transition-all hover:border-brand-300 dark:hover:border-brand-700/60 shadow-xs">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-500 via-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold text-base shadow-md shadow-brand-500/20 shrink-0">
              AS
            </div>
            <div className="space-y-0.5 min-w-0">
              <div className="flex items-center gap-1.5">
                <Code2 className="w-3.5 h-3.5 text-brand-500" />
                <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  Lead Developer
                </span>
              </div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                A.K.A.SUMON
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                Software Engineer • Architect
              </p>
            </div>
          </div>

          {/* Column 3: Links */}
          <div className="space-y-3 md:text-right">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Quick Navigation
            </h4>
            <div className="flex flex-wrap md:justify-end gap-x-5 gap-y-2 text-xs font-medium text-slate-600 dark:text-slate-400">
              <Link to="/" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">
                Studio
              </Link>
              <Link to="/history" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">
                My PDFs
              </Link>
              <Link to="/about" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">
                About & Privacy
              </Link>
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 hover:text-slate-900 dark:hover:text-white transition-colors"
                aria-label="GitHub Repository"
              >
                <span>GitHub</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Copyright Strip */}
        <div className="pt-6 border-t border-slate-200/60 dark:border-slate-800/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400 text-center sm:text-left">
          <p>
            &copy; 2026 <strong className="text-slate-700 dark:text-slate-300 font-semibold">Post2PDF</strong>. All rights reserved.
          </p>
          <p className="inline-flex items-center gap-1.5">
            <span>Designed & Engineered with</span>
            <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
            <span>by <strong className="text-slate-800 dark:text-slate-200 font-bold">A.K.A.SUMON</strong></span>
          </p>
        </div>
      </div>
    </footer>
  );
}
