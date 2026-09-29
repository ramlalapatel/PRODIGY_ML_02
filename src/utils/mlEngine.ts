import { CustomerRecord, SummaryStatistics, OptimalKMetric, Centroid, PredictionResult } from '../types/dataset';
import { CLUSTER_PROFILES_CATALOG } from '../data/mallCustomersData';

export class StandardScalerJS {
  means: number[] = [];
  stds: number[] = [];

  fit(data: number[][]): this {
    const numFeatures = data[0].length;
    const n = data.length;

    this.means = new Array(numFeatures).fill(0);
    this.stds = new Array(numFeatures).fill(0);

    for (let j = 0; j < numFeatures; j++) {
      let sum = 0;
      for (let i = 0; i < n; i++) {
        sum += data[i][j];
      }
      this.means[j] = sum / n;

      let varianceSum = 0;
      for (let i = 0; i < n; i++) {
        const diff = data[i][j] - this.means[j];
        varianceSum += diff * diff;
      }
      this.stds[j] = Math.sqrt(varianceSum / n) || 1e-7;
    }
    return this;
  }

  transform(data: number[][]): number[][] {
    return data.map(row =>
      row.map((val, colIdx) => (val - this.means[colIdx]) / this.stds[colIdx])
    );
  }

  fitTransform(data: number[][]): number[][] {
    this.fit(data);
    return this.transform(data);
  }

  inverseTransform(data: number[][]): number[][] {
    return data.map(row =>
      row.map((val, colIdx) => val * this.stds[colIdx] + this.means[colIdx])
    );
  }
}

export function euclideanDistance(a: number[], b: number[]): number {
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    const diff = a[i] - b[i];
    sum += diff * diff;
  }
  return Math.sqrt(sum);
}

export class KMeansEngine {
  k: number;
  maxIter: number;
  tol: number;
  randomSeed: number;

  centroids: number[][] = [];
  labels: number[] = [];
  inertia: number = 0;
  iterations: number = 0;

  constructor(k: number = 5, maxIter: number = 300, tol: number = 1e-4, seed: number = 42) {
    this.k = k;
    this.maxIter = maxIter;
    this.tol = tol;
    this.randomSeed = seed;
  }

  // Pseudo-random generator for reproducible initialization
  private pseudoRandom(seed: number): () => number {
    let s = seed % 2147483647;
    if (s <= 0) s += 2147483646;
    return () => {
      s = (s * 16807) % 2147483647;
      return (s - 1) / 2147483646;
    };
  }

  private initKMeansPlusPlus(X: number[][]): number[][] {
    const n = X.length;
    const rng = this.pseudoRandom(this.randomSeed);
    const centers: number[][] = [];

    // 1. Choose first center at random
    const firstIdx = Math.floor(rng() * n);
    centers.push([...X[firstIdx]]);

    // 2. Choose remaining centers with probability proportional to D(x)^2
    while (centers.length < this.k) {
      const distSq: number[] = [];
      let totalDistSq = 0;

      for (let i = 0; i < n; i++) {
        let minDistSq = Infinity;
        for (const c of centers) {
          const d = euclideanDistance(X[i], c);
          const dSq = d * d;
          if (dSq < minDistSq) minDistSq = dSq;
        }
        distSq.push(minDistSq);
        totalDistSq += minDistSq;
      }

      // Sample next center
      let target = rng() * totalDistSq;
      let chosenIdx = 0;
      for (let i = 0; i < n; i++) {
        target -= distSq[i];
        if (target <= 0) {
          chosenIdx = i;
          break;
        }
      }
      centers.push([...X[chosenIdx]]);
    }
    return centers;
  }

  fit(X: number[][]): this {
    const n = X.length;
    const numFeatures = X[0].length;
    this.centroids = this.initKMeansPlusPlus(X);

    for (let it = 0; it < this.maxIter; it++) {
      this.iterations = it + 1;

      // Assignment Step
      const newLabels = new Array(n).fill(0);
      for (let i = 0; i < n; i++) {
        let minD = Infinity;
        let bestK = 0;
        for (let k = 0; k < this.k; k++) {
          const d = euclideanDistance(X[i], this.centroids[k]);
          if (d < minD) {
            minD = d;
            bestK = k;
          }
        }
        newLabels[i] = bestK;
      }

      // Update Step: Mean of points per cluster
      const counts = new Array(this.k).fill(0);
      const sums = Array.from({ length: this.k }, () => new Array(numFeatures).fill(0));

      for (let i = 0; i < n; i++) {
        const cluster = newLabels[i];
        counts[cluster]++;
        for (let f = 0; f < numFeatures; f++) {
          sums[cluster][f] += X[i][f];
        }
      }

      const nextCentroids: number[][] = [];
      let maxShift = 0;

      for (let k = 0; k < this.k; k++) {
        const center = new Array(numFeatures).fill(0);
        if (counts[k] > 0) {
          for (let f = 0; f < numFeatures; f++) {
            center[f] = sums[k][f] / counts[k];
          }
        } else {
          // If empty cluster, retain previous
          center.splice(0, numFeatures, ...this.centroids[k]);
        }

        const shift = euclideanDistance(center, this.centroids[k]);
        if (shift > maxShift) maxShift = shift;
        nextCentroids.push(center);
      }

      this.centroids = nextCentroids;
      this.labels = newLabels;

      if (maxShift < this.tol) {
        break;
      }
    }

    // Compute Inertia / WCSS
    let totalInertia = 0;
    for (let i = 0; i < n; i++) {
      const assigned = this.centroids[this.labels[i]];
      const d = euclideanDistance(X[i], assigned);
      totalInertia += d * d;
    }
    this.inertia = totalInertia;

    return this;
  }

  predict(point: number[]): number {
    let minD = Infinity;
    let bestK = 0;
    for (let k = 0; k < this.k; k++) {
      const d = euclideanDistance(point, this.centroids[k]);
      if (d < minD) {
        minD = d;
        bestK = k;
      }
    }
    return bestK;
  }
}

// Compute Silhouette Score for clustering validation
export function computeSilhouetteScore(X: number[][], labels: number[], k: number): number {
  if (k <= 1 || k >= X.length) return 0;
  const n = X.length;

  const clusterIndices: number[][] = Array.from({ length: k }, () => []);
  for (let i = 0; i < n; i++) {
    clusterIndices[labels[i]].push(i);
  }

  let totalSilhouette = 0;

  for (let i = 0; i < n; i++) {
    const ownCluster = labels[i];
    const ownMembers = clusterIndices[ownCluster];

    // a(i): average distance to points in same cluster
    let a_i = 0;
    if (ownMembers.length > 1) {
      let sumSame = 0;
      for (const idx of ownMembers) {
        if (idx !== i) {
          sumSame += euclideanDistance(X[i], X[idx]);
        }
      }
      a_i = sumSame / (ownMembers.length - 1);
    }

    // b(i): minimum average distance to points in any other cluster
    let b_i = Infinity;
    for (let otherK = 0; otherK < k; otherK++) {
      if (otherK === ownCluster) continue;
      const otherMembers = clusterIndices[otherK];
      if (otherMembers.length === 0) continue;

      let sumOther = 0;
      for (const idx of otherMembers) {
        sumOther += euclideanDistance(X[i], X[idx]);
      }
      const avgOther = sumOther / otherMembers.length;
      if (avgOther < b_i) {
        b_i = avgOther;
      }
    }

    if (b_i === Infinity) b_i = 0;

    const maxVal = Math.max(a_i, b_i);
    const s_i = maxVal === 0 ? 0 : (b_i - a_i) / maxVal;
    totalSilhouette += s_i;
  }

  return totalSilhouette / n;
}

// Compute Optimal K Metrics (WCSS & Silhouette for K=1 to 10)
export function computeOptimalKMetrics(X_scaled: number[][]): OptimalKMetric[] {
  const results: OptimalKMetric[] = [];

  for (let k = 1; k <= 10; k++) {
    const km = new KMeansEngine(k, 200, 1e-4, 42);
    km.fit(X_scaled);
    const wcss = km.inertia;
    const sil = k >= 2 ? computeSilhouetteScore(X_scaled, km.labels, k) : null;
    results.push({ k, wcss, silhouette: sil });
  }

  return results;
}

// Calculate Summary Statistics for numerical columns
export function calculateSummaryStatistics(values: number[]): SummaryStatistics {
  const sorted = [...values].sort((a, b) => a - b);
  const n = sorted.length;
  if (n === 0) {
    return { count: 0, mean: 0, std: 0, min: 0, p25: 0, p50: 0, p75: 0, max: 0 };
  }

  const sum = sorted.reduce((acc, v) => acc + v, 0);
  const mean = sum / n;

  const variance = sorted.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / n;
  const std = Math.sqrt(variance);

  const quantile = (q: number) => {
    const pos = (n - 1) * q;
    const base = Math.floor(pos);
    const rest = pos - base;
    if (sorted[base + 1] !== undefined) {
      return sorted[base] + rest * (sorted[base + 1] - sorted[base]);
    } else {
      return sorted[base];
    }
  };

  return {
    count: n,
    mean: Number(mean.toFixed(2)),
    std: Number(std.toFixed(2)),
    min: sorted[0],
    p25: Number(quantile(0.25).toFixed(2)),
    p50: Number(quantile(0.50).toFixed(2)),
    p75: Number(quantile(0.75).toFixed(2)),
    max: sorted[n - 1]
  };
}

// Map raw cluster indices to canonical retail personas based on centroid values
export function alignClustersToPersonas(
  records: CustomerRecord[],
  centroidsUnscaled: number[][],
  labels: number[],
  is3D: boolean
): { enrichedRecords: CustomerRecord[]; remappedCentroids: Centroid[]; personaMapping: Record<number, number> } {
  // Identify which centroid corresponds to which persona
  // Features: [Income, Score] (2D) or [Age, Income, Score] (3D)
  const incIdx = is3D ? 1 : 0;
  const scoreIdx = is3D ? 2 : 1;

  const mapping: Record<number, number> = {};

  centroidsUnscaled.forEach((center, rawK) => {
    const inc = center[incIdx];
    const score = center[scoreIdx];

    if (inc > 65 && score > 60) {
      mapping[rawK] = 2; // Target VIPs
    } else if (inc > 65 && score <= 60) {
      mapping[rawK] = 0; // Careful Spenders
    } else if (inc <= 45 && score > 60) {
      mapping[rawK] = 3; // Trend Seekers
    } else if (inc <= 45 && score <= 60) {
      mapping[rawK] = 4; // Budget Conscious
    } else {
      mapping[rawK] = 1; // Steady Middle
    }
  });

  const enrichedRecords: CustomerRecord[] = records.map((rec, i) => {
    const rawK = labels[i];
    const mappedK = mapping[rawK] ?? rawK;
    const profile = CLUSTER_PROFILES_CATALOG[mappedK] || {
      id: mappedK,
      name: `Segment ${mappedK}`,
      tag: `Cluster ${mappedK}`
    };

    return {
      ...rec,
      Cluster: mappedK,
      Cluster_Name: profile.name,
      Cluster_Tag: profile.tag
    };
  });

  const remappedCentroids: Centroid[] = centroidsUnscaled.map((center, rawK) => ({
    kIndex: mapping[rawK] ?? rawK,
    income: Number(center[incIdx].toFixed(1)),
    spendingScore: Number(center[scoreIdx].toFixed(1)),
    age: is3D ? Number(center[0].toFixed(1)) : undefined
  }));

  return { enrichedRecords, remappedCentroids, personaMapping: mapping };
}

// Predict segment for a new customer
export function predictCustomerSegment(
  age: number,
  income: number,
  spendingScore: number,
  scaler: StandardScalerJS,
  kmeans: KMeansEngine,
  is3D: boolean,
  mapping: Record<number, number>
): PredictionResult {
  const rawPoint = is3D ? [age, income, spendingScore] : [income, spendingScore];
  const scaledPoint = scaler.transform([rawPoint])[0];

  const distances: { clusterId: number; distance: number; percentage: number }[] = [];
  let minDist = Infinity;
  let rawAssignedK = 0;
  let sumInvDist = 0;

  for (let k = 0; k < kmeans.k; k++) {
    const d = euclideanDistance(scaledPoint, kmeans.centroids[k]);
    const inv = 1 / (d + 0.001);
    sumInvDist += inv;
    if (d < minDist) {
      minDist = d;
      rawAssignedK = k;
    }
    const mappedK = mapping[k] ?? k;
    distances.push({ clusterId: mappedK, distance: Number(d.toFixed(3)), percentage: 0 });
  }

  // Calculate similarity probabilities
  distances.forEach(item => {
    const inv = 1 / (item.distance + 0.001);
    item.percentage = Number(((inv / sumInvDist) * 100).toFixed(1));
  });

  const finalClusterId = mapping[rawAssignedK] ?? rawAssignedK;
  const profile = CLUSTER_PROFILES_CATALOG[finalClusterId] || {
    id: finalClusterId,
    name: `Cluster ${finalClusterId}`,
    tag: `Cluster ${finalClusterId}`,
    color: '#6366f1',
    bgTint: 'bg-indigo-950/40',
    borderTint: 'border-indigo-500/30',
    textColor: 'text-indigo-300',
    description: 'General consumer cohort.',
    strategy: 'Engage with customized communications.',
    channels: ['Direct Email', 'Mobile Notification'],
    priority: 'Standard',
    targetAudience: 'General shopper'
  };

  return {
    clusterId: finalClusterId,
    cluster: profile,
    distances: distances.sort((a, b) => a.distance - b.distance),
    scaledCoordinates: scaledPoint
  };
}
