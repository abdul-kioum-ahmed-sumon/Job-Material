import {
  FileText,
  Maximize,
  Square,
  Columns2,
  Grid2x2,
  Minimize2,
  Maximize2,
  ZoomIn,
  Settings2,
  Sparkles,
  Sliders,
  Check,
} from 'lucide-react';
import type { PDFSettings, PageSize, LayoutOption, ImageFit, MarginOption } from '../types';

interface PDFSettingsPanelProps {
  settings: PDFSettings;
  onSettingsChange: (settings: PDFSettings) => void;
  totalImages?: number;
}

interface OptionItem<T> {
  value: T;
  label: string;
  icon?: React.ReactNode;
  hint?: string;
}

function OptionGroup<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: OptionItem<T>[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="space-y-2">
      <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
        {label}
      </label>
      <div className="grid grid-cols-3 gap-2">
        {options.map((opt) => {
          const selected = value === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(opt.value)}
              className={`flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border transition-all duration-200 text-center relative ${
                selected
                  ? 'border-brand-500 bg-brand-50/80 dark:bg-brand-950/40 text-brand-600 dark:text-brand-300 font-semibold shadow-xs ring-1 ring-brand-500/30'
                  : 'border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 hover:border-slate-300 dark:hover:border-slate-700 text-slate-600 dark:text-slate-400'
              }`}
              aria-label={opt.label}
              aria-pressed={selected}
            >
              {selected && (
                <div className="absolute top-1.5 right-1.5 w-3.5 h-3.5 rounded-full bg-brand-500 text-white flex items-center justify-center">
                  <Check className="w-2.5 h-2.5" />
                </div>
              )}
              {opt.icon && <span className="text-current">{opt.icon}</span>}
              <span className="text-xs">{opt.label}</span>
              {opt.hint && (
                <span className="text-[10px] text-slate-400 dark:text-slate-500 -mt-1">
                  {opt.hint}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function PDFSettingsPanel({
  settings,
  onSettingsChange,
  totalImages = 0,
}: PDFSettingsPanelProps) {
  const update = (partial: Partial<PDFSettings>) => {
    onSettingsChange({ ...settings, ...partial });
  };

  const pageSizes: OptionItem<PageSize>[] = [
    { value: 'a4', label: 'A4 Paper', icon: <FileText className="w-4 h-4" />, hint: 'Print Standard' },
    { value: 'letter', label: 'US Letter', icon: <Square className="w-4 h-4" />, hint: '8.5 x 11 in' },
    { value: 'original', label: 'Original', icon: <Maximize className="w-4 h-4" />, hint: 'Image Size' },
  ];

  const layouts: OptionItem<LayoutOption>[] = [
    { value: '1', label: '1 per Page', icon: <Square className="w-4 h-4" />, hint: 'Full Detail' },
    { value: '2', label: '2 per Page', icon: <Columns2 className="w-4 h-4" />, hint: 'Save Paper' },
    { value: '4', label: '4 per Page', icon: <Grid2x2 className="w-4 h-4" />, hint: 'Slide Grid' },
  ];

  const fits: OptionItem<ImageFit>[] = [
    { value: 'fit', label: 'Best Fit', icon: <Minimize2 className="w-4 h-4" />, hint: 'No Crop' },
    { value: 'fill', label: 'Fill Page', icon: <Maximize2 className="w-4 h-4" />, hint: 'Full Bleed' },
    { value: 'original', label: 'Original 1:1', icon: <ZoomIn className="w-4 h-4" />, hint: 'Actual Pixels' },
  ];

  const margins: OptionItem<MarginOption>[] = [
    { value: 'none', label: 'None (0mm)' },
    { value: 'small', label: 'Small (5mm)' },
    { value: 'medium', label: 'Normal (10mm)' },
  ];

  const estimatedPages = totalImages > 0
    ? Math.ceil(totalImages / parseInt(settings.layout))
    : 0;

  const quickPresets = ['BCS_Study_Notes', 'Job_Preparation', 'Class_Lecture', 'Question_Bank'];

  return (
    <div className="card p-6 sm:p-8 space-y-6 border border-slate-200/90 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl shadow-lg shadow-brand-500/5 dark:shadow-none animate-fade-in">
      {/* Title & Live Estimate Pill */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200/80 dark:border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-600 text-white flex items-center justify-center shadow-xs">
            <Settings2 className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              PDF Formatting & Layout
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Customize pages, margins, resolution, and output filename
            </p>
          </div>
        </div>

        {totalImages > 0 && (
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200/70 dark:border-indigo-800/60 text-xs font-semibold text-indigo-700 dark:text-indigo-300">
            <Sliders className="w-3.5 h-3.5 text-indigo-500" />
            <span>Est. Pages: <strong>{estimatedPages}</strong> ({settings.layout} img/page)</span>
          </div>
        )}
      </div>

      {/* Filename & Quick Presets */}
      <div className="space-y-2">
        <label htmlFor="pdf-filename" className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Document Title / Filename
        </label>
        <div className="flex gap-2">
          <input
            id="pdf-filename"
            type="text"
            value={settings.filename}
            onChange={(e) => update({ filename: e.target.value })}
            className="input flex-1 font-mono text-sm"
            placeholder="Post2PDF_Document"
          />
          <span className="self-center px-3 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-500 border border-slate-200 dark:border-slate-700">
            .pdf
          </span>
        </div>

        {/* Quick Preset Buttons */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="text-[11px] text-slate-400 dark:text-slate-500 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-brand-500" /> Quick tags:
          </span>
          {quickPresets.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => {
                const date = new Date().toISOString().slice(0, 10);
                update({ filename: `${preset}_${date}` });
              }}
              className="text-[11px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800/80 hover:bg-brand-50 dark:hover:bg-brand-900/30 hover:text-brand-600 dark:hover:text-brand-300 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 transition-colors"
            >
              {preset.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Main Options Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
        <OptionGroup<PageSize>
          label="Page Size"
          options={pageSizes}
          value={settings.pageSize}
          onChange={(v) => update({ pageSize: v })}
        />

        <OptionGroup<LayoutOption>
          label="Images Per Page"
          options={layouts}
          value={settings.layout}
          onChange={(v) => update({ layout: v })}
        />

        <OptionGroup<ImageFit>
          label="Image Scaling"
          options={fits}
          value={settings.imageFit}
          onChange={(v) => update({ imageFit: v })}
        />

        <OptionGroup<MarginOption>
          label="Page Margins"
          options={margins}
          value={settings.margin}
          onChange={(v) => update({ margin: v })}
        />
      </div>

      {/* Quality Selection */}
      <div className="pt-2 border-t border-slate-200/80 dark:border-slate-800/80">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-2">
          Rendering Quality
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => update({ quality: 'high' })}
            className={`p-3.5 rounded-xl border text-left flex items-start gap-3 transition-all ${
              settings.quality === 'high'
                ? 'border-brand-500 bg-brand-50/80 dark:bg-brand-950/40 text-brand-700 dark:text-brand-300 ring-1 ring-brand-500/30'
                : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:border-slate-300'
            }`}
          >
            <div className={`w-4 h-4 rounded-full border mt-0.5 flex items-center justify-center shrink-0 ${
              settings.quality === 'high' ? 'border-brand-600 bg-brand-600 text-white' : 'border-slate-400'
            }`}>
              {settings.quality === 'high' && <Check className="w-2.5 h-2.5" />}
            </div>
            <div>
              <div className="text-xs font-bold flex items-center gap-1.5">
                <span>High Quality (300 DPI)</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-brand-200/70 dark:bg-brand-800/60 font-semibold">
                  Recommended
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Crystal clear text. Perfect for reading handwriting, Bengali fonts, and printed exam questions.
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => update({ quality: 'standard' })}
            className={`p-3.5 rounded-xl border text-left flex items-start gap-3 transition-all ${
              settings.quality === 'standard'
                ? 'border-brand-500 bg-brand-50/80 dark:bg-brand-950/40 text-brand-700 dark:text-brand-300 ring-1 ring-brand-500/30'
                : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:border-slate-300'
            }`}
          >
            <div className={`w-4 h-4 rounded-full border mt-0.5 flex items-center justify-center shrink-0 ${
              settings.quality === 'standard' ? 'border-brand-600 bg-brand-600 text-white' : 'border-slate-400'
            }`}>
              {settings.quality === 'standard' && <Check className="w-2.5 h-2.5" />}
            </div>
            <div>
              <div className="text-xs font-bold">Standard Quality (Compressed)</div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Smaller PDF file size, faster to generate and share over low-bandwidth mobile connections.
              </p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
