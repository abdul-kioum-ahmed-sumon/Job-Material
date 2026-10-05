import { Link } from 'react-router-dom';
import { FileText, Shield } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-gray-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Privacy Note Banner */}
        <div className="mb-6 p-3.5 rounded-xl bg-brand-50/60 dark:bg-slate-800/60 border border-brand-100 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-600 dark:text-slate-300 text-center sm:text-left">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-brand-500 shrink-0" />
            <span>
              <strong>Privacy First:</strong> Your uploaded images are processed locally whenever possible. Temporary server files, when required, are deleted immediately after processing.
            </span>
          </div>
          <span className="text-brand-600 dark:text-brand-400 font-medium whitespace-nowrap">
            ফেসবুক পোস্ট থেকে পরিষ্কার PDF
          </span>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-500 dark:text-slate-400">
          {/* Logo & Copyright */}
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-brand-600 flex items-center justify-center text-white">
              <FileText className="w-3.5 h-3.5" />
            </div>
            <span className="font-semibold text-gray-700 dark:text-slate-200">Post2PDF</span>
            <span>&copy; {new Date().getFullYear()}</span>
            <span className="hidden sm:inline">&middot; Built for job & exam preparation</span>
          </div>

          {/* Nav links */}
          <div className="flex items-center gap-6 text-sm">
            <Link to="/" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">
              Home
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
              className="inline-flex items-center gap-1.5 hover:text-gray-900 dark:hover:text-white transition-colors"
              aria-label="GitHub Repository"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
              </svg>
              <span>GitHub</span>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

