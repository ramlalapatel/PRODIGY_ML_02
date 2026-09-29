import React, { useRef } from 'react';
import { Upload, RotateCcw, Sliders, Layers } from 'lucide-react';
import { CustomerRecord } from '../types/dataset';

interface DatasetUploaderProps {
  onDataLoaded: (data: CustomerRecord[], sourceName: string) => void;
  onResetDefault: () => void;
  isCustomData: boolean;
  sourceName: string;
  is3D: boolean;
  onToggle3D: (val: boolean) => void;
  kValue: number;
  onKChange: (k: number) => void;
}

export const DatasetUploader: React.FC<DatasetUploaderProps> = ({
  onDataLoaded,
  onResetDefault,
  isCustomData,
  sourceName,
  is3D,
  onToggle3D,
  kValue,
  onKChange
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = event => {
      const text = event.target?.result as string;
      if (!text) return;

      const lines = text.trim().split(/\r\n|\n/);
      if (lines.length < 2) return;

      const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));

      // Find indices
      const findCol = (patterns: string[]) => {
        return headers.findIndex(h =>
          patterns.some(p => h.toLowerCase().includes(p.toLowerCase()))
        );
      };

      const idIdx = findCol(['customerid', 'id']);
      const genderIdx = findCol(['gender', 'sex']);
      const ageIdx = findCol(['age']);
      const incomeIdx = findCol(['income', 'annual income']);
      const scoreIdx = findCol(['score', 'spending']);

      const parsed: CustomerRecord[] = [];

      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        const cols = lines[i].split(',').map(c => c.trim().replace(/^"|"$/g, ''));

        const incomeVal = incomeIdx >= 0 ? parseFloat(cols[incomeIdx]) : 50;
        const scoreVal = scoreIdx >= 0 ? parseFloat(cols[scoreIdx]) : 50;
        const ageVal = ageIdx >= 0 ? parseFloat(cols[ageIdx]) : 35;
        const genderVal = genderIdx >= 0 ? cols[genderIdx] : 'Unknown';
        const idVal = idIdx >= 0 ? parseInt(cols[idIdx], 10) : i;

        if (!isNaN(incomeVal) && !isNaN(scoreVal)) {
          parsed.push({
            CustomerID: isNaN(idVal) ? i : idVal,
            Gender: genderVal,
            Age: isNaN(ageVal) ? 35 : ageVal,
            'Annual Income (k$)': incomeVal,
            'Spending Score (1-100)': scoreVal
          });
        }
      }

      if (parsed.length > 0) {
        onDataLoaded(parsed, file.name);
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 lg:p-5 mb-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Dataset source info */}
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
            <span>Dataset Source</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono text-slate-300">{sourceName}</span>
            {isCustomData && (
              <>
                <span aria-hidden="true">·</span>
                <span className="text-emerald-400 font-medium">Custom Uploaded File</span>
              </>
            )}
          </div>
          <h2 className="text-base font-semibold text-white">
            Kaggle Mall Customers Benchmark
          </h2>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Feature space selector */}
          <div className="flex items-center p-1 bg-slate-950 border border-slate-800 rounded-lg">
            <button
              onClick={() => onToggle3D(false)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                !is3D
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              2D (Income + Score)
            </button>
            <button
              onClick={() => onToggle3D(true)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                is3D
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              3D (Age + Income + Score)
            </button>
          </div>

          {/* K slider control */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg">
            <span className="text-xs text-slate-400 font-medium">Clusters (K):</span>
            <input
              type="range"
              min={2}
              max={8}
              value={kValue}
              onChange={e => onKChange(parseInt(e.target.value, 10))}
              className="w-20 accent-indigo-500 cursor-pointer"
            />
            <span className="text-xs font-bold text-white font-mono w-4 text-center">
              {kValue}
            </span>
          </div>

          {/* Upload Button */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".csv"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-800 border border-slate-700/80 rounded-lg hover:bg-slate-700 transition-colors"
          >
            <Upload className="w-3.5 h-3.5 text-indigo-400" />
            <span>Upload CSV</span>
          </button>

          {/* Reset Button */}
          {isCustomData && (
            <button
              onClick={onResetDefault}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-slate-200 bg-slate-950 border border-slate-800 rounded-lg transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset to Default</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
