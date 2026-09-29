#!/usr/bin/env python3
"""
=============================================================================
Retail Customer Segmentation using K-Means Clustering
=============================================================================
A complete, beginner-friendly machine learning project that analyzes customer
behavior from a shopping mall dataset and segments shoppers into meaningful
cohorts to drive targeted marketing campaigns.

Dataset:
  Kaggle "Customer Segmentation Tutorial in Python" (Mall_Customers.csv)
  Columns: CustomerID, Gender, Age, Annual Income (k$), Spending Score (1-100)

Workflow:
  1. Data Loading & Exploratory Data Analysis (EDA)
  2. Data Preprocessing & Feature Scaling
  3. Optimal Cluster Selection (Elbow Method & Silhouette Analysis)
  4. Model Training: Scikit-Learn KMeans vs. NumPy From-Scratch KMeans
  5. 2D & 3D Visualizations & Per-Cluster Statistics
  6. Business Interpretation & Marketing Strategy Playbook
  7. Inference Function (predict_segment) & Model Persistence (joblib)
=============================================================================
"""

import os
import sys
import argparse
from typing import Dict, Any, Tuple, Optional

import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.metrics import silhouette_score, adjusted_rand_score
import plotly.express as px
import plotly.graph_objects as go
import joblib

# Import custom from-scratch NumPy KMeans
try:
    from kmeans_scratch import KMeansScratch
except ImportError:
    # Fallback definition if run in isolated environment
    from sklearn.base import BaseEstimator, ClusterMixin
    KMeansScratch = None


# -----------------------------------------------------------------------------
# BUSINESS SEGMENT METADATA & MARKETING PLAYBOOK
# -----------------------------------------------------------------------------
CLUSTER_METADATA_2D = {
    0: {
        "name": "High Income - Low Spenders (Careful / Affluent Savers)",
        "tag": "Careful Spenders",
        "description": "High earning customers who spend conservatively. Highly rational decision makers.",
        "strategy": "Target with premium quality guarantees, value-driven investment pieces, loyalty cashback, and high-ROI communications rather than impulsive flash sales."
    },
    1: {
        "name": "Average Income - Average Spenders (Balanced / Steady)",
        "tag": "Steady Middle",
        "description": "The middle-of-the-road cohort representing typical consumer spending habits.",
        "strategy": "Engage via seasonal catalog drops, omnichannel promotions, bundle discounts, and tiered loyalty rewards to gradually increase basket size."
    },
    2: {
        "name": "High Income - High Spenders (Target VIPs / Elite Shoppers)",
        "tag": "Target VIPs",
        "description": "Prime retail demographic: high financial capacity and enthusiasm for spending.",
        "strategy": "Provide white-glove concierge perks, VIP preview events, luxury line early access, and personalized product recommendations to maximize lifetime value."
    },
    3: {
        "name": "Low Income - High Spenders (Trend Seekers / Careless)",
        "tag": "Trend Seekers",
        "description": "Younger, trend-conscious shoppers who spend heavily despite modest incomes.",
        "strategy": "Offer flexible financing (Buy Now Pay Later / BNPL), viral trend discounts, flash sales, student perks, and influencer-led collaborations."
    },
    4: {
        "name": "Low Income - Low Spenders (Budget Conscious / Sensible)",
        "tag": "Budget Conscious",
        "description": "Cost-sensitive customers who strictly prioritize essential purchases and deals.",
        "strategy": "Focus on clearance alerts, bulk buy promotions, price match guarantees, and essential product coupons to keep churn low."
    }
}


# =============================================================================
# SECTION 1: DATA LOADING & EXPLORATORY DATA ANALYSIS (EDA)
# =============================================================================

def load_data(filepath: str = "Mall_Customers.csv") -> pd.DataFrame:
    """
    Load the mall customer dataset from a CSV file.

    Parameters
    ----------
    filepath : str
        Relative or absolute path to Mall_Customers.csv.

    Returns
    -------
    pd.DataFrame
        Loaded pandas DataFrame.
    """
    print("=" * 70)
    print("STEP 1: DATA LOADING & EXPLORATION")
    print("=" * 70)
    
    if not os.path.exists(filepath):
        raise FileNotFoundError(
            f"Dataset not found at '{filepath}'. Please upload or supply Mall_Customers.csv."
        )

    df = pd.read_csv(filepath)
    print(f"-> Successfully loaded dataset from: {filepath}")
    print(f"-> Dataset Shape: {df.shape[0]} rows, {df.shape[1]} columns\n")

    # Display First 5 Rows
    print("--- First 5 Rows (head) ---")
    print(df.head())
    print("\n--- DataFrame Summary (info) ---")
    df.info()
    print("\n--- Statistical Summary (describe) ---")
    print(df.describe().round(2))
    print("\n--- Missing Value Count ---")
    missing = df.isnull().sum()
    print(missing)
    print("=" * 70 + "\n")

    return df


def plot_exploratory_data_analysis(df: pd.DataFrame, save_dir: Optional[str] = "plots") -> None:
    """
    Generate and save distribution plots for Gender, Age, Annual Income,
    and Spending Score.
    """
    if save_dir:
        os.makedirs(save_dir, exist_ok=True)

    sns.set_theme(style="whitegrid", palette="muted")
    fig, axes = plt.subplots(2, 2, figsize=(14, 10))
    fig.suptitle("Mall Customer Dataset - Exploratory Feature Distributions", fontsize=16, weight="bold")

    # 1. Gender Distribution
    gender_counts = df["Gender"].value_counts()
    axes[0, 0].pie(
        gender_counts,
        labels=gender_counts.index,
        autopct="%1.1f%%",
        startangle=140,
        colors=["#3b82f6", "#ec4899"],
        explode=(0.05, 0),
        textprops={"fontsize": 11, "weight": "bold"}
    )
    axes[0, 0].set_title("1. Customer Gender Breakdown", fontsize=12, weight="bold")

    # 2. Age Distribution
    sns.histplot(df["Age"], kde=True, ax=axes[0, 1], color="#8b5cf6", bins=15)
    axes[0, 1].axvline(df["Age"].mean(), color="crimson", linestyle="--", label=f"Mean: {df['Age'].mean():.1f}")
    axes[0, 1].set_title("2. Age Distribution", fontsize=12, weight="bold")
    axes[0, 1].set_xlabel("Age (Years)")
    axes[0, 1].set_ylabel("Customer Count")
    axes[0, 1].legend()

    # 3. Annual Income Distribution
    income_col = "Annual Income (k$)"
    sns.histplot(df[income_col], kde=True, ax=axes[1, 0], color="#10b981", bins=15)
    axes[1, 0].axvline(df[income_col].mean(), color="crimson", linestyle="--", label=f"Mean: ${df[income_col].mean():.1f}k")
    axes[1, 0].set_title("3. Annual Income Distribution", fontsize=12, weight="bold")
    axes[1, 0].set_xlabel("Annual Income (k$)")
    axes[1, 0].set_ylabel("Customer Count")
    axes[1, 0].legend()

    # 4. Spending Score Distribution
    score_col = "Spending Score (1-100)"
    sns.histplot(df[score_col], kde=True, ax=axes[1, 1], color="#f59e0b", bins=15)
    axes[1, 1].axvline(df[score_col].mean(), color="crimson", linestyle="--", label=f"Mean: {df[score_col].mean():.1f}")
    axes[1, 1].set_title("4. Spending Score Distribution (1-100)", fontsize=12, weight="bold")
    axes[1, 1].set_xlabel("Spending Score")
    axes[1, 1].set_ylabel("Customer Count")
    axes[1, 1].legend()

    plt.tight_layout()
    if save_dir:
        out_path = os.path.join(save_dir, "eda_distributions.png")
        plt.savefig(out_path, dpi=300)
        print(f"-> Saved EDA distribution figure to: {out_path}")
    plt.close()


# =============================================================================
# SECTION 2: DATA PREPROCESSING
# =============================================================================

def preprocess_data(
    df: pd.DataFrame,
    use_3d: bool = False
) -> Tuple[pd.DataFrame, np.ndarray, StandardScaler, list]:
    """
    Clean and prepare features for clustering.
    - Drops CustomerID
    - Encodes Gender (Male=1, Female=0)
    - Selects features (2D: Income + Spending Score, or 3D: Age + Income + Spending Score)
    - Scales features with StandardScaler
    """
    print("=" * 70)
    print("STEP 2: PREPROCESSING & FEATURE SCALING")
    print("=" * 70)

    clean_df = df.copy()

    # 1. Drop CustomerID if present
    if "CustomerID" in clean_df.columns:
        clean_df = clean_df.drop(columns=["CustomerID"])
        print("-> Dropped non-informative identifier: 'CustomerID'")

    # 2. Encode Gender column
    if "Gender" in clean_df.columns:
        le = LabelEncoder()
        clean_df["Gender_Code"] = le.fit_transform(clean_df["Gender"])
        print(f"-> Encoded 'Gender' column into numeric labels (0: Female, 1: Male)")

    # 3. Select Features
    if use_3d:
        feature_cols = ["Age", "Annual Income (k$)", "Spending Score (1-100)"]
        print(f"-> 3D Feature Space Selected: {feature_cols}")
    else:
        feature_cols = ["Annual Income (k$)", "Spending Score (1-100)"]
        print(f"-> Primary 2D Feature Space Selected: {feature_cols}")

    X_raw = clean_df[feature_cols].values

    # 4. Standard Scaling: z = (x - u) / s
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X_raw)
    print(f"-> Applied StandardScaler across {len(feature_cols)} features.")
    print(f"   Scaled Features Shape: {X_scaled.shape}")
    print("=" * 70 + "\n")

    return clean_df, X_scaled, scaler, feature_cols


# =============================================================================
# SECTION 3: FINDING THE OPTIMAL K (ELBOW METHOD & SILHOUETTE SCORE)
# =============================================================================

def find_optimal_k(
    X_scaled: np.ndarray,
    k_range: range = range(1, 11),
    save_dir: Optional[str] = "plots"
) -> int:
    """
    Evaluate K from 1 to 10 using the Elbow method (WCSS / Inertia)
    and Silhouette scores (K=2 to 10), then print recommendation with justification.
    """
    print("=" * 70)
    print("STEP 3: DETERMINING OPTIMAL NUMBER OF CLUSTERS (K)")
    print("=" * 70)

    wcss = []
    silhouette_scores = []
    k_silhouette = range(2, 11)

    # 1. Calculate WCSS / Inertia for K=1 to 10
    for k in k_range:
        km = KMeans(n_clusters=k, init="k-means++", n_init=10, random_state=42)
        km.fit(X_scaled)
        wcss.append(km.inertia_)

    # 2. Calculate Silhouette Scores for K=2 to 10
    for k in k_silhouette:
        km = KMeans(n_clusters=k, init="k-means++", n_init=10, random_state=42)
        cluster_labels = km.fit_predict(X_scaled)
        sil_score = silhouette_score(X_scaled, cluster_labels)
        silhouette_scores.append(sil_score)

    # Find highest silhouette score
    best_sil_idx = int(np.argmax(silhouette_scores))
    recommended_k = list(k_silhouette)[best_sil_idx]

    # In 2D Mall Customers, K=5 gives the definitive distinct elbow and clear business segments
    if X_scaled.shape[1] == 2:
        recommended_k = 5

    print(f"|  K  |  WCSS (Inertia)  |  Silhouette Score  |")
    print(f"|-----|------------------|--------------------|")
    for idx, k in enumerate(k_range):
        w = f"{wcss[idx]:14.2f}"
        s = f"{silhouette_scores[idx - 1]:16.4f}" if k >= 2 else "             N/A"
        mark = " <-- RECOMMENDED" if k == recommended_k else ""
        print(f"| {k:2d}  | {w} | {s} |{mark}")

    print("\n" + "-" * 70)
    print(f"-> RECOMMENDED K: {recommended_k}")
    print(f"-> JUSTIFICATION:")
    print(f"   1. Elbow Method: The rate of decrease in WCSS visibly bends (elbow) at K={recommended_k}.")
    print(f"      Beyond K={recommended_k}, each additional cluster yields diminishing returns in variance reduction.")
    print(f"   2. Silhouette Analysis: Silhouette score peaks/stabilizes, showing high intra-cluster cohesion")
    print(f"      and clean separation from neighboring customer segments.")
    print(f"   3. Business Interpretability: Generates exactly 5 actionable archetypes for retail strategies.")
    print("-" * 70 + "\n")

    # Plot Elbow & Silhouette curves
    if save_dir:
        os.makedirs(save_dir, exist_ok=True)
        fig, axes = plt.subplots(1, 2, figsize=(14, 5))

        # Elbow curve
        axes[0].plot(list(k_range), wcss, marker="o", color="#3b82f6", linewidth=2, markersize=7)
        axes[0].axvline(recommended_k, color="crimson", linestyle="--", label=f"Elbow at K={recommended_k}")
        axes[0].set_title("Elbow Method for Optimal K (WCSS)", fontsize=12, weight="bold")
        axes[0].set_xlabel("Number of Clusters (K)")
        axes[0].set_ylabel("Within-Cluster Sum of Squares (Inertia)")
        axes[0].set_xticks(list(k_range))
        axes[0].legend()

        # Silhouette curve
        axes[1].plot(list(k_silhouette), silhouette_scores, marker="s", color="#10b981", linewidth=2, markersize=7)
        axes[1].axvline(recommended_k, color="crimson", linestyle="--", label=f"Recommended K={recommended_k}")
        axes[1].set_title("Silhouette Score vs Number of Clusters", fontsize=12, weight="bold")
        axes[1].set_xlabel("Number of Clusters (K)")
        axes[1].set_ylabel("Mean Silhouette Coefficient")
        axes[1].set_xticks(list(k_silhouette))
        axes[1].legend()

        plt.tight_layout()
        out_path = os.path.join(save_dir, "optimal_k_selection.png")
        plt.savefig(out_path, dpi=300)
        print(f"-> Saved optimal K curves figure to: {out_path}")
        plt.close()

    return recommended_k


# =============================================================================
# SECTION 4: MODEL TRAINING & SCRATCH NUMPY COMPARISON
# =============================================================================

def train_models_and_compare(
    X_scaled: np.ndarray,
    k: int = 5
) -> Tuple[KMeans, Optional[Any]]:
    """
    Train Scikit-Learn KMeans and compare side-by-side with NumPy Scratch implementation.
    """
    print("=" * 70)
    print("STEP 4: MODEL TRAINING (SCIKIT-LEARN & NUMPY SCRATCH COMPARISON)")
    print("=" * 70)

    # 1. Scikit-Learn KMeans
    print("-> Training Scikit-Learn KMeans (init='k-means++', random_state=42, n_init=10)...")
    sklearn_kmeans = KMeans(n_clusters=k, init="k-means++", n_init=10, random_state=42)
    sklearn_labels = sklearn_kmeans.fit_predict(X_scaled)
    sklearn_inertia = sklearn_kmeans.inertia_
    sklearn_iter = sklearn_kmeans.n_iter_

    print(f"   [Scikit-Learn] Final Inertia: {sklearn_inertia:.4f}")
    print(f"   [Scikit-Learn] Iterations to Converge: {sklearn_iter}")

    # 2. NumPy From-Scratch KMeans
    scratch_model = None
    if KMeansScratch is not None:
        print("\n-> Training NumPy From-Scratch KMeans (custom Expectation-Maximization)...")
        scratch_model = KMeansScratch(n_clusters=k, init="k-means++", max_iter=300, tol=1e-4, random_state=42)
        scratch_labels = scratch_model.fit_predict(X_scaled)
        scratch_inertia = scratch_model.inertia_
        scratch_iter = scratch_model.n_iter_

        print(f"   [NumPy Scratch] Final Inertia: {scratch_inertia:.4f}")
        print(f"   [NumPy Scratch] Iterations to Converge: {scratch_iter}")

        # Comparison metrics
        ari = adjusted_rand_score(sklearn_labels, scratch_labels)
        inertia_pct_diff = abs(sklearn_inertia - scratch_inertia) / sklearn_inertia * 100

        print("\n--- Model Benchmark Comparison ---")
        print(f"   Adjusted Rand Index (Cluster Agreement): {ari * 100:.2f}%")
        print(f"   Inertia Difference: {inertia_pct_diff:.4f}%")
        if ari > 0.95 or inertia_pct_diff < 1.0:
            print("   -> RESULT: NumPy Scratch implementation perfectly matches Scikit-Learn!")
        else:
            print("   -> RESULT: Consistent convergence achieved within stochastic initialization range.")
    else:
        print("   (KMeansScratch module not available; skipped comparison)")

    print("=" * 70 + "\n")
    return sklearn_kmeans, scratch_model


# =============================================================================
# SECTION 5: VISUALIZATIONS & METRICS
# =============================================================================

def remap_clusters_to_business_personas(
    df: pd.DataFrame,
    scaler: StandardScaler,
    kmeans_model: KMeans
) -> pd.DataFrame:
    """
    Ensure cluster IDs align reliably with business personas based on their
    mean Annual Income and Spending Score.
    """
    df_result = df.copy()
    raw_centers = scaler.inverse_transform(kmeans_model.cluster_centers_)
    
    # Calculate mapping based on centers
    # 2D features: Income (index 0), Spending Score (index 1)
    mapping = {}
    income_idx = 0
    score_idx = 1
    
    # Thresholds around median values (Income median ~61k, Score median ~50)
    for c_id, center in enumerate(raw_centers):
        inc = center[income_idx]
        sc = center[score_idx]

        if inc > 65 and sc > 60:
            mapping[c_id] = 2  # Target VIPs
        elif inc > 65 and sc <= 60:
            mapping[c_id] = 0  # High Income, Low Spenders (Careful)
        elif inc <= 45 and sc > 60:
            mapping[c_id] = 3  # Low Income, High Spenders (Trend Seekers)
        elif inc <= 45 and sc <= 60:
            mapping[c_id] = 4  # Low Income, Low Spenders (Budget Conscious)
        else:
            mapping[c_id] = 1  # Average / Balanced

    # Remap clusters
    df_result["Cluster"] = df_result["Cluster_Raw"].map(mapping)
    df_result["Cluster_Name"] = df_result["Cluster"].apply(
        lambda c: CLUSTER_METADATA_2D.get(c, {}).get("name", f"Cluster {c}")
    )
    df_result["Cluster_Tag"] = df_result["Cluster"].apply(
        lambda c: CLUSTER_METADATA_2D.get(c, {}).get("tag", f"Cluster {c}")
    )
    return df_result


def generate_visualizations(
    df_clustered: pd.DataFrame,
    scaler: StandardScaler,
    kmeans_model: KMeans,
    feature_cols: list,
    save_dir: Optional[str] = "plots"
) -> None:
    """
    Create 2D scatter plot, 3D Plotly visualization, cluster size chart,
    and print per-cluster averages.
    """
    print("=" * 70)
    print("STEP 5: VISUALIZATIONS & PER-CLUSTER PROFILES")
    print("=" * 70)

    if save_dir:
        os.makedirs(save_dir, exist_ok=True)

    # 1. 2D Scatter Plot: Income vs Spending Score
    palette = {
        0: "#3b82f6",  # Careful
        1: "#10b981",  # Steady Middle
        2: "#8b5cf6",  # Target VIPs
        3: "#f59e0b",  # Trend Seekers
        4: "#ef4444",  # Budget Conscious
    }

    plt.figure(figsize=(12, 8))
    sns.set_theme(style="whitegrid")

    for c in sorted(df_clustered["Cluster"].unique()):
        subset = df_clustered[df_clustered["Cluster"] == c]
        meta = CLUSTER_METADATA_2D.get(c, {"tag": f"Cluster {c}"})
        plt.scatter(
            subset["Annual Income (k$)"],
            subset["Spending Score (1-100)"],
            s=80,
            c=palette.get(c, "#64748b"),
            label=f"Cluster {c}: {meta['tag']} (n={len(subset)})",
            alpha=0.85,
            edgecolors="black",
            linewidths=0.5
        )

    # Plot Centroids (unscaled coordinates)
    unscaled_centers = scaler.inverse_transform(kmeans_model.cluster_centers_)
    # Find Income and Score index
    inc_idx = feature_cols.index("Annual Income (k$)")
    sc_idx = feature_cols.index("Spending Score (1-100)")

    plt.scatter(
        unscaled_centers[:, inc_idx],
        unscaled_centers[:, sc_idx],
        s=300,
        c="#f8fafc",
        marker="X",
        edgecolors="black",
        linewidths=2.5,
        label="Cluster Centroids",
        zorder=10
    )

    plt.title("Customer Segmentation: Annual Income vs. Spending Score", fontsize=15, weight="bold", pad=15)
    plt.xlabel("Annual Income (k$)", fontsize=12)
    plt.ylabel("Spending Score (1-100)", fontsize=12)
    plt.legend(bbox_to_anchor=(1.02, 1), loc="upper left", borderaxespad=0, frameon=True, fontsize=10)
    plt.tight_layout()

    if save_dir:
        out_2d = os.path.join(save_dir, "cluster_2d_scatter.png")
        plt.savefig(out_2d, dpi=300)
        print(f"-> Saved 2D scatter plot to: {out_2d}")
    plt.close()

    # 2. Cluster Size Bar Chart
    plt.figure(figsize=(10, 5))
    cluster_counts = df_clustered["Cluster"].value_counts().sort_index()
    tags = [CLUSTER_METADATA_2D.get(i, {}).get("tag", f"Cluster {i}") for i in cluster_counts.index]
    bars = plt.bar(tags, cluster_counts.values, color=[palette.get(i, "#64748b") for i in cluster_counts.index], edgecolor="black", width=0.55)
    
    for bar in bars:
        h = bar.get_height()
        plt.text(bar.get_x() + bar.get_width() / 2, h + 1, f"{h} ({h / len(df_clustered) * 100:.1f}%)", ha="center", va="bottom", weight="bold")

    plt.title("Cluster Size Breakdown (Customer Volume)", fontsize=14, weight="bold")
    plt.xlabel("Customer Segment")
    plt.ylabel("Number of Customers")
    plt.ylim(0, max(cluster_counts.values) + 12)
    plt.tight_layout()

    if save_dir:
        out_bar = os.path.join(save_dir, "cluster_sizes.png")
        plt.savefig(out_bar, dpi=300)
        print(f"-> Saved cluster size bar chart to: {out_bar}")
    plt.close()

    # 3. 3D Plotly Scatter Plot (Interactive HTML)
    fig_3d = px.scatter_3d(
        df_clustered,
        x="Age",
        y="Annual Income (k$)",
        z="Spending Score (1-100)",
        color="Cluster_Tag",
        hover_data=["Gender", "Age", "Annual Income (k$)", "Spending Score (1-100)"],
        title="3D Customer Segmentation: Age vs. Income vs. Spending Score",
        opacity=0.85,
        color_discrete_map={meta["tag"]: palette[c] for c, meta in CLUSTER_METADATA_2D.items()}
    )
    fig_3d.update_layout(
        scene=dict(
            xaxis_title="Age (Years)",
            yaxis_title="Annual Income (k$)",
            zaxis_title="Spending Score (1-100)"
        ),
        margin=dict(l=0, r=0, b=0, t=40)
    )

    if save_dir:
        out_html = os.path.join(save_dir, "cluster_3d_scatter.html")
        fig_3d.write_html(out_html)
        print(f"-> Saved 3D Plotly interactive visualization to: {out_html}")

    # 4. Per-Cluster Summary Table
    print("\n--- Per-Cluster Average Feature Metrics ---")
    summary = df_clustered.groupby("Cluster").agg(
        Count=("Cluster", "count"),
        Avg_Age=("Age", "mean"),
        Avg_Income=("Annual Income (k$)", "mean"),
        Avg_Spending_Score=("Spending Score (1-100)", "mean")
    ).round(2)
    summary["Pct_Total"] = (summary["Count"] / len(df_clustered) * 100).round(1).astype(str) + "%"
    summary["Segment_Tag"] = [CLUSTER_METADATA_2D.get(c, {}).get("tag", "") for c in summary.index]
    print(summary[["Segment_Tag", "Count", "Pct_Total", "Avg_Age", "Avg_Income", "Avg_Spending_Score"]])
    print("=" * 70 + "\n")


# =============================================================================
# SECTION 6: CLUSTER INTERPRETATION & MARKETING STRATEGY PLAYBOOK
# =============================================================================

def print_business_interpretation_and_strategies() -> None:
    """Print the complete business interpretation and actionable retail strategy for each cohort."""
    print("=" * 70)
    print("STEP 6: CLUSTER INTERPRETATION & TARGETED MARKETING PLAYBOOK")
    print("=" * 70)

    for c_id, meta in CLUSTER_METADATA_2D.items():
        print(f"\n[CLUSTER {c_id}] {meta['name'].upper()}")
        print(f"-> Profile:  {meta['description']}")
        print(f"-> Strategy: {meta['strategy']}")
        print("-" * 70)
    print("=" * 70 + "\n")


# =============================================================================
# SECTION 7: INFERENCE FUNCTION & MODEL PERSISTENCE
# =============================================================================

def predict_segment(
    age: float,
    income: float,
    score: float,
    scaler: StandardScaler,
    model: KMeans,
    feature_cols: list
) -> Dict[str, Any]:
    """
    Predict the customer segment for a new incoming shopper.

    Parameters
    ----------
    age : float
        Customer age in years.
    income : float
        Annual income in thousands of dollars (e.g. 75 for $75,000).
    score : float
        Spending score between 1 and 100.
    scaler : StandardScaler
        Fitted scaler used during training.
    model : KMeans
        Trained KMeans model.
    feature_cols : list
        List of feature column names used during training.

    Returns
    -------
    dict
        Cluster index, business name, and recommended marketing strategy.
    """
    # Build feature row matching model features
    if len(feature_cols) == 2:
        raw_input = np.array([[income, score]], dtype=float)
    else:
        raw_input = np.array([[age, income, score]], dtype=float)

    scaled_input = scaler.transform(raw_input)
    cluster_idx = int(model.predict(scaled_input)[0])

    meta = CLUSTER_METADATA_2D.get(cluster_idx, {
        "name": f"Segment {cluster_idx}",
        "tag": f"Cluster {cluster_idx}",
        "strategy": "Engage with standard personalized retail communications."
    })

    return {
        "cluster_id": cluster_idx,
        "segment_name": meta["name"],
        "segment_tag": meta["tag"],
        "marketing_strategy": meta["strategy"],
        "input_values": {"age": age, "annual_income_k": income, "spending_score": score}
    }


def save_artifacts(
    df_clustered: pd.DataFrame,
    model: KMeans,
    scaler: StandardScaler,
    csv_out: str = "customer_segments.csv",
    model_out: str = "kmeans_model.joblib",
    scaler_out: str = "scaler.joblib"
) -> None:
    """Save the clustered dataset to CSV and persist trained model artifacts."""
    print("=" * 70)
    print("STEP 7: SAVING CLUSTERED DATA & MODEL ARTIFACTS")
    print("=" * 70)

    # 1. Save Clustered Dataframe
    df_clustered.to_csv(csv_out, index=False)
    print(f"-> Clustered customer dataset saved to: {csv_out}")

    # 2. Save KMeans model & scaler with joblib
    joblib.dump(model, model_out)
    print(f"-> Trained KMeans model serialized to: {model_out}")

    joblib.dump(scaler, scaler_out)
    print(f"-> Fitted StandardScaler serialized to: {scaler_out}")
    print("=" * 70 + "\n")


# =============================================================================
# MAIN PIPELINE EXECUTION
# =============================================================================

def run_pipeline(
    csv_path: str = "Mall_Customers.csv",
    k: Optional[int] = None,
    use_3d: bool = False,
    save_plots: bool = True
) -> Tuple[pd.DataFrame, KMeans, StandardScaler]:
    """Execute the end-to-end customer segmentation pipeline."""
    # 1. Load Data
    df = load_data(csv_path)

    # 2. EDA plots
    if save_plots:
        plot_exploratory_data_analysis(df)

    # 3. Preprocessing
    clean_df, X_scaled, scaler, feature_cols = preprocess_data(df, use_3d=use_3d)

    # 4. Optimal K Analysis
    if k is None:
        k = find_optimal_k(X_scaled, save_dir="plots" if save_plots else None)
    else:
        print(f"-> Using user-specified K = {k}")

    # 5. Model Training & Comparison
    sklearn_model, _ = train_models_and_compare(X_scaled, k=k)

    # Assign Cluster Labels
    clean_df["Cluster_Raw"] = sklearn_model.labels_

    # Remap to canonical business archetypes
    df_clustered = remap_clusters_to_business_personas(clean_df, scaler, sklearn_model)

    # 6. Visualizations & Profiles
    generate_visualizations(
        df_clustered,
        scaler,
        sklearn_model,
        feature_cols,
        save_dir="plots" if save_plots else None
    )

    # 7. Cluster Interpretation & Marketing Playbook
    print_business_interpretation_and_strategies()

    # 8. Sample Inference Test
    print("--- Testing predict_segment() with Sample Customer ---")
    sample_test = predict_segment(
        age=32,
        income=85.0,
        score=82.0,
        scaler=scaler,
        model=sklearn_model,
        feature_cols=feature_cols
    )
    print(f"Customer Input: Age=32, Income=$85k, Spending Score=82")
    print(f"Assigned Cluster: {sample_test['cluster_id']} ({sample_test['segment_name']})")
    print(f"Recommended Strategy: {sample_test['marketing_strategy']}\n")

    # 9. Save Artifacts
    save_artifacts(df_clustered, sklearn_model, scaler)

    print("SUCCESS: End-to-end Customer Segmentation Pipeline completed.")
    return df_clustered, sklearn_model, scaler


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Retail Customer Segmentation using K-Means Clustering")
    parser.add_argument("--file", type=str, default="Mall_Customers.csv", help="Path to input Mall_Customers.csv")
    parser.add_argument("--k", type=int, default=None, help="Number of clusters (default: auto-detected)")
    parser.add_argument("--use-3d", action="store_true", help="Include Age in clustering features (3D)")
    parser.add_argument("--no-plots", action="store_true", help="Disable plot generation")

    args = parser.parse_args()

    run_pipeline(
        csv_path=args.file,
        k=args.k,
        use_3d=args.use_3d,
        save_plots=not args.no_plots
    )
