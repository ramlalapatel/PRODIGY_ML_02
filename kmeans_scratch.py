"""
K-Means Clustering from Scratch using NumPy
===========================================
A clean, modular, and beginner-friendly implementation of the K-Means algorithm
built purely with NumPy for educational and comparison purposes.

Algorithm steps:
1. Centroid Initialization (Random or K-Means++)
2. Expectation (Assignment): Compute Euclidean distance from each sample to all centroids,
   assign each sample to the nearest centroid.
3. Maximization (Update): Recalculate centroids as the mean of all assigned samples.
4. Convergence check: Stop when centroids change by less than `tol` or `max_iter` reached.
5. Compute WCSS / Inertia: Sum of squared Euclidean distances to assigned centroids.
"""

from typing import Optional, Tuple
import numpy as np


class KMeansScratch:
    """
    K-Means clustering implemented from scratch with NumPy.

    Parameters
    ----------
    n_clusters : int, default=5
        The number of clusters (K) to form.
    init : str, default='k-means++'
        Method for initialization: 'k-means++' or 'random'.
    max_iter : int, default=300
        Maximum number of iterations for a single run.
    tol : float, default=1e-4
        Relative tolerance to declare convergence.
    random_state : int or None, default=42
        Determines random number generation for centroid initialization.
    """

    def __init__(
        self,
        n_clusters: int = 5,
        init: str = "k-means++",
        max_iter: int = 300,
        tol: float = 1e-4,
        random_state: Optional[int] = 42,
    ):
        self.n_clusters = n_clusters
        self.init = init
        self.max_iter = max_iter
        self.tol = tol
        self.random_state = random_state

        self.cluster_centers_: Optional[np.ndarray] = None
        self.labels_: Optional[np.ndarray] = None
        self.inertia_: float = 0.0
        self.n_iter_: int = 0

    def _init_centroids(self, X: np.ndarray, rng: np.random.Generator) -> np.ndarray:
        """Initialize cluster centroids using random selection or k-means++."""
        n_samples, n_features = X.shape

        if self.init == "random":
            random_indices = rng.choice(n_samples, size=self.n_clusters, replace=False)
            return X[random_indices].copy()

        # K-Means++ Initialization
        # 1. Choose the first center uniformly at random from among the data points
        centroids = np.empty((self.n_clusters, n_features))
        first_idx = rng.choice(n_samples)
        centroids[0] = X[first_idx]

        # 2. For each subsequent center, choose point with probability proportional to D(x)^2
        for c_idx in range(1, self.n_clusters):
            # Distance from each point to closest already chosen centroid
            dists = np.min(
                np.sum((X[:, np.newaxis, :] - centroids[:c_idx]) ** 2, axis=2),
                axis=1,
            )
            # Prevent zero sum division if duplicate points exist
            dist_sum = np.sum(dists)
            probs = dists / dist_sum if dist_sum > 0 else np.ones(n_samples) / n_samples
            next_idx = rng.choice(n_samples, p=probs)
            centroids[c_idx] = X[next_idx]

        return centroids

    def _assign_clusters(self, X: np.ndarray, centroids: np.ndarray) -> np.ndarray:
        """
        Step 2: Assign each point to the closest centroid (Euclidean distance).
        Distance matrix shape: (n_samples, n_clusters)
        """
        # Shape: (n_samples, 1, n_features) - (1, n_clusters, n_features) -> (n_samples, n_clusters)
        distances = np.linalg.norm(X[:, np.newaxis, :] - centroids[np.newaxis, :, :], axis=2)
        return np.argmin(distances, axis=1)

    def _update_centroids(self, X: np.ndarray, labels: np.ndarray, prev_centroids: np.ndarray) -> np.ndarray:
        """
        Step 3: Update centroids by computing the mean of all points assigned to each cluster.
        If a cluster becomes empty, keep the previous centroid.
        """
        new_centroids = np.zeros_like(prev_centroids)
        for k in range(self.n_clusters):
            cluster_points = X[labels == k]
            if len(cluster_points) > 0:
                new_centroids[k] = np.mean(cluster_points, axis=0)
            else:
                new_centroids[k] = prev_centroids[k]
        return new_centroids

    def fit(self, X: np.ndarray) -> "KMeansScratch":
        """
        Compute k-means clustering.

        Parameters
        ----------
        X : array-like of shape (n_samples, n_features)
            Training data.
        """
        X = np.asarray(X, dtype=float)
        rng = np.random.default_rng(self.random_state)

        # 1. Initialize centroids
        centroids = self._init_centroids(X, rng)

        for iteration in range(self.max_iter):
            self.n_iter_ = iteration + 1

            # 2. Assignment Step
            labels = self._assign_clusters(X, centroids)

            # 3. Update Step
            new_centroids = self._update_centroids(X, labels, centroids)

            # 4. Check Convergence (Shift in centroids < tolerance)
            shift = np.max(np.linalg.norm(new_centroids - centroids, axis=1))
            centroids = new_centroids

            if shift < self.tol:
                break

        self.cluster_centers_ = centroids
        self.labels_ = self._assign_clusters(X, centroids)

        # 5. Compute WCSS / Inertia: Sum of squared distances to closest centroid
        distances_sq = np.sum((X - self.cluster_centers_[self.labels_]) ** 2)
        self.inertia_ = float(distances_sq)

        return self

    def predict(self, X: np.ndarray) -> np.ndarray:
        """Predict the closest cluster each sample in X belongs to."""
        if self.cluster_centers_ is None:
            raise ValueError("KMeansScratch has not been fitted yet. Call fit() first.")
        X = np.asarray(X, dtype=float)
        return self._assign_clusters(X, self.cluster_centers_)

    def fit_predict(self, X: np.ndarray) -> np.ndarray:
        """Fit K-Means and return assigned cluster labels."""
        self.fit(X)
        return self.labels_
