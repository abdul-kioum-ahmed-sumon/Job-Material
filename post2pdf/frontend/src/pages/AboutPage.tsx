import {
  Shield,
  Lock,
  FileText,
  CheckCircle2,
  AlertTriangle,
  BookOpen,
  Sparkles,
  RefreshCw,
  Cpu,
  Download,
  Terminal,
  Award,
  Check,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-12 animate-slide-up">
      {/* Hero */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-brand-50 to-purple-50 dark:from-brand-950/40 dark:to-purple-950/40 text-brand-700 dark:text-brand-300 text-xs font-bold border border-brand-200/80 dark:border-brand-800/80 shadow-xs">
          <Sparkles className="w-3.5 h-3.5 text-brand-500" />
          About & Engineering Philosophy
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Why Post2PDF Was Built
        </h1>
        <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
          A dedicated educational productivity tool engineered to turn messy, multi-image social media study galleries into clean, portable, and revision-ready PDF documents.
        </p>
      </div>

      {/* Developer Spotlight Section */}
      <div id="developer" className="card p-6 sm:p-10 border-2 border-brand-200/80 dark:border-brand-800/60 bg-gradient-to-br from-white via-brand-50/30 to-purple-50/20 dark:from-slate-900 dark:via-brand-950/20 dark:to-purple-950/10 shadow-xl shadow-brand-500/5 relative overflow-hidden">
        {/* Decorative corner glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-brand-500/10 to-purple-500/10 blur-3xl pointer-events-none" />

        <div className="relative space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-200/70 dark:border-slate-800">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-brand-600 via-indigo-600 to-purple-600 flex items-center justify-center text-white text-2xl font-black shadow-lg shadow-brand-500/30">
                  AS
                </div>
                <div className="absolute -bottom-1 -right-1 p-1 rounded-full bg-emerald-500 text-white ring-2 ring-white dark:ring-slate-900" title="Active Developer">
                  <Check className="w-3 h-3" />
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">
                    A.K.A.SUMON
                  </h2>
                  <span className="badge-brand">
                    Creator
                  </span>
                </div>
                <p className="text-xs sm:text-sm font-medium text-brand-600 dark:text-brand-400 mt-0.5">
                  Lead Software Engineer & System Architect
                </p>
              </div>
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300">
              <Terminal className="w-3.5 h-3.5 text-brand-500" />
              <span>Full-Stack Development</span>
            </div>
          </div>

          <div className="space-y-4 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            <p>
              <strong className="text-slate-900 dark:text-white font-semibold">The Mission:</strong> Post2PDF was conceived and engineered by <strong>A.K.A.SUMON</strong> to address a persistent obstacle encountered daily by students and competitive exam aspirants across Bangladesh and South Asia. Crucial job notes, previous exam questions, and handwritten lecture summaries are commonly shared on Facebook as long image posts. Reviewing them on social media causes eye strain, data consumption, and digital distractions.
            </p>
            <p>
              By crafting a zero-compromise, browser-first conversion utility, <strong>A.K.A.SUMON</strong> designed Post2PDF to eliminate friction — giving students the ability to organize, rotate, and combine these images into high-resolution, printable A4 PDF study sheets in just seconds, with zero cost and complete user privacy.
            </p>
          </div>

          {/* Architectural Pillars */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div className="p-3.5 rounded-xl bg-white/80 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-white">
                <Lock className="w-3.5 h-3.5 text-brand-500" />
                Zero-Tracking Architecture
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Engineered to run client-side. No cookies, no logins, and zero telemetry tracking.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-white/80 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-white">
                <Cpu className="w-3.5 h-3.5 text-brand-500" />
                In-Browser Processing
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                HTML5 Canvas & jsPDF engine compiles high-DPI documents directly on your device.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-white/80 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-white">
                <Award className="w-3.5 h-3.5 text-brand-500" />
                Study-Optimized Print
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Custom layouts, margin presets, and 300 DPI sharpness for crisp reading and printing.
              </p>
            </div>
          </div>

          {/* Tech Stack Pills */}
          <div className="pt-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-2">
              Technology Stack
            </span>
            <div className="flex flex-wrap gap-1.5 text-xs">
              {['React 19', 'TypeScript', 'Tailwind CSS v4', 'Vite', 'Python & FastAPI', 'ReportLab', 'HTML5 Canvas', 'IndexedDB'].map((tech) => (
                <span key={tech} className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-mono text-[11px]">
                  {tech}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bangla Study Context */}
      <div className="card p-6 sm:p-8 border border-brand-100 dark:border-slate-800 bg-white/95 dark:bg-slate-900/90 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-brand-500/20">
            <BookOpen className="w-6 h-6" />
          </div>
          <div className="space-y-3">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              চাকরি ও পরীক্ষার প্রস্তুতি (Study & Exam Preparation in Bangladesh)
            </h2>
            <p className="text-slate-600 dark:text-slate-300 text-sm sm:text-base leading-relaxed">
              In Bangladesh, valuable job preparation materials (BCS, Bank, Primary Teacher, University Admission, and SSC/HSC exam notes) are frequently posted in Facebook groups as galleries of 5 to 40+ handwritten sheets or screenshots. Reading them directly on Facebook is distracting, messy, and hard to revise offline.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
                <span className="font-bold text-brand-600 dark:text-brand-400 text-xs sm:text-sm">১. ফেসবুক পোস্টের লিংক দিন</span>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">পাবলিক পোস্টের লিংক দিয়ে সরাসরি ইমেজ আনা যায়</p>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
                <span className="font-bold text-brand-600 dark:text-brand-400 text-xs sm:text-sm">২. ছবিগুলো সাজান</span>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">ড্র্যাগ করে ক্রম ঠিক করুন এবং ৯০° রোটেট করুন</p>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
                <span className="font-bold text-brand-600 dark:text-brand-400 text-xs sm:text-sm">৩. PDF তৈরি করুন</span>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">A4 পেজে পরিষ্কার রেজোলিউশনে সেট করুন</p>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
                <span className="font-bold text-brand-600 dark:text-brand-400 text-xs sm:text-sm">৪. PDF ডাউনলোড করুন</span>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">অফলাইনে পড়ার জন্য সরাসরি ডিভাইসে সংরক্ষণ করুন</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Facebook Reality & Transparency */}
      <div className="card p-6 sm:p-8 space-y-4 border border-amber-200 dark:border-amber-900/60 bg-amber-50/40 dark:bg-amber-950/15">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
            The Facebook Reality: How Import Works
          </h2>
        </div>
        <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
          Post2PDF respects security policies. We do <strong>not</strong> bypass authentication, hack private posts, crack CAPTCHAs, or run stealth bots.
        </p>
        <div className="space-y-2.5 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
            <span><strong>When automatic import works:</strong> Publicly accessible Facebook posts where Open Graph metadata or public CDN image tags are served without requiring an authenticated session.</span>
          </div>
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
            <span><strong>When Facebook blocks access:</strong> Facebook frequently restricts automated requests to posts in closed groups, posts marked with audience limits, or when anti-bot heuristics trigger a login wall.</span>
          </div>
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-brand-500 shrink-0 mt-0.5" />
            <span><strong>The 100% Reliable Manual Fallback:</strong> You can always save or screenshot the images and upload them directly via drag-and-drop. The manual upload workflow does not depend on Facebook at all and processes completely on your machine.</span>
          </div>
        </div>
      </div>

      {/* Privacy Guarantees */}
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Shield className="w-6 h-6 text-brand-500" />
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            Privacy First Architecture
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="card p-5 space-y-2 border border-slate-200/80 dark:border-slate-800">
            <div className="flex items-center gap-2 text-slate-900 dark:text-white font-semibold text-sm">
              <Lock className="w-4 h-4 text-brand-500" />
              No Credentials Ever
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Post2PDF never asks for your Facebook username, password, token, or cookies. Your account security is never at risk.
            </p>
          </div>

          <div className="card p-5 space-y-2 border border-slate-200/80 dark:border-slate-800">
            <div className="flex items-center gap-2 text-slate-900 dark:text-white font-semibold text-sm">
              <Cpu className="w-4 h-4 text-brand-500" />
              Client-Side Processing
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              When you upload images manually, the PDF is generated right in your browser using JavaScript and HTML5 canvas. Your files never leave your computer.
            </p>
          </div>

          <div className="card p-5 space-y-2 border border-slate-200/80 dark:border-slate-800">
            <div className="flex items-center gap-2 text-slate-900 dark:text-white font-semibold text-sm">
              <RefreshCw className="w-4 h-4 text-brand-500" />
              Zero Server Storage
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              For remote Facebook image imports requiring server rendering, images are loaded strictly in temporary RAM and destroyed immediately upon PDF delivery.
            </p>
          </div>

          <div className="card p-5 space-y-2 border border-slate-200/80 dark:border-slate-800">
            <div className="flex items-center gap-2 text-slate-900 dark:text-white font-semibold text-sm">
              <FileText className="w-4 h-4 text-brand-500" />
              Local IndexedDB History
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Your generated PDF history and downloads are stored locally inside your browser's IndexedDB storage. No user accounts or centralized database required.
            </p>
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="text-center pt-4 pb-8">
        <Link to="/" className="btn-primary btn-lg inline-flex items-center gap-2 shadow-xl shadow-brand-500/25">
          <Download className="w-5 h-5" />
          <span>Launch Studio & Start Converting</span>
        </Link>
      </div>
    </div>
  );
}
