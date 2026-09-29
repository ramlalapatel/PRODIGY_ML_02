import React from 'react';
import { PredictionResult } from '../types/dataset';
import { CLUSTER_PROFILES_CATALOG } from '../data/mallCustomersData';
import { Sliders, Sparkles, Send, Target, ChevronRight } from 'lucide-react';

interface CustomerPredictorWidgetProps {
  age: number;
  income: number;
  spendingScore: number;
  gender: string;
  onAgeChange: (age: number) => void;
  onIncomeChange: (income: number) => void;
  onScoreChange: (score: number) => void;
  onGenderChange: (gender: string) => void;
  prediction: PredictionResult;
  onExportCsv: () => void;
}

export const CustomerPredictorWidget: React.FC<CustomerPredictorWidgetProps> = ({
  age,
  income,
  spendingScore,
  gender,
  onAgeChange,
  onIncomeChange,
  onScoreChange,
  onGenderChange,
  prediction,
  onExportCsv
}) => {
  const profile = prediction.cluster;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="pb-3 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <span className="text-xs font-mono text-indigo-400">Step 7 of 7 & Streamlit Simulator</span>
          <h3 className="text-lg font-bold text-white">
            Real-Time Customer Segmentation Predictor
          </h3>
          <p className="text-xs text-slate-400">
            Simulate an incoming shopper using interactive sliders to classify their persona in real-time.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Inference Function:</span>
          <code className="text-xs font-mono text-indigo-300 bg-slate-900 border border-slate-800 px-2 py-1 rounded">
            predict_segment({age}, {income}, {spendingScore})
          </code>
        </div>
      </div>

      {/* Simulator 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Interactive Sliders (45%) */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800 text-slate-200">
            <Sliders className="w-4 h-4 text-indigo-400" />
            <h4 className="text-xs font-semibold uppercase tracking-wider">
              Customer Attributes Input
            </h4>
          </div>

          {/* Gender Selector */}
          <div>
            <label className="text-xs font-medium text-slate-400 block mb-1.5">
              Customer Gender
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => onGenderChange('Female')}
                className={`py-2 text-xs font-medium rounded-lg border transition-colors ${
                  gender === 'Female'
                    ? 'bg-pink-950/60 border-pink-500/50 text-pink-300 font-semibold'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                Female (56% Mall Share)
              </button>
              <button
                type="button"
                onClick={() => onGenderChange('Male')}
                className={`py-2 text-xs font-medium rounded-lg border transition-colors ${
                  gender === 'Male'
                    ? 'bg-blue-950/60 border-blue-500/50 text-blue-300 font-semibold'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                Male (44% Mall Share)
              </button>
            </div>
          </div>

          {/* Age Slider */}
          <div>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-slate-300 font-medium">Customer Age</span>
              <span className="font-mono text-white font-bold bg-slate-800 px-2 py-0.5 rounded">
                {age} years
              </span>
            </div>
            <input
              type="range"
              min={18}
              max={70}
              value={age}
              onChange={e => onAgeChange(parseInt(e.target.value, 10))}
              className="w-full accent-indigo-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-0.5">
              <span>18 yrs</span>
              <span>Young Adult / Senior</span>
              <span>70 yrs</span>
            </div>
          </div>

          {/* Annual Income Slider */}
          <div>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-slate-300 font-medium">Annual Income</span>
              <span className="font-mono text-emerald-400 font-bold bg-slate-800 px-2 py-0.5 rounded">
                ${income}k / year
              </span>
            </div>
            <input
              type="range"
              min={10}
              max={140}
              value={income}
              onChange={e => onIncomeChange(parseInt(e.target.value, 10))}
              className="w-full accent-emerald-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-0.5">
              <span>$10k</span>
              <span>Median: $61.5k</span>
              <span>$140k</span>
            </div>
          </div>

          {/* Spending Score Slider */}
          <div>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-slate-300 font-medium">Spending Score (1-100)</span>
              <span className="font-mono text-amber-400 font-bold bg-slate-800 px-2 py-0.5 rounded">
                {spendingScore} / 100
              </span>
            </div>
            <input
              type="range"
              min={1}
              max={100}
              value={spendingScore}
              onChange={e => onScoreChange(parseInt(e.target.value, 10))}
              className="w-full accent-amber-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-0.5">
              <span>1 (Conservative)</span>
              <span>Avg: 50.2</span>
              <span>100 (Max Impulse)</span>
            </div>
          </div>

          {/* Quick Archetype Preset Buttons */}
          <div className="pt-3 border-t border-slate-800">
            <span className="text-[11px] font-semibold text-slate-400 block mb-2">
              Quick Customer Archetype Presets:
            </span>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <button
                type="button"
                onClick={() => { onAgeChange(32); onIncomeChange(85); onScoreChange(82); }}
                className="p-1.5 rounded bg-slate-950 hover:bg-slate-800 border border-slate-800 text-purple-300 text-left truncate"
              >
                ★ Target VIP ($85k, 82)
              </button>
              <button
                type="button"
                onClick={() => { onAgeChange(42); onIncomeChange(88); onScoreChange(17); }}
                className="p-1.5 rounded bg-slate-950 hover:bg-slate-800 border border-slate-800 text-blue-300 text-left truncate"
              >
                ★ Careful Saver ($88k, 17)
              </button>
              <button
                type="button"
                onClick={() => { onAgeChange(24); onIncomeChange(25); onScoreChange(80); }}
                className="p-1.5 rounded bg-slate-950 hover:bg-slate-800 border border-slate-800 text-amber-300 text-left truncate"
              >
                ★ Trend Seeker ($25k, 80)
              </button>
              <button
                type="button"
                onClick={() => { onAgeChange(50); onIncomeChange(55); onScoreChange(49); }}
                className="p-1.5 rounded bg-slate-950 hover:bg-slate-800 border border-slate-800 text-emerald-300 text-left truncate"
              >
                ★ Steady Middle ($55k, 49)
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Prediction Output Card & Centroid Distance Ranking (55%) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Main Persona Result Card */}
          <div className={`rounded-xl border p-5 bg-slate-900 ${profile.borderTint}`}>
            <div className="flex items-center justify-between mb-3">
              <span className={`text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-950 border border-slate-800 ${profile.textColor}`}>
                Predicted Cohort: Cluster {prediction.clusterId}
              </span>
              <span className="text-xs font-mono text-slate-400">
                Confidence Affinity: {prediction.distances[0]?.percentage}%
              </span>
            </div>

            <h3 className="text-xl font-bold text-white mb-1">
              {profile.tag}
            </h3>
            <div className="text-xs font-semibold text-slate-300 mb-3">
              {profile.name}
            </div>

            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              {profile.description}
            </p>

            {/* Actionable Strategy Playbook */}
            <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 space-y-1.5 mb-4">
              <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5" />
                <span>Recommended Omnichannel Retail Action</span>
              </div>
              <p className="text-xs text-slate-100 font-medium leading-relaxed">
                {profile.strategy}
              </p>
            </div>

            {/* Channels */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] uppercase font-semibold text-slate-500">
                Deployment Channels:
              </span>
              {profile.channels.map((ch, idx) => (
                <span
                  key={idx}
                  className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono"
                >
                  {ch}
                </span>
              ))}
            </div>
          </div>

          {/* Centroid Distance Ranking Breakdown */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Centroid Euclidean Distance Ranking
            </h4>
            <div className="space-y-2">
              {prediction.distances.map((item, idx) => {
                const targetProfile = CLUSTER_PROFILES_CATALOG[item.clusterId];
                const isWinner = idx === 0;

                return (
                  <div key={item.clusterId} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 w-48">
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: targetProfile?.color || '#6366f1' }}
                      />
                      <span className={`truncate ${isWinner ? 'text-white font-bold' : 'text-slate-400'}`}>
                        {targetProfile?.tag || `Cluster ${item.clusterId}`}
                      </span>
                    </div>

                    <div className="flex-1 mx-3 h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${item.percentage}%`,
                          backgroundColor: targetProfile?.color || '#6366f1'
                        }}
                      />
                    </div>

                    <div className="w-24 text-right font-mono text-xs">
                      <span className={isWinner ? 'text-emerald-400 font-bold' : 'text-slate-400'}>
                        d = {item.distance}
                      </span>
                      <span className="text-slate-500 ml-1">({item.percentage}%)</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
