import React, { useState } from 'react';
import { CustomerRecord, SummaryStatistics } from '../types/dataset';
import { calculateSummaryStatistics } from '../utils/mlEngine';
import { Table, BarChart2, PieChart, Activity } from 'lucide-react';

interface DataExplorationViewProps {
  data: CustomerRecord[];
}

export const DataExplorationView: React.FC<DataExplorationViewProps> = ({ data }) => {
  const [activeTab, setActiveTab] = useState<'plots' | 'head' | 'describe' | 'info'>('plots');

  const ages = data.map(d => d.Age);
  const incomes = data.map(d => d['Annual Income (k$)']);
  const scores = data.map(d => d['Spending Score (1-100)']);

  const ageStats = calculateSummaryStatistics(ages);
  const incomeStats = calculateSummaryStatistics(incomes);
  const scoreStats = calculateSummaryStatistics(scores);

  const maleCount = data.filter(d => d.Gender === 'Male').length;
  const femaleCount = data.filter(d => d.Gender === 'Female').length;
  const otherCount = data.length - maleCount - femaleCount;
  const femalePct = ((femaleCount / data.length) * 100).toFixed(1);
  const malePct = ((maleCount / data.length) * 100).toFixed(1);

  // Helper to build histogram bins
  const getHistogramData = (values: number[], numBins: number = 10) => {
    if (values.length === 0) return [];
    const min = Math.min(...values);
    const max = Math.max(...values);
    const binWidth = (max - min) / numBins || 1;
    const bins = Array.from({ length: numBins }, (_, i) => ({
      start: min + i * binWidth,
      end: min + (i + 1) * binWidth,
      count: 0
    }));

    values.forEach(v => {
      let bIdx = Math.floor((v - min) / binWidth);
      if (bIdx >= numBins) bIdx = numBins - 1;
      if (bIdx >= 0) bins[bIdx].count++;
    });

    return bins;
  };

  const ageBins = getHistogramData(ages, 8);
  const incomeBins = getHistogramData(incomes, 8);
  const scoreBins = getHistogramData(scores, 8);

  const renderHistogram = (
    title: string,
    bins: { start: number; end: number; count: number }[],
    stats: SummaryStatistics,
    colorHex: string,
    unit: string = ''
  ) => {
    const maxCount = Math.max(...bins.map(b => b.count), 1);
    const chartHeight = 110;

    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">{title}</h4>
          <span className="text-xs font-mono text-slate-400">
            μ={stats.mean}{unit} · σ={stats.std}
          </span>
        </div>

        {/* SVG Histogram */}
        <div className="h-32 w-full pt-2">
          <svg className="w-full h-full" viewBox="0 0 300 120" preserveAspectRatio="none">
            {/* Gridlines */}
            <line x1="0" y1="100" x2="300" y2="100" stroke="#334155" strokeWidth="1" />
            <line x1="0" y1="50" x2="300" y2="300" stroke="#1e293b" strokeDasharray="3 3" />

            {bins.map((bin, i) => {
              const barWidth = 300 / bins.length - 4;
              const barHeight = (bin.count / maxCount) * 85;
              const x = i * (300 / bins.length) + 2;
              const y = 100 - barHeight;

              return (
                <g key={i} className="group">
                  <rect
                    x={x}
                    y={y}
                    width={barWidth}
                    height={barHeight}
                    rx="2"
                    fill={colorHex}
                    opacity="0.85"
                    className="transition-all hover:opacity-100"
                  />
                  {/* Tooltip text inside SVG */}
                  <text
                    x={x + barWidth / 2}
                    y={y - 4}
                    textAnchor="middle"
                    fill="#94a3b8"
                    fontSize="9"
                    fontFamily="monospace"
                  >
                    {bin.count}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* X Axis bounds */}
        <div className="flex justify-between text-[10px] text-slate-400 font-mono pt-1 border-t border-slate-800">
          <span>{bins[0]?.start.toFixed(0)}{unit}</span>
          <span className="text-slate-500">Median: {stats.p50}{unit}</span>
          <span>{bins[bins.length - 1]?.end.toFixed(0)}{unit}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-5">
      {/* Step Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800 gap-2">
        <div>
          <span className="text-xs font-mono text-indigo-400">Step 1 of 7</span>
          <h3 className="text-lg font-bold text-white">Data Loading & Exploratory Data Analysis</h3>
          <p className="text-xs text-slate-400">
            Initial inspection of raw customer distributions, summary statistics, and missing values.
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-lg self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('plots')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              activeTab === 'plots' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Distributions
          </button>
          <button
            onClick={() => setActiveTab('describe')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              activeTab === 'describe' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            describe()
          </button>
          <button
            onClick={() => setActiveTab('head')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              activeTab === 'head' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            head()
          </button>
          <button
            onClick={() => setActiveTab('info')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              activeTab === 'info' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            info()
          </button>
        </div>
      </div>

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
          <span className="text-xs text-slate-400 block mb-1">Total Records</span>
          <span className="text-xl font-bold font-mono text-white tabular-nums">
            {data.length}
          </span>
          <span className="text-[11px] text-emerald-400 block mt-0.5">0 Missing Values</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
          <span className="text-xs text-slate-400 block mb-1">Gender Split</span>
          <span className="text-xl font-bold font-mono text-white tabular-nums">
            {femalePct}% <span className="text-pink-400 text-sm font-normal">F</span> / {malePct}% <span className="text-blue-400 text-sm font-normal">M</span>
          </span>
          <span className="text-[11px] text-slate-500 block mt-0.5">{femaleCount} females, {maleCount} males</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
          <span className="text-xs text-slate-400 block mb-1">Avg Annual Income</span>
          <span className="text-xl font-bold font-mono text-emerald-400 tabular-nums">
            ${incomeStats.mean}k
          </span>
          <span className="text-[11px] text-slate-500 block mt-0.5">Range: ${incomeStats.min}k – ${incomeStats.max}k</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
          <span className="text-xs text-slate-400 block mb-1">Avg Spending Score</span>
          <span className="text-xl font-bold font-mono text-amber-400 tabular-nums">
            {scoreStats.mean} <span className="text-xs text-slate-500 font-normal">/ 100</span>
          </span>
          <span className="text-[11px] text-slate-500 block mt-0.5">Range: {scoreStats.min} – {scoreStats.max}</span>
        </div>
      </div>

      {/* Main Tab Content */}
      {activeTab === 'plots' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Gender Donut Chart */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                1. Gender Breakdown
              </h4>
              <span className="text-xs font-mono text-slate-400">Total: {data.length}</span>
            </div>

            <div className="flex items-center justify-center py-3 gap-6">
              <div className="relative w-28 h-28">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  {/* Background Circle */}
                  <path
                    className="text-slate-800"
                    strokeWidth="3.8"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  {/* Female Segment (Pink) */}
                  <path
                    className="text-pink-500"
                    strokeDasharray={`${femalePct}, 100`}
                    strokeWidth="4.2"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-xs font-bold font-mono text-white">{femalePct}%</span>
                  <span className="text-[9px] text-pink-400">Female</span>
                </div>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-pink-500 shrink-0" />
                  <span className="text-slate-300">Female:</span>
                  <span className="font-mono text-white font-semibold">{femaleCount} ({femalePct}%)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-blue-500 shrink-0" />
                  <span className="text-slate-300">Male:</span>
                  <span className="font-mono text-white font-semibold">{maleCount} ({malePct}%)</span>
                </div>
                {otherCount > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-slate-500 shrink-0" />
                    <span className="text-slate-300">Other:</span>
                    <span className="font-mono text-white font-semibold">{otherCount}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="text-[11px] text-slate-500 border-t border-slate-800 pt-2">
              Slight female customer majority (~56%), representing higher shopping mall visit frequency.
            </div>
          </div>

          {/* Age Distribution */}
          {renderHistogram('2. Age Distribution (Years)', ageBins, ageStats, '#8b5cf6', 'y')}

          {/* Annual Income Distribution */}
          {renderHistogram('3. Annual Income Distribution (k$)', incomeBins, incomeStats, '#10b981', 'k')}

          {/* Spending Score Distribution */}
          {renderHistogram('4. Spending Score Distribution (1-100)', scoreBins, scoreStats, '#f59e0b')}
        </div>
      )}

      {/* df.describe() Table View */}
      {activeTab === 'describe' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
            <h4 className="text-xs font-mono uppercase text-slate-300">
              pandas.DataFrame.describe().round(2)
            </h4>
            <span className="text-xs text-slate-500">All numeric columns</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-950 text-slate-400 font-mono border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-4 font-medium">Statistic</th>
                  <th className="py-2.5 px-4 font-medium text-right">Age</th>
                  <th className="py-2.5 px-4 font-medium text-right">Annual Income (k$)</th>
                  <th className="py-2.5 px-4 font-medium text-right">Spending Score (1-100)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 font-mono text-slate-200">
                <tr className="hover:bg-slate-800/40">
                  <td className="py-2 px-4 font-sans font-semibold text-slate-300">count</td>
                  <td className="py-2 px-4 text-right tabular-nums">{ageStats.count}.00</td>
                  <td className="py-2 px-4 text-right tabular-nums">{incomeStats.count}.00</td>
                  <td className="py-2 px-4 text-right tabular-nums">{scoreStats.count}.00</td>
                </tr>
                <tr className="hover:bg-slate-800/40">
                  <td className="py-2 px-4 font-sans font-semibold text-slate-300">mean</td>
                  <td className="py-2 px-4 text-right tabular-nums">{ageStats.mean}</td>
                  <td className="py-2 px-4 text-right tabular-nums">{incomeStats.mean}</td>
                  <td className="py-2 px-4 text-right tabular-nums">{scoreStats.mean}</td>
                </tr>
                <tr className="hover:bg-slate-800/40">
                  <td className="py-2 px-4 font-sans font-semibold text-slate-300">std</td>
                  <td className="py-2 px-4 text-right tabular-nums">{ageStats.std}</td>
                  <td className="py-2 px-4 text-right tabular-nums">{incomeStats.std}</td>
                  <td className="py-2 px-4 text-right tabular-nums">{scoreStats.std}</td>
                </tr>
                <tr className="hover:bg-slate-800/40">
                  <td className="py-2 px-4 font-sans font-semibold text-slate-300">min</td>
                  <td className="py-2 px-4 text-right tabular-nums">{ageStats.min}.00</td>
                  <td className="py-2 px-4 text-right tabular-nums">{incomeStats.min}.00</td>
                  <td className="py-2 px-4 text-right tabular-nums">{scoreStats.min}.00</td>
                </tr>
                <tr className="hover:bg-slate-800/40">
                  <td className="py-2 px-4 font-sans font-semibold text-slate-300">25% (Q1)</td>
                  <td className="py-2 px-4 text-right tabular-nums">{ageStats.p25}</td>
                  <td className="py-2 px-4 text-right tabular-nums">{incomeStats.p25}</td>
                  <td className="py-2 px-4 text-right tabular-nums">{scoreStats.p25}</td>
                </tr>
                <tr className="hover:bg-slate-800/40">
                  <td className="py-2 px-4 font-sans font-semibold text-slate-300">50% (Median)</td>
                  <td className="py-2 px-4 text-right tabular-nums">{ageStats.p50}</td>
                  <td className="py-2 px-4 text-right tabular-nums">{incomeStats.p50}</td>
                  <td className="py-2 px-4 text-right tabular-nums">{scoreStats.p50}</td>
                </tr>
                <tr className="hover:bg-slate-800/40">
                  <td className="py-2 px-4 font-sans font-semibold text-slate-300">75% (Q3)</td>
                  <td className="py-2 px-4 text-right tabular-nums">{ageStats.p75}</td>
                  <td className="py-2 px-4 text-right tabular-nums">{incomeStats.p75}</td>
                  <td className="py-2 px-4 text-right tabular-nums">{scoreStats.p75}</td>
                </tr>
                <tr className="hover:bg-slate-800/40">
                  <td className="py-2 px-4 font-sans font-semibold text-slate-300">max</td>
                  <td className="py-2 px-4 text-right tabular-nums">{ageStats.max}.00</td>
                  <td className="py-2 px-4 text-right tabular-nums">{incomeStats.max}.00</td>
                  <td className="py-2 px-4 text-right tabular-nums">{scoreStats.max}.00</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* df.head() Table View */}
      {activeTab === 'head' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
            <h4 className="text-xs font-mono uppercase text-slate-300">
              pandas.DataFrame.head(5)
            </h4>
            <span className="text-xs text-slate-500">First 5 records</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-950 text-slate-400 font-mono border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-4 font-medium">Index</th>
                  <th className="py-2.5 px-4 font-medium">CustomerID</th>
                  <th className="py-2.5 px-4 font-medium">Gender</th>
                  <th className="py-2.5 px-4 font-medium text-right">Age</th>
                  <th className="py-2.5 px-4 font-medium text-right">Annual Income (k$)</th>
                  <th className="py-2.5 px-4 font-medium text-right">Spending Score (1-100)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 font-mono text-slate-200">
                {data.slice(0, 5).map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/40">
                    <td className="py-2 px-4 text-slate-500">{idx}</td>
                    <td className="py-2 px-4">{row.CustomerID}</td>
                    <td className="py-2 px-4 font-sans">
                      <span className={row.Gender === 'Female' ? 'text-pink-400' : 'text-blue-400'}>
                        {row.Gender}
                      </span>
                    </td>
                    <td className="py-2 px-4 text-right tabular-nums">{row.Age}</td>
                    <td className="py-2 px-4 text-right tabular-nums">${row['Annual Income (k$)']}k</td>
                    <td className="py-2 px-4 text-right tabular-nums">{row['Spending Score (1-100)']}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* df.info() View */}
      {activeTab === 'info' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 font-mono text-xs text-slate-300 space-y-2">
          <div className="text-slate-400 pb-2 border-b border-slate-800">
            &lt;class &apos;pandas.core.frame.DataFrame&apos;&gt;<br />
            RangeIndex: {data.length} entries, 0 to {data.length - 1}<br />
            Data columns (total 5 columns):
          </div>
          <table className="w-full text-left my-2">
            <thead>
              <tr className="text-slate-500 border-b border-slate-800">
                <th className="py-1">#</th>
                <th className="py-1">Column</th>
                <th className="py-1">Non-Null Count</th>
                <th className="py-1">Dtype</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              <tr>
                <td className="py-1 text-slate-500">0</td>
                <td className="py-1 text-indigo-300">CustomerID</td>
                <td className="py-1">{data.length} non-null</td>
                <td className="py-1 text-amber-400">int64</td>
              </tr>
              <tr>
                <td className="py-1 text-slate-500">1</td>
                <td className="py-1 text-indigo-300">Gender</td>
                <td className="py-1">{data.length} non-null</td>
                <td className="py-1 text-emerald-400">object</td>
              </tr>
              <tr>
                <td className="py-1 text-slate-500">2</td>
                <td className="py-1 text-indigo-300">Age</td>
                <td className="py-1">{data.length} non-null</td>
                <td className="py-1 text-amber-400">int64</td>
              </tr>
              <tr>
                <td className="py-1 text-slate-500">3</td>
                <td className="py-1 text-indigo-300">Annual Income (k$)</td>
                <td className="py-1">{data.length} non-null</td>
                <td className="py-1 text-amber-400">int64</td>
              </tr>
              <tr>
                <td className="py-1 text-slate-500">4</td>
                <td className="py-1 text-indigo-300">Spending Score (1-100)</td>
                <td className="py-1">{data.length} non-null</td>
                <td className="py-1 text-amber-400">int64</td>
              </tr>
            </tbody>
          </table>
          <div className="text-slate-400 pt-2 border-t border-slate-800">
            dtypes: int64(4), object(1)<br />
            memory usage: ~7.9+ KB
          </div>
        </div>
      )}
    </div>
  );
};
