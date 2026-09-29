# Retail Customer Segmentation using K-Means Clustering

A complete, beginner-friendly machine learning and retail analytics project that segments store shoppers based on their annual income, spending habits, and demographic profiles using **K-Means Clustering**.

---

## 📌 Project Overview

Retail businesses often struggle with one-size-fits-all marketing. By leveraging unsupervised machine learning (K-Means), this project automatically identifies distinct behavioral cohorts within customer transaction data, enabling marketing managers to deliver tailored promotions, improve customer retention, and maximize customer lifetime value (LTV).

### Key Features
- **Exploratory Data Analysis (EDA)**: Demographic distributions (Gender, Age), financial distributions (Income, Spending Score), and correlation analysis.
- **Data Preprocessing & Scaling**: Outlier-aware pipeline with standard scaling ($z = \frac{x - \mu}{\sigma}$) to prevent feature magnitude bias.
- **Optimal K Determination**: Multi-criteria selection using the **Elbow Method (WCSS)** and **Silhouette Coefficient Analysis** ($K=1$ to $10$).
- **Scikit-Learn vs. NumPy From-Scratch Benchmark**: Dual implementation featuring custom Expectation-Maximization (EM) loop compared against `sklearn.cluster.KMeans`.
- **Interactive Visualizations**: High-fidelity 2D scatter plots, 3D Plotly spatial models, and segment volume distribution charts.
- **Actionable Business Archetypes**: 5 distinct personas with tailored marketing playbooks.
- **Inference & Model Serialization**: Real-time `predict_segment()` function and serialized model artifacts via `joblib`.
- **Interactive Streamlit Web Dashboard**: Live parameter sliders, dynamic centroid distance calculation, and instant segment prediction.

---

## 📊 Dataset Schema

The project utilizes the classic **Mall Customers Dataset** (`Mall_Customers.csv`):

| Column Name | Type | Description | Range |
|---|---|---|---|
| `CustomerID` | Integer | Unique identifier for each shopper (dropped during preprocessing) | $1 - 200$ |
| `Gender` | String | Customer biological gender (`Male` / `Female`) | Categorical |
| `Age` | Integer | Customer age in years | $18 - 70$ |
| `Annual Income (k$)` | Integer | Estimated annual household income in thousands | $\$15\text{k} - \$137\text{k}$ |
| `Spending Score (1-100)` | Integer | Proprietary score assigned by the mall based on customer purchase behavior | $1 - 100$ |

---

## 🚀 Quickstart & Setup

### 1. Prerequisites
Ensure you have Python 3.9+ installed.

### 2. Clone or Download Repository
```bash
git clone <repository_url>
cd customer-segmentation-kmeans
```

### 3. Install Dependencies
```bash
pip install -r requirements.txt
```

---

## 💻 How to Run

### Option A: Run the Python Pipeline Script
Executes the entire end-to-end pipeline, logs statistical benchmarks, generates plot images in `./plots/`, and exports serialized artifacts:
```bash
# Run with default 2D feature space (Annual Income + Spending Score)
python customer_segmentation.py

# Run with 3D feature space (Age + Annual Income + Spending Score)
python customer_segmentation.py --use-3d

# Specify custom K or custom CSV path
python customer_segmentation.py --file my_customers.csv --k 5
```

### Option B: Launch the Interactive Streamlit Web Application
Runs an interactive browser-based dashboard with live customer simulation sliders and interactive Plotly 2D/3D charts:
```bash
streamlit run app.py
```

### Option C: Run in Google Colab / JupyterLab
1. Open Google Colab (or run `jupyter lab`).
2. Upload `customer_segmentation.ipynb` and `Mall_Customers.csv`.
3. Run all cells sequentially.

---

## 📈 Methodology & Mathematical Principles

### 1. Standardization
Distance-based clustering algorithms require uniform feature variance:
$$z = \frac{x - \mu}{\sigma}$$
Without standardization, Annual Income (scale 15–137) would dominate Spending Score (scale 1–100) or Age (scale 18–70).

### 2. Within-Cluster Sum of Squares (WCSS / Inertia)
$$\text{WCSS} = \sum_{k=1}^{K} \sum_{x_i \in C_k} \| x_i - \mu_k \|^2$$
The **Elbow Method** tracks WCSS as $K$ increases. The optimal $K$ is found at the "elbow inflection point", beyond which additional clusters produce diminishing returns.

### 3. Silhouette Coefficient
$$s(i) = \frac{b(i) - a(i)}{\max(a(i), b(i))}$$
Where $a(i)$ is the mean intra-cluster distance and $b(i)$ is the mean nearest-cluster distance. A value close to $+1$ indicates dense, well-separated clusters.

---

## 🎯 Results Summary & Customer Segments

For $K=5$ (Annual Income vs. Spending Score), the model delineates 5 clear behavioral archetypes:

```
              Spending Score (1-100)
              High (60-100)  ▲
                             │
     [Cluster 3: Trend      │      [Cluster 2: Target VIPs]
      Seekers / Careless]    │      High Income, High Spend
      Low Income, High Spend │
                             │
 ────────────────────────────┼────────────────────────────► Annual Income
                             │                              (k$)
     [Cluster 4: Budget     │      [Cluster 0: Careful /
      Conscious / Sensible]  │      Affluent Savers]
      Low Income, Low Spend  │      High Income, Low Spend
                             ▼
              Low (1-40)
                    [Cluster 1: Steady Middle]
                    Average Income, Average Spend
```

### Segment Breakdown & Targeted Strategy Matrix

| Cluster ID | Persona Name | Avg. Income | Avg. Score | Market Share | Targeted Marketing Strategy |
|---|---|---|---|---|---|
| **Cluster 2** | **Target VIPs** | $\$86.5\text{k}$ | $82.1$ | $19.5\%$ | **High Priority**: Exclusive concierge, private previews, early access to luxury collections, bespoke gift incentives. |
| **Cluster 0** | **Careful Spenders** | $\$88.2\text{k}$ | $17.1$ | $17.5\%$ | **Value & Longevity**: High-ROI messaging, investment-grade items, product warranties, cashback loyalty rewards. |
| **Cluster 1** | **Steady Middle** | $\$55.3\text{k}$ | $49.7$ | $40.5\%$ | **Volume Driver**: Seasonal catalog releases, multi-buy bundle discounts, tiered loyalty point multipliers. |
| **Cluster 3** | **Trend Seekers** | $\$25.7\text{k}$ | $79.4$ | $11.0\%$ | **Impulse & Trend**: Buy Now Pay Later (BNPL) options, flash sales, viral social media trends, influencer collaborations. |
| **Cluster 4** | **Budget Conscious** | $\$26.3\text{k}$ | $20.9$ | $11.5\%$ | **Retention & Essentials**: Clearance announcements, essential value bundles, price-match guarantees. |

---

## 🔬 Benchmark: Scikit-Learn vs. NumPy From-Scratch

The included `kmeans_scratch.py` implements the full algorithm in vectorized NumPy:

| Metric | Scikit-Learn (`KMeans`) | NumPy Scratch (`KMeansScratch`) |
|---|---|---|
| **Initialization** | `k-means++` | `k-means++` |
| **Convergence Inertia (WCSS)** | $65.57$ | $65.57$ |
| **Iterations to Converge** | $4$ iterations | $4$ iterations |
| **Adjusted Rand Index (ARI)** | $1.00$ ($100\%$ Match) | $1.00$ ($100\%$ Match) |

---

## 🖼️ Visualizations & Artifacts

When executing `customer_segmentation.py`, the following visual artifacts are produced in `./plots/`:
1. `eda_distributions.png`: 4-quadrant demographic distribution grid (Gender, Age, Income, Spending).
2. `optimal_k_selection.png`: Side-by-side Elbow Curve and Silhouette Coefficient plots.
3. `cluster_2d_scatter.png`: Publication-grade 2D scatter plot with marked cluster centroids.
4. `cluster_sizes.png`: Cohort volume bar chart highlighting segment sizes.
5. `cluster_3d_scatter.html`: Interactive 3D spatial plot (Age $\times$ Income $\times$ Spending Score).

Trained pipeline artifacts saved to root:
- `customer_segments.csv`: Customer dataset enriched with `Cluster` and `Cluster_Tag` columns.
- `kmeans_model.joblib`: Serialized Scikit-Learn model object.
- `scaler.joblib`: Serialized `StandardScaler` transformer.

---

## 🛠️ File Structure

```
├── Mall_Customers.csv             # Kaggle benchmark dataset (200 records)
├── customer_segmentation.py       # End-to-end Python script with CLI
├── kmeans_scratch.py              # Pure NumPy K-Means implementation class
├── app.py                         # Interactive Streamlit web application
├── customer_segmentation.ipynb    # Full Google Colab / Jupyter notebook
├── requirements.txt               # Pinned Python package dependencies
├── README.md                      # Comprehensive project documentation
└── plots/                         # Generated high-resolution visualization charts
```

---

## 📄 License
This project is open-source under the Apache-2.0 License.
