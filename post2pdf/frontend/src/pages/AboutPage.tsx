import { Shield, Lock, FileText, CheckCircle2, AlertTriangle, BookOpen, Sparkles, RefreshCw, Cpu, Download } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-12 animate-slide-up">
      {/* Hero */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-300 text-sm font-semibold border border-brand-200 dark:border-brand-800">
          <Sparkles className="w-4 h-4" />
          About & Privacy Guide
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white">
          Why Post2PDF Was Built
        </h1>
        <p className="text-lg text-gray-600 dark:text-slate-300 max-w-2xl mx-auto">
          A dedicated study tool designed to turn multi-image educational posts into clean, portable, and readable PDF study sheets.
        </p>
      </div>

      {/* Bangla Study Context */}
      <div className="card p-6 sm:p-8 bg-gradient-to-br from-brand-50/60 to-purple-50/40 dark:from-slate-800/80 dark:to-brand-950/20 border-brand-100 dark:border-slate-700">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-brand-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-brand-500/20">
            <BookOpen className="w-6 h-6" />
          </div>
          <div className="space-y-3">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              চাকরি ও পরীক্ষার প্রস্তুতি (Study & Exam Preparation)
            </h2>
            <p className="text-gray-600 dark:text-slate-300 text-sm sm:text-base leading-relaxed">
              In Bangladesh and South Asia, valuable job preparation materials (BCS, Bank, Primary Teacher, University Admission, and SSC/HSC exam notes) are frequently posted on Facebook groups and pages as galleries of 5 to 40+ handwritten sheets or screenshots. Reading them directly on Facebook is distracting, messy, and hard to revise offline.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="p-3 rounded-lg bg-white/80 dark:bg-slate-700/60 border border-gray-100 dark:border-slate-600">
                <span className="font-semibold text-brand-600 dark:text-brand-400 text-sm">১. ফেসবুক পোস্টের লিংক দিন</span>
                <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">পাবলিক পোস্টের লিংক দিয়ে সরাসরি ইমেজ আনা যায়</p>
              </div>
              <div className="p-3 rounded-lg bg-white/80 dark:bg-slate-700/60 border border-gray-100 dark:border-slate-600">
                <span className="font-semibold text-brand-600 dark:text-brand-400 text-sm">২. ছবিগুলো সাজান</span>
                <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">ড্র্যাগ করে ক্রম ঠিক করুন এবং ৯০° রোটেট করুন</p>
              </div>
              <div className="p-3 rounded-lg bg-white/80 dark:bg-slate-700/60 border border-gray-100 dark:border-slate-600">
                <span className="font-semibold text-brand-600 dark:text-brand-400 text-sm">৩. PDF তৈরি করুন</span>
                <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">A4 পেজে পরিষ্কার রেজোলিউশনে সেট করুন</p>
              </div>
              <div className="p-3 rounded-lg bg-white/80 dark:bg-slate-700/60 border border-gray-100 dark:border-slate-600">
                <span className="font-semibold text-brand-600 dark:text-brand-400 text-sm">৪. PDF ডাউনলোড করুন</span>
                <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">অফলাইনে পড়ার জন্য সরাসরি ডিভাইসে সংরক্ষণ করুন</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Facebook Reality & Transparency */}
      <div className="card p-6 sm:p-8 space-y-4 border-amber-200 dark:border-amber-900/50 bg-amber-50/30 dark:bg-amber-950/10">
        <div className="flex items-center gap-3">
          <AlertTriangle className="w-6 h-6 text-amber-500 shrink-0" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            The Facebook Reality: How Import Works
          </h2>
        </div>
        <p className="text-gray-600 dark:text-slate-300 text-sm leading-relaxed">
          Post2PDF respects privacy and security policies. We do <strong>not</strong> bypass authentication, hack private posts, crack CAPTCHAs, or run stealth bots.
        </p>
        <div className="space-y-2 text-sm text-gray-600 dark:text-slate-300">
          <div className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
            <span><strong>When automatic import works:</strong> Publicly accessible Facebook posts where Open Graph metadata or public CDN image tags are served without requiring an authenticated session.</span>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
            <span><strong>When Facebook blocks access:</strong> Facebook frequently restricts automated requests to posts in closed groups, posts marked with audience limits, or when anti-bot heuristics trigger a login wall.</span>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-brand-500 shrink-0 mt-0.5" />
            <span><strong>The 100% Reliable Manual Fallback:</strong> You can always save or screenshot the images and upload them directly via drag-and-drop. The manual upload workflow does not depend on Facebook at all and processes completely on your machine.</span>
          </div>
        </div>
      </div>

      {/* Privacy Guarantees */}
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Shield className="w-6 h-6 text-brand-500" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Privacy First Architecture
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="card p-5 space-y-2">
            <div className="flex items-center gap-2 text-gray-900 dark:text-white font-semibold">
              <Lock className="w-4 h-4 text-brand-500" />
              No Credentials Ever
            </div>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-slate-400">
              Post2PDF never asks for your Facebook username, password, token, or cookies. Your account security is never at risk.
            </p>
          </div>

          <div className="card p-5 space-y-2">
            <div className="flex items-center gap-2 text-gray-900 dark:text-white font-semibold">
              <Cpu className="w-4 h-4 text-brand-500" />
              Client-Side Processing
            </div>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-slate-400">
              When you upload images manually, the PDF is generated right in your browser using JavaScript and HTML5 canvas. Your files never leave your computer.
            </p>
          </div>

          <div className="card p-5 space-y-2">
            <div className="flex items-center gap-2 text-gray-900 dark:text-white font-semibold">
              <RefreshCw className="w-4 h-4 text-brand-500" />
              Zero Server Storage
            </div>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-slate-400">
              For remote Facebook image imports requiring server rendering, images are loaded strictly in temporary RAM and destroyed immediately upon PDF delivery.
            </p>
          </div>

          <div className="card p-5 space-y-2">
            <div className="flex items-center gap-2 text-gray-900 dark:text-white font-semibold">
              <FileText className="w-4 h-4 text-brand-500" />
              Local IndexedDB History
            </div>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-slate-400">
              Your generated PDF history and downloads are stored locally inside your browser's IndexedDB storage. No user accounts or centralized database required.
            </p>
          </div>
        </div>
      </div>

      {/* Feature Highlights */}
      <div className="card p-6 sm:p-8 space-y-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          Key PDF Generation Capabilities
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
          <div className="space-y-1">
            <span className="font-semibold text-gray-900 dark:text-white">Page Sizes</span>
            <p className="text-xs text-gray-500 dark:text-slate-400">
              Standard A4 (default for print/exam revision), US Letter, or original image aspect ratio preservation.
            </p>
          </div>
          <div className="space-y-1">
            <span className="font-semibold text-gray-900 dark:text-white">Multi-Image Layout</span>
            <p className="text-xs text-gray-500 dark:text-slate-400">
              Choose 1, 2, or 4 images per page to save paper or fit compact lecture slides.
            </p>
          </div>
          <div className="space-y-1">
            <span className="font-semibold text-gray-900 dark:text-white">Quality & Readability</span>
            <p className="text-xs text-gray-500 dark:text-slate-400">
              Text sharpness is prioritized. High-DPI outputs preserve small handwriting and equations without compression blur.
            </p>
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="text-center pt-4">
        <Link to="/" className="btn-primary btn-lg inline-flex items-center gap-2">
          <Download className="w-5 h-5" />
          Start Converting Images
        </Link>
      </div>
    </div>
  );
}
