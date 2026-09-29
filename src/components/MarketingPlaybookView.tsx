import React from 'react';
import { CLUSTER_PROFILES_CATALOG } from '../data/mallCustomersData';
import { CustomerRecord } from '../types/dataset';
import { Target, Sparkles, Shield, ShoppingBag, DollarSign, ArrowUpRight } from 'lucide-react';

interface MarketingPlaybookViewProps {
  data: CustomerRecord[];
}

export const MarketingPlaybookView: React.FC<MarketingPlaybookViewProps> = ({ data }) => {
  const clusterOrder = [2, 0, 1, 3, 4];

  const iconMap: Record<number, React.ReactNode> = {
    2: <Sparkles className="w-5 h-5 text-purple-400" />,
    0: <Shield className="w-5 h-5 text-blue-400" />,
    1: <ShoppingBag className="w-5 h-5 text-emerald-400" />,
    3: <ArrowUpRight className="w-5 h-5 text-amber-400" />,
    4: <DollarSign className="w-5 h-5 text-rose-400" />
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="pb-3 border-b border-slate-800">
        <span className="text-xs font-mono text-indigo-400">Step 6 of 7</span>
        <h3 className="text-lg font-bold text-white">
          Retail Cluster Interpretation & Actionable Marketing Playbook
        </h3>
        <p className="text-xs text-slate-400">
          Tailored omnichannel marketing strategies mapped to each shopper cohort to maximize conversion and LTV.
        </p>
      </div>

      {/* 5 Archetype Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {clusterOrder.map(cId => {
          const profile = CLUSTER_PROFILES_CATALOG[cId];
          const cohortData = data.filter(d => d.Cluster === cId);
          const count = cohortData.length;
          const share = ((count / data.length) * 100).toFixed(1);

          return (
            <div
              key={cId}
              className={`rounded-xl border p-5 flex flex-col justify-between transition-all duration-200 hover:border-slate-600 bg-slate-900/90 ${profile.borderTint}`}
            >
              <div>
                {/* Header Lockup */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
                      {iconMap[cId]}
                    </div>
                    <div>
                      <span className={`text-[10px] font-bold uppercase tracking-wider ${profile.textColor}`}>
                        Cluster {cId} · {profile.priority} Priority
                      </span>
                      <h4 className="text-sm font-bold text-white leading-tight">
                        {profile.tag}
                      </h4>
                    </div>
                  </div>
                  <span className="text-xs font-mono text-slate-400">
                    {share}%
                  </span>
                </div>

                {/* Full Persona Name */}
                <div className="text-xs font-semibold text-slate-300 mb-2">
                  {profile.name}
                </div>

                {/* Behavioral Description */}
                <p className="text-xs text-slate-400 leading-relaxed mb-4">
                  {profile.description}
                </p>

                {/* Recommended Marketing Playbook */}
                <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800/80 mb-4 space-y-1.5">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                    <Target className="w-3 h-3" />
                    <span>Targeted Marketing Strategy</span>
                  </div>
                  <p className="text-xs text-slate-200 leading-snug font-medium">
                    {profile.strategy}
                  </p>
                </div>
              </div>

              {/* Communication Channels & Footer */}
              <div className="pt-3 border-t border-slate-800/80 space-y-2">
                <div className="text-[10px] uppercase font-semibold text-slate-500">
                  Recommended Channels:
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {profile.channels.map((ch, idx) => (
                    <span
                      key={idx}
                      className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-medium"
                    >
                      {ch}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
