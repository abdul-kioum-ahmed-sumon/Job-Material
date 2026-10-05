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
} from 'lucide-react';
import type { PDFSettings, PageSize, LayoutOption, ImageFit, MarginOption, QualityOption } from '../types';

interface PDFSettingsPanelProps {
  settings: PDFSettings;
  onSettingsChange: (settings: PDFSettings) => void;
}

interface OptionItem<T> {
  value: T;
  label: string;
  icon?: React.ReactNode;
  description?: string;
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
      <label className="text-sm font-medium text-gray-700 dark:text-slate-300">{label}</label>
      <div className="grid grid-cols-3 gap-2">
        {options.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all duration-200 text-center
              ${value === opt.value
                ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-300'
                : 'border-gray-200 dark:border-slate-600 hover:border-gray-300 dark:hover:border-slate-500 text-gray-600 dark:text-slate-400'
              }`}
            aria-label={opt.label}
            aria-pressed={value === opt.value}
          >
            {opt.icon && <span className="text-current">{opt.icon}</span>}
            <span className="text-xs font-medium">{opt.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default function PDFSettingsPanel({ settings, onSettingsChange }: PDFSettingsPanelProps) {

  const update = (partial: Partial<PDFSettings>) => {
    onSettingsChange({ ...settings, ...partial });
  };

  const pageSizes: OptionItem<PageSize>[] = [
    { value: 'a4', label: 'A4', icon: <FileText className="w-5 h-5" /> },
    { value: 'letter', label: 'Letter', icon: <Square className="w-5 h-5" /> },
    { value: 'original', label: 'Original', icon: <Maximize className="w-5 h-5" /> },
  ];

  const layouts: OptionItem<LayoutOption>[] = [
    { value: '1', label: '1 per page', icon: <Square className="w-5 h-5" /> },
    { value: '2', label: '2 per page', icon: <Columns2 className="w-5 h-5" /> },
    { value: '4', label: '4 per page', icon: <Grid2x2 className="w-5 h-5" /> },
  ];

  const fits: OptionItem<ImageFit>[] = [
    { value: 'fit', label: 'Fit', icon: <Minimize2 className="w-5 h-5" /> },
    { value: 'fill', label: 'Fill', icon: <Maximize2 className="w-5 h-5" /> },
    { value: 'original', label: 'Original', icon: <ZoomIn className="w-5 h-5" /> },
  ];

  const margins: OptionItem<MarginOption>[] = [
    { value: 'none', label: 'None' },
    { value: 'small', label: 'Small' },
    { value: 'medium', label: 'Medium' },
  ];

  const qualities: OptionItem<QualityOption>[] = [
    { value: 'standard', label: 'Standard' },
    { value: 'high', label: 'High' },
  ];

  return (
    <div className="card p-6 space-y-6 animate-fade-in">
      <div className="flex items-center gap-2">
        <Settings2 className="w-5 h-5 text-brand-500" />
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">PDF Settings</h3>
      </div>

      {/* Filename */}
      <div className="space-y-2">
        <label htmlFor="pdf-filename" className="text-sm font-medium text-gray-700 dark:text-slate-300">
          Filename
        </label>
        <div className="flex gap-2">
          <input
            id="pdf-filename"
            type="text"
            value={settings.filename}
            onChange={(e) => update({ filename: e.target.value })}
            className="input flex-1"
            placeholder="Post2PDF_2026-10-05_11-45"
          />
          <span className="self-center text-sm text-gray-400">.pdf</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <OptionGroup<PageSize>
          label="Page Size"
          options={pageSizes}
          value={settings.pageSize}
          onChange={(v) => update({ pageSize: v })}
        />

        <OptionGroup<LayoutOption>
          label="Layout"
          options={layouts}
          value={settings.layout}
          onChange={(v) => update({ layout: v })}
        />

        <OptionGroup<ImageFit>
          label="Image Fit"
          options={fits}
          value={settings.imageFit}
          onChange={(v) => update({ imageFit: v })}
        />

        <div className="space-y-4">
          <OptionGroup<MarginOption>
            label="Margins"
            options={margins}
            value={settings.margin}
            onChange={(v) => update({ margin: v })}
          />
        </div>
      </div>

      {/* Quality - wider */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700 dark:text-slate-300">Quality</label>
        <div className="grid grid-cols-2 gap-2 max-w-xs">
          {qualities.map((opt) => (
            <button
              key={opt.value}
              onClick={() => update({ quality: opt.value })}
              className={`p-3 rounded-xl border-2 transition-all duration-200 text-center text-sm font-medium
                ${settings.quality === opt.value
                  ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-300'
                  : 'border-gray-200 dark:border-slate-600 hover:border-gray-300 text-gray-600 dark:text-slate-400'
                }`}
              aria-pressed={settings.quality === opt.value}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
