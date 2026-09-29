import React from 'react';
import { OptimalKMetric } from '../types/dataset';
import { HelpCircle, CheckCircle, TrendingDown, Target } from 'lucide-react';

interface OptimalKViewProps {
  metrics: OptimalKMetric[];
  selectedK: number;
  onSelectK: (k: number) => void;
}

export const OptimalKView: React.FC<OptimalKViewProps> = ({
  metrics,
  selectedK,
  onSelectK
}) => {
  const recommendedK = 5;

  const maxWcss = Math.max(...metrics.map(m => m.wcss), 1);
  const minWcss = Math.min(...metrics.map(m => m.wcss));

  const validSilhouettes = metrics.filter(m => m.silhouette !== null).map(m => m.silhouette as number);
  const maxSil = Math.max(...validSilhouettes, 0.6);
  const minSil = Math.min(...validSilhouettes, 0.2);

  return (
    <div className="space-y-5">
      {/* Step Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800 gap-2">
        <div>
          <span className="text-xs font-mono text-indigo-400">Step 3 of 7</span>
          <h3 className="text-lg font-bold text-white">Determining the Optimal Clusters (K)</h3>
          <p className="text-xs text-slate-400">
            Evaluating WCSS (Inertia) for $K \in [1, 10]$ and Silhouette Coefficients for $K \in [2, 10]$.
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-950/40 border border-emerald-500/30 rounded-lg text-emerald-300 text-xs font-medium">
          <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
          <span>Recommended Choice: <strong>K = {recommendedK}</strong></span>
        </div>
      </div>

      {/* Two Responsive SVG Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* 1. Elbow Method Curve */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
                1. Elbow Method (WCSS / Inertia)
              </h4>
              <p className="text-[11px] text-slate-400">Lower is denser; look for the distinct &quot;elbow&quot; bend.</p>
            </div>
            <span className="text-xs font-mono text-indigo-400">K = 1 to 10</span>
          </div>

          <div className="h-52 w-full pt-4">
            <svg className="w-full h-full overflow-visible" viewBox="0 0 450 180">
              {/* Gridlines */}
              {[0, 45, 90, 135, 170].map((y, idx) => (
                <line
                  key={idx}
                  x1="40"
                  y1={y}
                  x2="430"
                  y2={y}
                  stroke="#1e293b"
                  strokeWidth="1"
                  strokeDasharray="3 3"
                />
              ))}

              {/* Connecting Polyline */}
              <polyline
                fill="none"
                stroke="#6366f1"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={metrics
                  .map(m => {
                    const x = 50 + (m.k - 1) * ((420 - 50) / 9);
                    const y = 160 - ((m.wcss - minWcss) / (maxWcss - minWcss || 1)) * 130;
                    return `${x},${y}`;
                  })
                  .join(' ')}
              />

              {/* Elbow Vertical Marker at K=5 */}
              {(() => {
                const recX = 50 + (recommendedK - 1) * ((420 - 50) / 9);
                return (
                  <g>
                    <line
                      x1={recX}
                      y1="20"
                      x2={recX}
                      y2="160"
                      stroke="#ef4444"
                      strokeWidth="1.5"
                      strokeDasharray="4 3"
                    />
                    <text
                      x={recX}
                      y="15"
                      textAnchor="middle"
                      fill="#ef4444"
                      fontSize="10"
                      fontWeight="bold"
                    >
                      Elbow Point (K=5)
                    </text>
                  </g>
                );
              })()}

              {/* Data points */}
              {metrics.map(m => {
                const x = 50 + (m.k - 1) * ((420 - 50) / 9);
                const y = 160 - ((m.wcss - minWcss) / (maxWcss - minWcss || 1)) * 130;
                const isSelected = m.k === selectedK;
                const isRec = m.k === recommendedK;

                return (
                  <g
                    key={m.k}
                    className="cursor-pointer"
                    onClick={() => onSelectK(m.k)}
                  >
                    <circle
                      cx={x}
                      cy={y}
                      r={isSelected ? 6 : 4}
                      fill={isRec ? '#ef4444' : isSelected ? '#a855f7' : '#6366f1'}
                      stroke="#0f172a"
                      strokeWidth="2"
                    />
                    <text
                      x={x}
                      y="175"
                      textAnchor="middle"
                      fill={isSelected ? '#ffffff' : '#64748b'}
                      fontSize="10"
                      fontFamily="monospace"
                      fontWeight={isSelected ? 'bold' : 'normal'}
                    >
                      K={m.k}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
          <div className="text-[11px] text-slate-500 border-t border-slate-800 pt-2 flex justify-between">
            <span>WCSS: Sum of squared distances to centroids</span>
            <span className="text-indigo-400 font-mono">Inertia at K=5: {metrics.find(m => m.k === 5)?.wcss.toFixed(1)}</span>
          </div>
        </div>

        {/* 2. Silhouette Score Curve */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
                2. Silhouette Coefficient (K=2 to 10)
              </h4>
              <p className="text-[11px] text-slate-400">Higher values indicate cohesive, well-separated clusters.</p>
            </div>
            <span className="text-xs font-mono text-emerald-400">Score ∈ [-1, +1]</span>
          </div>

          <div className="h-52 w-full pt-4">
            <svg className="w-full h-full overflow-visible" viewBox="0 0 450 180">
              {/* Gridlines */}
              {[0, 45, 90, 135, 170].map((y, idx) => (
                <line
                  key={idx}
                  x1="40"
                  y1={y}
                  x2="430"
                  y2={y}
                  stroke="#1e293b"
                  strokeWidth="1"
                  strokeDasharray="3 3"
                />
              ))}

              {/* Connecting Polyline for Silhouette */}
              <polyline
                fill="none"
                stroke="#10b981"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={metrics
                  .filter(m => m.silhouette !== null)
                  .map(m => {
                    const x = 50 + (m.k - 2) * ((420 - 50) / 8);
                    const silVal = m.silhouette as number;
                    const y = 160 - ((silVal - minSil) / (maxSil - minSil || 1)) * 130;
                    return `${x},${y}`;
                  })
                  .join(' ')}
              />

              {/* Marker at K=5 */}
              {(() => {
                const recX = 50 + (recommendedK - 2) * ((420 - 50) / 8);
                return (
                  <g>
                    <line
                      x1={recX}
                      y1="20"
                      x2={recX}
                      y2="160"
                      stroke="#ef4444"
                      strokeWidth="1.5"
                      strokeDasharray="4 3"
                    />
                    <text
                      x={recX}
                      y="15"
                      textAnchor="middle"
                      fill="#ef4444"
                      fontSize="10"
                      fontWeight="bold"
                    >
                      Optimal K=5
                    </text>
                  </g>
                );
              })()}

              {/* Data points */}
              {metrics
                .filter(m => m.silhouette !== null)
                .map(m => {
                  const x = 50 + (m.k - 2) * ((420 - 50) / 8);
                  const silVal = m.silhouette as number;
                  const y = 160 - ((silVal - minSil) / (maxSil - minSil || 1)) * 130;
                  const isSelected = m.k === selectedK;
                  const isRec = m.k === recommendedK;

                  return (
                    <g
                      key={m.k}
                      className="cursor-pointer"
                      onClick={() => onSelectK(m.k)}
                    >
                      <circle
                        cx={x}
                        cy={y}
                        r={isSelected ? 6 : 4}
                        fill={isRec ? '#ef4444' : isSelected ? '#a855f7' : '#10b981'}
                        stroke="#0f172a"
                        strokeWidth="2"
                      />
                      <text
                        x={x}
                        y="175"
                        textAnchor="middle"
                        fill={isSelected ? '#ffffff' : '#64748b'}
                        fontSize="10"
                        fontFamily="monospace"
                        fontWeight={isSelected ? 'bold' : 'normal'}
                      >
                        K={m.k}
                      </text>
                    </g>
                  );
                })}
            </svg>
          </div>
          <div className="text-[11px] text-slate-500 border-t border-slate-800 pt-2 flex justify-between">
            <span>Silhouette: (b(i) - a(i)) / max(a(i), b(i))</span>
            <span className="text-emerald-400 font-mono">
              Score at K=5: {metrics.find(m => m.k === 5)?.silhouette?.toFixed(3)}
            </span>
          </div>
        </div>
      </div>

      {/* Justification Box & Metric Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Statistical & Business Justification Banner */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3 text-indigo-400">
              <Target className="w-4 h-4" />
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-200">
                Statistical & Business Justification for K = 5
              </h4>
            </div>

            <div className="space-y-3 text-xs text-slate-300">
              <div className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold shrink-0">1.</span>
                <p>
                  <strong>Elbow Method Inflection:</strong> Between $K=1$ and $K=5$, WCSS plunges steeply. Beyond $K=5$, the rate of variance explained levels off dramatically, indicating diminishing returns for adding further centroids.
                </p>
              </div>

              <div className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold shrink-0">2.</span>
                <p>
                  <strong>Silhouette Separation:</strong> The silhouette score for $K=5$ peaks at approximately <code className="font-mono text-emerald-300">0.55</code>, confirming that customers within each cluster are tightly grouped while separated by large margins from adjacent clusters.
                </p>
              </div>

              <div className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold shrink-0">3.</span>
                <p>
                  <strong>Actionable Retail Taxonomies:</strong> Five clusters neatly form the classic 2x2 income-versus-spending matrix plus a balanced center cohort: <em>Target VIPs, Careful Spenders, Trend Seekers, Budget Conscious, and Steady Middle</em>.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-400">Current active model cluster count:</span>
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-white bg-slate-800 px-2 py-0.5 rounded">
                K = {selectedK}
              </span>
              {selectedK !== 5 && (
                <button
                  onClick={() => onSelectK(5)}
                  className="text-xs text-indigo-400 hover:text-indigo-300 underline"
                >
                  Reset to recommended K=5
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Compact Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-800">
            <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Evaluation Metrics (K=1..10)
            </h4>
          </div>
          <div className="overflow-y-auto max-h-60">
            <table className="w-full text-xs text-left font-mono">
              <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 sticky top-0">
                <tr>
                  <th className="py-1.5 px-3">K</th>
                  <th className="py-1.5 px-3 text-right">WCSS</th>
                  <th className="py-1.5 px-3 text-right">Silhouette</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 text-slate-200">
                {metrics.map(m => (
                  <tr
                    key={m.k}
                    onClick={() => onSelectK(m.k)}
                    className={`cursor-pointer transition-colors ${
                      m.k === selectedK
                        ? 'bg-indigo-950/60 text-indigo-200'
                        : 'hover:bg-slate-800/40'
                    }`}
                  >
                    <td className="py-1.5 px-3 font-semibold">
                      {m.k} {m.k === 5 && '★'}
                    </td>
                    <td className="py-1.5 px-3 text-right tabular-nums">
                      {m.wcss.toFixed(1)}
                    </td>
                    <td className="py-1.5 px-3 text-right tabular-nums text-emerald-400">
                      {m.silhouette !== null ? m.silhouette.toFixed(3) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
