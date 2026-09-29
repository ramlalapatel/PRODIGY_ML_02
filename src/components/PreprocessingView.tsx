import React from 'react';
import { CustomerRecord } from '../types/dataset';
import { StandardScalerJS } from '../utils/mlEngine';
import { CheckCircle2, ArrowRight } from 'lucide-react';

interface PreprocessingViewProps {
  data: CustomerRecord[];
  is3D: boolean;
  onToggle3D: (val: boolean) => void;
  scaler: StandardScalerJS;
}

export const PreprocessingView: React.FC<PreprocessingViewProps> = ({
  data,
  is3D,
  onToggle3D,
  scaler
}) => {
  const sampleRows = data.slice(0, 5);

  const featureCols = is3D
    ? ['Age', 'Annual Income (k$)', 'Spending Score (1-100)']
    : ['Annual Income (k$)', 'Spending Score (1-100)'];

  // Unscaled and scaled sample values
  const unscaledSample = sampleRows.map(r =>
    is3D ? [r.Age, r['Annual Income (k$)'], r['Spending Score (1-100)']] : [r['Annual Income (k$)'], r['Spending Score (1-100)']]
  );
  const scaledSample = scaler.transform(unscaledSample);

  return (
    <div className="space-y-5">
      {/* Step Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800 gap-2">
        <div>
          <span className="text-xs font-mono text-indigo-400">Step 2 of 7</span>
          <h3 className="text-lg font-bold text-white">Data Preprocessing & Feature Scaling</h3>
          <p className="text-xs text-slate-400">
            Feature pruning, categorical encoding, and standard z-score normalization.
          </p>
        </div>

        {/* Feature Mode Toggle */}
        <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-lg self-start sm:self-auto">
          <button
            onClick={() => onToggle3D(false)}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              !is3D ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Primary 2D (Income + Score)
          </button>
          <button
            onClick={() => onToggle3D(true)}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              is3D ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Extended 3D (Age + Income + Score)
          </button>
        </div>
      </div>

      {/* 3 Step Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Step A: Drop CustomerID */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
                1. Prune Non-Informative IDs
              </h4>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              <code className="text-pink-400 font-mono">CustomerID</code> is an incremental database primary key. It carries zero predictive purchase signal and would distort Euclidean distance if retained.
            </p>
          </div>
          <div className="mt-3 p-2 bg-slate-950 rounded-lg font-mono text-[11px] text-slate-400 border border-slate-800/80">
            df.drop(columns=[&quot;CustomerID&quot;], inplace=True)
          </div>
        </div>

        {/* Step B: Encode Gender */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
                2. Categorical Gender Encoding
              </h4>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              K-Means requires numerical vector inputs. Gender is encoded via <code className="text-indigo-300 font-mono">LabelEncoder</code> into binary flags:
            </p>
            <div className="flex gap-4 mt-2 text-xs font-mono">
              <span className="text-pink-400">Female: 0</span>
              <span className="text-blue-400">Male: 1</span>
            </div>
          </div>
          <div className="mt-3 p-2 bg-slate-950 rounded-lg font-mono text-[11px] text-slate-400 border border-slate-800/80">
            df[&quot;Gender_Code&quot;] = LabelEncoder().fit_transform(df[&quot;Gender&quot;])
          </div>
        </div>

        {/* Step C: StandardScaler */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
                3. StandardScaler Normalization
              </h4>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Standardizes features so mean $\mu = 0$ and standard deviation $\sigma = 1$:
            </p>
            <div className="my-2 py-1 px-2.5 bg-slate-950 rounded text-center font-mono text-xs text-indigo-300 border border-slate-800">
              z = (x - μ) / σ
            </div>
          </div>
          <div className="mt-2 p-2 bg-slate-950 rounded-lg font-mono text-[11px] text-slate-400 border border-slate-800/80">
            X_scaled = StandardScaler().fit_transform(X)
          </div>
        </div>
      </div>

      {/* Raw vs Scaled Table Comparison */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
          <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
            Raw Features vs. Scaled Z-Scores (First 5 Customers)
          </h4>
          <span className="text-xs font-mono text-slate-500">
            {is3D ? '3 Features (Age, Income, Score)' : '2 Features (Income, Score)'}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-950 text-slate-400 font-mono border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-4">CustID</th>
                {featureCols.map(col => (
                  <th key={col} className="py-2.5 px-3 text-right">
                    Raw {col.split(' ')[0]}
                  </th>
                ))}
                <th className="py-2.5 px-2 text-center text-slate-600">→</th>
                {featureCols.map(col => (
                  <th key={col} className="py-2.5 px-3 text-right text-indigo-400">
                    Scaled z_{col.split(' ')[0].toLowerCase()}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 font-mono text-slate-200">
              {sampleRows.map((row, idx) => (
                <tr key={row.CustomerID} className="hover:bg-slate-800/40">
                  <td className="py-2 px-4 text-slate-400">#{row.CustomerID}</td>
                  {unscaledSample[idx].map((val, cIdx) => (
                    <td key={cIdx} className="py-2 px-3 text-right tabular-nums">
                      {val}
                    </td>
                  ))}
                  <td className="py-2 px-2 text-center text-slate-600 font-sans">
                    <ArrowRight className="w-3.5 h-3.5 mx-auto" />
                  </td>
                  {scaledSample[idx].map((val, cIdx) => (
                    <td key={cIdx} className="py-2 px-3 text-right tabular-nums text-indigo-300">
                      {val >= 0 ? `+${val.toFixed(3)}` : val.toFixed(3)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
