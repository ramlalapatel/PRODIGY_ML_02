import React from 'react';
import { Download, FileSpreadsheet, Sparkles, FolderDown } from 'lucide-react';

export type ActiveTab = 'pipeline' | 'simulator' | 'scratch' | 'visuals' | 'playbook' | 'code' | 'dataset';

interface TopBarProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  onExportCsv: () => void;
  onDownloadProject: () => void;
  totalCustomers: number;
}

export const TopBar: React.FC<TopBarProps> = ({
  activeTab,
  onTabChange,
  onExportCsv,
  onDownloadProject,
  totalCustomers
}) => {
  const navTabs: { id: ActiveTab; label: string }[] = [
    { id: 'pipeline', label: 'ML Pipeline (7 Steps)' },
    { id: 'visuals', label: '2D & 3D Visualizer' },
    { id: 'simulator', label: 'Streamlit Predictor' },
    { id: 'playbook', label: 'Marketing Playbook' },
    { id: 'scratch', label: 'NumPy Scratch Benchmark' },
    { id: 'code', label: 'Code & Files Hub' },
    { id: 'dataset', label: 'Dataset Browser' },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-950/90 backdrop-blur-md px-4 lg:px-8">
      <div className="flex h-16 items-center justify-between gap-4">
        {/* Zone 1: Single text element wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white shadow-sm shadow-indigo-500/20">
            K
          </div>
          <span className="text-lg font-bold tracking-tight text-white">
            Customer Segmentation ML Studio
          </span>
          <span className="hidden sm:inline text-xs text-slate-500 font-mono">
            Mall_Customers · n={totalCustomers}
          </span>
        </div>

        {/* Zone 2: Navigation Links / Segmented Tabs */}
        <nav className="hidden lg:flex items-center gap-1 overflow-x-auto no-scrollbar py-1">
          {navTabs.map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
                  isActive
                    ? 'bg-slate-800 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: 1-2 Primary Action Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onExportCsv}
            title="Download clustered CSV"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-900 border border-slate-800 rounded-lg hover:bg-slate-800 hover:text-white transition-colors whitespace-nowrap"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden sm:inline">Export</span> Segments.csv
          </button>

          <button
            onClick={onDownloadProject}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors shadow-sm shadow-indigo-600/30 whitespace-nowrap"
          >
            <FolderDown className="w-3.5 h-3.5" />
            <span>Download Project</span>
          </button>
        </div>
      </div>

      {/* Mobile Nav Sub-row */}
      <div className="flex lg:hidden overflow-x-auto gap-1 py-2 border-t border-slate-800/60 no-scrollbar">
        {navTabs.map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`px-2.5 py-1 text-xs font-medium rounded-md whitespace-nowrap shrink-0 transition-colors ${
                isActive
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-slate-200 bg-slate-900/40'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
    </header>
  );
};
