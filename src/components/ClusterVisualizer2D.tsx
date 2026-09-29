import React, { useState } from 'react';
import { CustomerRecord, Centroid, ClusterInfo } from '../types/dataset';
import { CLUSTER_PROFILES_CATALOG } from '../data/mallCustomersData';
import { Crosshair, Info, ZoomIn } from 'lucide-react';

interface ClusterVisualizer2DProps {
  data: CustomerRecord[];
  centroids: Centroid[];
  highlightCustomer?: { income: number; spendingScore: number; age?: number } | null;
}

export const ClusterVisualizer2D: React.FC<ClusterVisualizer2DProps> = ({
  data,
  centroids,
  highlightCustomer
}) => {
  const [selectedClusterFilter, setSelectedClusterFilter] = useState<number | null>(null);
  const [hoveredCustomer, setHoveredCustomer] = useState<CustomerRecord | null>(null);

  // Bounds
  const minIncome = 10;
  const maxIncome = 140;
  const minScore = 0;
  const maxScore = 100;

  // SVG viewBox coordinates
  const svgWidth = 600;
  const svgHeight = 400;
  const padding = { top: 30, right: 30, bottom: 50, left: 60 };

  const plotWidth = svgWidth - padding.left - padding.right;
  const plotHeight = svgHeight - padding.top - padding.bottom;

  const scaleX = (income: number) => {
    return padding.left + ((income - minIncome) / (maxIncome - minIncome)) * plotWidth;
  };

  const scaleY = (score: number) => {
    return padding.top + (1 - (score - minScore) / (maxScore - minScore)) * plotHeight;
  };

  const filteredData = selectedClusterFilter !== null
    ? data.filter(d => d.Cluster === selectedClusterFilter)
    : data;

  const clusterPalette: Record<number, string> = {
    2: '#8b5cf6', // Target VIPs (Purple)
    0: '#3b82f6', // Careful (Blue)
    1: '#10b981', // Steady Middle (Green)
    3: '#f59e0b', // Trend Seekers (Amber)
    4: '#ef4444', // Budget (Red)
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 lg:p-5 flex flex-col justify-between">
      {/* Header & Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800 gap-3">
        <div>
          <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
            2D Cluster Space: Annual Income vs. Spending Score
          </h4>
          <p className="text-[11px] text-slate-400">
            Hover over customer data points to inspect details; click legend tags to filter.
          </p>
        </div>

        {/* Legend / Filter Chips */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setSelectedClusterFilter(null)}
            className={`px-2 py-1 text-[11px] font-medium rounded transition-colors ${
              selectedClusterFilter === null
                ? 'bg-slate-700 text-white font-semibold'
                : 'text-slate-400 hover:text-slate-200 bg-slate-950'
            }`}
          >
            All Segments ({data.length})
          </button>
          {[2, 0, 1, 3, 4].map(cId => {
            const profile = CLUSTER_PROFILES_CATALOG[cId];
            const isSelected = selectedClusterFilter === cId;
            const count = data.filter(d => d.Cluster === cId).length;
            return (
              <button
                key={cId}
                onClick={() => setSelectedClusterFilter(isSelected ? null : cId)}
                className={`flex items-center gap-1.5 px-2 py-1 text-[11px] font-medium rounded transition-colors ${
                  isSelected
                    ? 'ring-1 ring-white/60 bg-slate-800 text-white font-semibold'
                    : 'text-slate-400 hover:text-slate-200 bg-slate-950'
                }`}
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: profile?.color || '#6366f1' }}
                />
                <span>{profile?.tag || `C${cId}`}</span>
                <span className="text-[10px] text-slate-500 font-mono">({count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* SVG Canvas Area */}
      <div className="relative w-full h-[360px] lg:h-[420px] my-2 select-none">
        <svg
          className="w-full h-full"
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Background & Grid */}
          <rect
            x={padding.left}
            y={padding.top}
            width={plotWidth}
            height={plotHeight}
            fill="#090d16"
            rx="4"
          />

          {/* Grid lines */}
          {[20, 40, 60, 80, 100, 120].map(inc => {
            const x = scaleX(inc);
            return (
              <g key={`x-${inc}`}>
                <line
                  x1={x}
                  y1={padding.top}
                  x2={x}
                  y2={padding.top + plotHeight}
                  stroke="#1e293b"
                  strokeWidth="1"
                  strokeDasharray="2 2"
                />
                <text
                  x={x}
                  y={svgHeight - 25}
                  textAnchor="middle"
                  fill="#64748b"
                  fontSize="10"
                  fontFamily="monospace"
                >
                  ${inc}k
                </text>
              </g>
            );
          })}

          {[0, 20, 40, 60, 80, 100].map(sc => {
            const y = scaleY(sc);
            return (
              <g key={`y-${sc}`}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={padding.left + plotWidth}
                  y2={y}
                  stroke="#1e293b"
                  strokeWidth="1"
                  strokeDasharray="2 2"
                />
                <text
                  x={padding.left - 10}
                  y={y + 3}
                  textAnchor="end"
                  fill="#64748b"
                  fontSize="10"
                  fontFamily="monospace"
                >
                  {sc}
                </text>
              </g>
            );
          })}

          {/* Axis Labels */}
          <text
            x={padding.left + plotWidth / 2}
            y={svgHeight - 8}
            textAnchor="middle"
            fill="#94a3b8"
            fontSize="11"
            fontWeight="600"
          >
            Annual Income (k$)
          </text>
          <text
            x={-(padding.top + plotHeight / 2)}
            y={18}
            transform="rotate(-90)"
            textAnchor="middle"
            fill="#94a3b8"
            fontSize="11"
            fontWeight="600"
          >
            Spending Score (1-100)
          </text>

          {/* Customer Scatter Data Points */}
          {filteredData.map(cust => {
            const cx = scaleX(cust['Annual Income (k$)']);
            const cy = scaleY(cust['Spending Score (1-100)']);
            const color = clusterPalette[cust.Cluster ?? 0] || '#94a3b8';
            const isHovered = hoveredCustomer?.CustomerID === cust.CustomerID;

            return (
              <circle
                key={cust.CustomerID}
                cx={cx}
                cy={cy}
                r={isHovered ? 7 : 4.5}
                fill={color}
                fillOpacity={isHovered ? 1 : 0.8}
                stroke={isHovered ? '#ffffff' : '#020617'}
                strokeWidth={isHovered ? 2 : 0.8}
                className="cursor-pointer transition-all duration-150"
                onMouseEnter={() => setHoveredCustomer(cust)}
                onMouseLeave={() => setHoveredCustomer(null)}
              />
            );
          })}

          {/* Centroid Crosshair Markers */}
          {centroids.map((center, idx) => {
            const cx = scaleX(center.income);
            const cy = scaleY(center.spendingScore);
            const color = clusterPalette[center.kIndex] || '#ffffff';

            return (
              <g key={`centroid-${idx}`} className="select-none pointer-events-none">
                {/* Glow ring */}
                <circle
                  cx={cx}
                  cy={cy}
                  r={12}
                  fill="none"
                  stroke={color}
                  strokeWidth="1.5"
                  strokeOpacity="0.4"
                  strokeDasharray="2 2"
                />
                {/* Center marker */}
                <circle cx={cx} cy={cy} r={5} fill="#ffffff" stroke="#000000" strokeWidth="2" />
                <path
                  d={`M ${cx - 7} ${cy} L ${cx + 7} ${cy} M ${cx} ${cy - 7} L ${cx} ${cy + 7}`}
                  stroke="#000000"
                  strokeWidth="2.2"
                />
                <path
                  d={`M ${cx - 7} ${cy} L ${cx + 7} ${cy} M ${cx} ${cy - 7} L ${cx} ${cy + 7}`}
                  stroke={color}
                  strokeWidth="1.2"
                />
                {/* Tag label */}
                <text
                  x={cx}
                  y={cy - 12}
                  textAnchor="middle"
                  fill="#ffffff"
                  fontSize="9"
                  fontFamily="monospace"
                  fontWeight="bold"
                >
                  μ{center.kIndex} (${center.income}k, {center.spendingScore})
                </text>
              </g>
            );
          })}

          {/* Highlight Customer (from Real-time Predictor) */}
          {highlightCustomer && (
            <g className="animate-pulse">
              <circle
                cx={scaleX(highlightCustomer.income)}
                cy={scaleY(highlightCustomer.spendingScore)}
                r={16}
                fill="#ffffff"
                fillOpacity="0.2"
                stroke="#60a5fa"
                strokeWidth="2"
                strokeDasharray="4 2"
              />
              <circle
                cx={scaleX(highlightCustomer.income)}
                cy={scaleY(highlightCustomer.spendingScore)}
                r={7}
                fill="#38bdf8"
                stroke="#ffffff"
                strokeWidth="2.5"
              />
              <text
                x={scaleX(highlightCustomer.income)}
                y={scaleY(highlightCustomer.spendingScore) + 24}
                textAnchor="middle"
                fill="#38bdf8"
                fontSize="11"
                fontFamily="monospace"
                fontWeight="bold"
              >
                ● Live Input (${highlightCustomer.income}k, {highlightCustomer.spendingScore})
              </text>
            </g>
          )}
        </svg>

        {/* Hover Tooltip Overlay */}
        {hoveredCustomer && (
          <div
            className="absolute z-20 pointer-events-none bg-slate-950/95 border border-slate-700 rounded-lg p-2.5 shadow-xl text-xs text-slate-200"
            style={{
              left: `${Math.min(Math.max(scaleX(hoveredCustomer['Annual Income (k$)']) / (svgWidth / 100), 10), 80)}%`,
              top: `${Math.min(Math.max(scaleY(hoveredCustomer['Spending Score (1-100)']) / (svgHeight / 100), 10), 75)}%`
            }}
          >
            <div className="flex items-center gap-1.5 font-bold mb-1">
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: clusterPalette[hoveredCustomer.Cluster ?? 0] }}
              />
              <span>{hoveredCustomer.Cluster_Tag || `Cluster ${hoveredCustomer.Cluster}`}</span>
            </div>
            <div className="font-mono text-[11px] text-slate-300 space-y-0.5">
              <div>Customer #{hoveredCustomer.CustomerID} · {hoveredCustomer.Gender}, Age {hoveredCustomer.Age}</div>
              <div>Income: <strong className="text-emerald-400">${hoveredCustomer['Annual Income (k$)']}k</strong></div>
              <div>Spending Score: <strong className="text-amber-400">{hoveredCustomer['Spending Score (1-100)']} / 100</strong></div>
            </div>
          </div>
        )}
      </div>

      {/* Footer Notes */}
      <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-500 border-t border-slate-800 pt-2">
        <div className="flex items-center gap-2">
          <Crosshair className="w-3.5 h-3.5 text-slate-400" />
          <span>Centroid crosshairs marked with coordinates (unscaled)</span>
        </div>
        <span>Displaying {filteredData.length} of {data.length} customer records</span>
      </div>
    </div>
  );
};
