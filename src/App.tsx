import React, { useState, useMemo } from 'react';
import { CustomerRecord, Centroid, OptimalKMetric, PredictionResult } from './types/dataset';
import { RAW_MALL_CUSTOMERS, CLUSTER_PROFILES_CATALOG } from './data/mallCustomersData';
import {
  StandardScalerJS,
  KMeansEngine,
  computeOptimalKMetrics,
  alignClustersToPersonas,
  predictCustomerSegment
} from './utils/mlEngine';

import { TopBar, ActiveTab } from './components/TopBar';
import { DatasetUploader } from './components/DatasetUploader';
import { DataExplorationView } from './components/DataExplorationView';
import { PreprocessingView } from './components/PreprocessingView';
import { OptimalKView } from './components/OptimalKView';
import { ScratchBenchmarkView } from './components/ScratchBenchmarkView';
import { ClusterVisualizer2D } from './components/ClusterVisualizer2D';
import { ClusterVisualizer3D } from './components/ClusterVisualizer3D';
import { ClusterSummaryView } from './components/ClusterSummaryView';
import { MarketingPlaybookView } from './components/MarketingPlaybookView';
import { CustomerPredictorWidget } from './components/CustomerPredictorWidget';
import { CodeAndFilesHub } from './components/CodeAndFilesHub';
import { DatasetBrowserView } from './components/DatasetBrowserView';
import { GitHubModal } from './components/GitHubModal';
import { Globe, Copy, Check, ExternalLink } from 'lucide-react';

const LIVE_APP_URL = 'https://ais-pre-m6ged3numqdvjurljbj4m7-5834640671.asia-southeast1.run.app';

export default function App() {
  // Application State
  const [data, setData] = useState<CustomerRecord[]>(RAW_MALL_CUSTOMERS);
  const [sourceName, setSourceName] = useState<string>('Mall_Customers.csv');
  const [isCustomData, setIsCustomData] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<ActiveTab>('pipeline');
  const [isGitHubModalOpen, setIsGitHubModalOpen] = useState<boolean>(false);
  const [bannerCopied, setBannerCopied] = useState<boolean>(false);

  // Model Hyperparameters
  const [is3D, setIs3D] = useState<boolean>(false);
  const [kValue, setKValue] = useState<number>(5);

  // Real-Time Simulator Inputs
  const [predAge, setPredAge] = useState<number>(32);
  const [predIncome, setPredIncome] = useState<number>(85);
  const [predScore, setPredScore] = useState<number>(82);
  const [predGender, setPredGender] = useState<string>('Female');

  // Compute Scaled Feature Matrix
  const { X_raw, featureCols } = useMemo(() => {
    const cols = is3D
      ? ['Age', 'Annual Income (k$)', 'Spending Score (1-100)']
      : ['Annual Income (k$)', 'Spending Score (1-100)'];

    const raw = data.map(d =>
      is3D
        ? [d.Age, d['Annual Income (k$)'], d['Spending Score (1-100)']]
        : [d['Annual Income (k$)'], d['Spending Score (1-100)']]
    );

    return { X_raw: raw, featureCols: cols };
  }, [data, is3D]);

  // Scaler
  const scaler = useMemo(() => {
    const sc = new StandardScalerJS();
    sc.fit(X_raw);
    return sc;
  }, [X_raw]);

  // Scaled Coordinates
  const X_scaled = useMemo(() => {
    return scaler.transform(X_raw);
  }, [scaler, X_raw]);

  // KMeans Model
  const kmeansModel = useMemo(() => {
    const km = new KMeansEngine(kValue, 300, 1e-4, 42);
    km.fit(X_scaled);
    return km;
  }, [kValue, X_scaled]);

  // Unscaled Centroid Coordinates & Persona Alignment
  const { enrichedData, centroids, personaMapping } = useMemo(() => {
    const unscaledCenters = scaler.inverseTransform(kmeansModel.centroids);
    const { enrichedRecords, remappedCentroids, personaMapping: mapping } = alignClustersToPersonas(
      data,
      unscaledCenters,
      kmeansModel.labels,
      is3D
    );
    return {
      enrichedData: enrichedRecords,
      centroids: remappedCentroids,
      personaMapping: mapping
    };
  }, [data, scaler, kmeansModel, is3D]);

  // Optimal K Evaluation Metrics (WCSS & Silhouette for K=1..10)
  const optimalKMetrics: OptimalKMetric[] = useMemo(() => {
    return computeOptimalKMetrics(X_scaled);
  }, [X_scaled]);

  // Real-Time Simulated Customer Prediction
  const livePrediction: PredictionResult = useMemo(() => {
    return predictCustomerSegment(
      predAge,
      predIncome,
      predScore,
      scaler,
      kmeansModel,
      is3D,
      personaMapping
    );
  }, [predAge, predIncome, predScore, scaler, kmeansModel, is3D, personaMapping]);

  // Handlers
  const handleDataLoaded = (uploadedData: CustomerRecord[], name: string) => {
    setData(uploadedData);
    setSourceName(name);
    setIsCustomData(true);
  };

  const handleResetDefault = () => {
    setData(RAW_MALL_CUSTOMERS);
    setSourceName('Mall_Customers.csv');
    setIsCustomData(false);
  };

  // Export Clustered CSV
  const handleExportCsv = () => {
    const headers = ['CustomerID', 'Gender', 'Age', 'Annual Income (k$)', 'Spending Score (1-100)', 'Cluster', 'Cluster_Name', 'Cluster_Tag'];
    const rows = enrichedData.map(d => [
      d.CustomerID,
      d.Gender,
      d.Age,
      d['Annual Income (k$)'],
      d['Spending Score (1-100)'],
      d.Cluster,
      `"${d.Cluster_Name || ''}"`,
      `"${d.Cluster_Tag || ''}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'customer_segments.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Download complete project files bundle
  const handleDownloadProjectZip = () => {
    // Navigate to code tab to download files
    setActiveTab('code');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* 3-Zone Compliant Top Navigation Bar */}
      <TopBar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onExportCsv={handleExportCsv}
        onDownloadProject={() => setActiveTab('code')}
        onOpenGitHubModal={() => setIsGitHubModalOpen(true)}
        totalCustomers={data.length}
      />

      {/* Main Workspace Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {/* Live GitHub Banner */}
        <div className="mb-4 bg-gradient-to-r from-indigo-950/70 via-slate-900 to-indigo-950/40 border border-indigo-500/30 rounded-xl p-3 px-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-sm">
          <div className="flex items-center gap-2.5">
            <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-slate-300 font-medium">
              Live Hosted App URL:
            </span>
            <a
              href={LIVE_APP_URL}
              target="_blank"
              rel="noreferrer"
              className="font-mono text-indigo-300 hover:text-indigo-200 underline underline-offset-2 truncate max-w-xs sm:max-w-md"
            >
              {LIVE_APP_URL}
            </a>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => {
                navigator.clipboard.writeText(LIVE_APP_URL);
                setBannerCopied(true);
                setTimeout(() => setBannerCopied(false), 2000);
              }}
              className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-indigo-900/60 hover:bg-indigo-900 border border-indigo-500/40 text-indigo-200 font-medium transition-colors"
            >
              {bannerCopied ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{bannerCopied ? 'Link Copied!' : 'Copy Link'}</span>
            </button>

            <button
              onClick={() => setIsGitHubModalOpen(true)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-white font-medium transition-colors"
            >
              <span>GitHub Instructions</span>
            </button>
          </div>
        </div>

        {/* Global Dataset Toolbar & Hyperparameter Bar */}
        <DatasetUploader
          onDataLoaded={handleDataLoaded}
          onResetDefault={handleResetDefault}
          isCustomData={isCustomData}
          sourceName={sourceName}
          is3D={is3D}
          onToggle3D={setIs3D}
          kValue={kValue}
          onKChange={setKValue}
        />

        {/* View Switcher Routing */}
        {activeTab === 'pipeline' && (
          <div className="space-y-12">
            {/* Step 1: EDA */}
            <section id="step-1">
              <DataExplorationView data={enrichedData} />
            </section>

            {/* Step 2: Preprocessing & Scaling */}
            <section id="step-2">
              <PreprocessingView
                data={enrichedData}
                is3D={is3D}
                onToggle3D={setIs3D}
                scaler={scaler}
              />
            </section>

            {/* Step 3: Finding Optimal K */}
            <section id="step-3">
              <OptimalKView
                metrics={optimalKMetrics}
                selectedK={kValue}
                onSelectK={setKValue}
              />
            </section>

            {/* Step 4: Scratch vs Sklearn Benchmark */}
            <section id="step-4">
              <ScratchBenchmarkView
                scaledData={X_scaled}
                k={kValue}
              />
            </section>

            {/* Step 5: Visualizations & Profiles */}
            <section id="step-5" className="space-y-6">
              <div className="pb-3 border-b border-slate-800">
                <span className="text-xs font-mono text-indigo-400">Step 5 of 7</span>
                <h3 className="text-lg font-bold text-white">Cluster Visualizations</h3>
                <p className="text-xs text-slate-400">
                  Interactive 2D and 3D spatial models representing customer groupings.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ClusterVisualizer2D
                  data={enrichedData}
                  centroids={centroids}
                  highlightCustomer={{
                    income: predIncome,
                    spendingScore: predScore,
                    age: predAge
                  }}
                />
                <ClusterVisualizer3D
                  data={enrichedData}
                  centroids={centroids}
                  highlightCustomer={{
                    income: predIncome,
                    spendingScore: predScore,
                    age: predAge
                  }}
                />
              </div>

              {/* Cluster Size & Group Averages */}
              <ClusterSummaryView data={enrichedData} centroids={centroids} />
            </section>

            {/* Step 6: Marketing Playbook */}
            <section id="step-6">
              <MarketingPlaybookView data={enrichedData} />
            </section>

            {/* Step 7: Streamlit Simulator & Inference */}
            <section id="step-7">
              <CustomerPredictorWidget
                age={predAge}
                income={predIncome}
                spendingScore={predScore}
                gender={predGender}
                onAgeChange={setPredAge}
                onIncomeChange={setPredIncome}
                onScoreChange={setPredScore}
                onGenderChange={setPredGender}
                prediction={livePrediction}
                onExportCsv={handleExportCsv}
              />
            </section>
          </div>
        )}

        {/* Tab 2: Visualizer Dedicated View */}
        {activeTab === 'visuals' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ClusterVisualizer2D
                data={enrichedData}
                centroids={centroids}
                highlightCustomer={{
                  income: predIncome,
                  spendingScore: predScore,
                  age: predAge
                }}
              />
              <ClusterVisualizer3D
                data={enrichedData}
                centroids={centroids}
                highlightCustomer={{
                  income: predIncome,
                  spendingScore: predScore,
                  age: predAge
                }}
              />
            </div>
            <ClusterSummaryView data={enrichedData} centroids={centroids} />
          </div>
        )}

        {/* Tab 3: Streamlit Simulator View */}
        {activeTab === 'simulator' && (
          <div className="space-y-6">
            <CustomerPredictorWidget
              age={predAge}
              income={predIncome}
              spendingScore={predScore}
              gender={predGender}
              onAgeChange={setPredAge}
              onIncomeChange={setPredIncome}
              onScoreChange={setPredScore}
              onGenderChange={setPredGender}
              prediction={livePrediction}
              onExportCsv={handleExportCsv}
            />

            {/* Accompanying Live 2D & 3D Visualizer */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4 border-t border-slate-800">
              <ClusterVisualizer2D
                data={enrichedData}
                centroids={centroids}
                highlightCustomer={{
                  income: predIncome,
                  spendingScore: predScore,
                  age: predAge
                }}
              />
              <ClusterVisualizer3D
                data={enrichedData}
                centroids={centroids}
                highlightCustomer={{
                  income: predIncome,
                  spendingScore: predScore,
                  age: predAge
                }}
              />
            </div>
          </div>
        )}

        {/* Tab 4: Marketing Playbook View */}
        {activeTab === 'playbook' && (
          <MarketingPlaybookView data={enrichedData} />
        )}

        {/* Tab 5: NumPy Scratch Benchmark */}
        {activeTab === 'scratch' && (
          <ScratchBenchmarkView scaledData={X_scaled} k={kValue} />
        )}

        {/* Tab 6: Code & Files Hub */}
        {activeTab === 'code' && (
          <CodeAndFilesHub onDownloadProjectZip={handleDownloadProjectZip} />
        )}

        {/* Tab 7: Dataset Browser */}
        {activeTab === 'dataset' && (
          <DatasetBrowserView data={enrichedData} onExportCsv={handleExportCsv} />
        )}
      </main>

      {/* Subtle Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 px-4 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            Retail Customer Segmentation Studio · K-Means Clustering Pipeline
          </div>
          <div className="flex items-center gap-4 text-slate-400 font-mono text-[11px]">
            <span>Kaggle Mall Customers</span>
            <span>·</span>
            <span>Scikit-Learn & NumPy</span>
            <span>·</span>
            <span>StandardScaler (z-score)</span>
          </div>
        </div>
      </footer>

      {/* GitHub Setup & Live Link Modal */}
      <GitHubModal
        isOpen={isGitHubModalOpen}
        onClose={() => setIsGitHubModalOpen(false)}
        liveUrl={LIVE_APP_URL}
      />
    </div>
  );
}
