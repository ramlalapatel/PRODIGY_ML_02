export interface CustomerRecord {
  CustomerID: number;
  Gender: 'Male' | 'Female' | string;
  Age: number;
  'Annual Income (k$)': number;
  'Spending Score (1-100)': number;
  Cluster?: number;
  Cluster_Name?: string;
  Cluster_Tag?: string;
}

export interface ClusterInfo {
  id: number;
  name: string;
  tag: string;
  color: string;
  bgTint: string;
  borderTint: string;
  textColor: string;
  description: string;
  strategy: string;
  channels: string[];
  priority: 'High' | 'Medium' | 'Standard';
  targetAudience: string;
}

export interface SummaryStatistics {
  count: number;
  mean: number;
  std: number;
  min: number;
  p25: number;
  p50: number;
  p75: number;
  max: number;
}

export interface OptimalKMetric {
  k: number;
  wcss: number;
  silhouette: number | null;
}

export interface Centroid {
  kIndex: number;
  income: number;
  spendingScore: number;
  age?: number;
}

export interface PredictionResult {
  clusterId: number;
  cluster: ClusterInfo;
  distances: { clusterId: number; distance: number; percentage: number }[];
  scaledCoordinates: number[];
}
