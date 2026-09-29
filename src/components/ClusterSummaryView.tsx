import React from 'react';
import { CustomerRecord, Centroid } from '../types/dataset';
import { CLUSTER_PROFILES_CATALOG } from '../data/mallCustomersData';
import { Users, BarChart3, TrendingUp } from 'lucide-react';

interface ClusterSummaryViewProps {
  data: CustomerRecord[];
  centroids: Centroid[];
}

export const ClusterSummaryView: React.FC<ClusterSummaryViewProps> = ({
  data,
  centroids
}) => {
  const clusters = Array.from(new Set(data.map(d => d.Cluster ?? 0))).sort((a, b) => a - b);

  const clusterPalette: Record<number, string> = {
    2: '#8b5cf6', // Target VIPs
    0: '#3b82f6', // Careful
    1: '#10b981', // Steady Middle
    3: '#f59e0b', // Trend Seekers
    4: '#ef4444', // Budget
  };

  const summaries = clusters.map(cId => {
    const subset = data.filter(d => d.Cluster === cId);
    const count = subset.length;
    const pct = ((count / data.length) * 100).toFixed(1);

    const avgAge = (subset.reduce((acc, d) => acc + d.Age, 0) / (count || 1)).toFixed(1);
    const avgIncome = (subset.reduce((acc, d) => acc + d['Annual Income (k$)'], 0) / (count || 1)).toFixed(1);
    const avgScore = (subset.reduce((acc, d) => acc + d['Spending Score (1-100)'], 0) / (count || 1)).toFixed(1);

    const femaleCount = subset.filter(d => d.Gender === 'Female').length;
    const femaleRatio = ((femaleCount / (count || 1)) * 100).toFixed(0);

    const profile = CLUSTER_PROFILES_CATALOG[cId];

    return {
      cId,
      name: profile?.name || `Segment ${cId}`,
      tag: profile?.tag || `Cluster ${cId}`,
      color: clusterPalette[cId] || '#64748b',
      count,
      pct,
      avgAge,
      avgIncome,
      avgScore,
      femaleRatio,
      priority: profile?.priority || 'Standard',
      strategy: profile?.strategy || 'Standard personalized retail marketing.'
    };
  });

  const maxCount = Math.max(...summaries.map(s => s.count), 1);

  return (
    <div className="space-y-5">
      {/* Visual Bar Chart: Customer Volume per Cohort */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 lg:p-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
          <div>
            <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
              Cohort Volume & Market Share Breakdown
            </h4>
            <p className="text-[11px] text-slate-400">
              Customer distribution across identified shopping archetypes.
            </p>
          </div>
          <span className="text-xs font-mono text-slate-400">Total: {data.length} Shoppers</span>
        </div>

        {/* Bar chart rows */}
        <div className="space-y-3">
          {summaries.map(item => (
            <div key={item.cId} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="font-semibold text-slate-200">{item.tag}</span>
                  <span className="text-slate-500 font-normal">({item.name})</span>
                </div>
                <div className="font-mono text-slate-300">
                  <strong className="text-white">{item.count}</strong> shoppers · {item.pct}%
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden border border-slate-800 flex">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${(item.count / maxCount) * 100}%`,
                    backgroundColor: item.color
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Per-Cluster Summary Metrics Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
          <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
            Per-Cluster Average Feature Metrics
          </h4>
          <span className="text-xs font-mono text-emerald-400">Aggregated Group Means</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-950 text-slate-400 font-mono border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-4">Segment Persona</th>
                <th className="py-2.5 px-3 text-right">Volume</th>
                <th className="py-2.5 px-3 text-right">Share (%)</th>
                <th className="py-2.5 px-3 text-right">Mean Age</th>
                <th className="py-2.5 px-3 text-right">Mean Income</th>
                <th className="py-2.5 px-3 text-right">Mean Spending</th>
                <th className="py-2.5 px-3 text-right">Female Ratio</th>
                <th className="py-2.5 px-3">Commercial Priority</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 font-mono text-slate-200">
              {summaries.map(item => (
                <tr key={item.cId} className="hover:bg-slate-800/40">
                  <td className="py-2.5 px-4 font-sans font-semibold">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-white">{item.tag}</span>
                    </div>
                  </td>
                  <td className="py-2.5 px-3 text-right tabular-nums">{item.count}</td>
                  <td className="py-2.5 px-3 text-right tabular-nums font-bold text-slate-300">
                    {item.pct}%
                  </td>
                  <td className="py-2.5 px-3 text-right tabular-nums">{item.avgAge} yrs</td>
                  <td className="py-2.5 px-3 text-right tabular-nums text-emerald-400">
                    ${item.avgIncome}k
                  </td>
                  <td className="py-2.5 px-3 text-right tabular-nums text-amber-400">
                    {item.avgScore} / 100
                  </td>
                  <td className="py-2.5 px-3 text-right tabular-nums text-pink-400">
                    {item.femaleRatio}%
                  </td>
                  <td className="py-2.5 px-3 font-sans">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        item.priority === 'High'
                          ? 'bg-purple-900/60 text-purple-300 border border-purple-500/30'
                          : item.priority === 'Medium'
                          ? 'bg-blue-900/60 text-blue-300 border border-blue-500/30'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {item.priority} Priority
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
