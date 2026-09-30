"""
Streamlit Web Application: Retail Customer Segmentation with K-Means
=====================================================================
An interactive web dashboard where retail store managers can upload customer
data, inspect demographic distributions, explore K-Means clusters, test new
customer inputs with real-time sliders, and extract targeted marketing strategies.

To run:
    streamlit run app.py
"""

import io
import os
import pandas as pd
import numpy as np
import streamlit as st
import plotly.express as px
import plotly.graph_objects as go
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import silhouette_score

# Page Configuration
st.set_page_config(
    page_title="Customer Segmentation Studio",
    page_icon="🛍️",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Custom Styling
st.markdown("""
<style>
    .metric-card {
        background-color: #1e293b;
        padding: 1.2rem;
        border-radius: 0.5rem;
        border: 1px solid #334155;
    }
    .strategy-card {
        padding: 1rem 1.25rem;
        border-radius: 0.5rem;
        margin-bottom: 0.75rem;
        border-left: 4px solid #6366f1;
        background-color: #0f172a;
    }
</style>
""", unsafe_allow_html=True)

# Segment Persona Metadata
CLUSTER_PROFILES = {
    0: {
        "name": "High Income - Low Spenders (Careful / Affluent Savers)",
        "tag": "Careful Spenders",
        "color": "#3b82f6",
        "description": "High financial power, cautious spending habits.",
        "strategy": "Emphasize product longevity, premium warranties, value-driven investment messaging, and high-ROI loyalty rewards."
    },
    1: {
        "name": "Average Income - Average Spenders (Balanced / Steady)",
        "tag": "Steady Middle",
        "color": "#10b981",
        "description": "Moderate earnings with moderate spending patterns.",
        "strategy": "Promote seasonal catalog launches, omnichannel promotions, bundle deals, and incremental loyalty bonuses."
    },
    2: {
        "name": "High Income - High Spenders (Target VIPs / Elite Shoppers)",
        "tag": "Target VIPs",
        "color": "#8b5cf6",
        "description": "Highest profitability segment with high disposable income.",
        "strategy": "Offer VIP concierge perks, private product unveils, limited-edition early drops, and exclusive bespoke services."
    },
    3: {
        "name": "Low Income - High Spenders (Trend Seekers / Careless)",
        "tag": "Trend Seekers",
        "color": "#f59e0b",
        "description": "Young, style-driven shoppers spending beyond income.",
        "strategy": "Deploy Buy Now Pay Later (BNPL) options, flash sales, viral social media trends, and influencer-led campaigns."
    },
    4: {
        "name": "Low Income - Low Spenders (Budget Conscious / Sensible)",
        "tag": "Budget Conscious",
        "color": "#ef4444",
        "description": "Price-sensitive customers purchasing only necessities.",
        "strategy": "Highlight steep clearance markdowns, essential value bundles, and price-match guarantees."
    }
}

# -----------------------------------------------------------------------------
# SIDEBAR CONTROLS & FILE UPLOADER
# -----------------------------------------------------------------------------
st.sidebar.title("🛍️ Customer Segmentation")
st.sidebar.markdown("K-Means Clustering & Marketing Analytics")
st.sidebar.markdown("[🌐 **Open Live Cloud App**](https://ais-pre-m6ged3numqdvjurljbj4m7-5834640671.asia-southeast1.run.app)")

uploaded_file = st.sidebar.file_uploader(
    "Upload Customer CSV",
    type=["csv"],
    help="Upload Mall_Customers.csv or your custom retail customer dataset."
)

@st.cache_data
def load_dataset(file_obj) -> pd.DataFrame:
    if file_obj is not None:
        return pd.read_csv(file_obj)
    elif os.path.exists("Mall_Customers.csv"):
        return pd.read_csv("Mall_Customers.csv")
    else:
        # Generate dummy fallback data if file missing
        np.random.seed(42)
        n = 200
        return pd.DataFrame({
            "CustomerID": range(1, n + 1),
            "Gender": np.random.choice(["Male", "Female"], size=n),
            "Age": np.random.randint(18, 70, size=n),
            "Annual Income (k$)": np.random.randint(15, 140, size=n),
            "Spending Score (1-100)": np.random.randint(1, 100, size=n)
        })

df = load_dataset(uploaded_file)

st.sidebar.subheader("Model Configuration")
feature_mode = st.sidebar.radio(
    "Clustering Feature Space:",
    options=["2D: Income + Spending Score", "3D: Age + Income + Spending Score"],
    index=0
)
use_3d = "3D" in feature_mode

k_clusters = st.sidebar.slider("Number of Clusters (K):", min_value=2, max_value=8, value=5, step=1)
random_state = st.sidebar.number_input("Random State:", min_value=0, max_value=999, value=42, step=1)

# -----------------------------------------------------------------------------
# MAIN DASHBOARD TABS
# -----------------------------------------------------------------------------
tab_overview, tab_eda, tab_elbow, tab_clusters, tab_predict = st.tabs([
    "📊 Dataset Overview",
    "📈 Exploratory Analysis",
    "📐 Optimal K (Elbow & Silhouette)",
    "🎯 Cluster Visualizations",
    "🔮 Real-Time Customer Predictor"
])

# -----------------------------------------------------------------------------
# TAB 1: DATASET OVERVIEW
# -----------------------------------------------------------------------------
with tab_overview:
    st.header("Dataset Overview")
    col1, col2, col3, col4 = st.columns(4)
    with col1:
        st.metric("Total Customers", f"{len(df):,}")
    with col2:
        st.metric("Avg Annual Income", f"${df['Annual Income (k$)'].mean():.1f}k")
    with col3:
        st.metric("Avg Spending Score", f"{df['Spending Score (1-100)'].mean():.1f} / 100")
    with col4:
        st.metric("Missing Values", f"{df.isnull().sum().sum()}")

    st.subheader("Data Sample (First 10 Rows)")
    st.dataframe(df.head(10), use_container_width=True)

    col_info1, col_info2 = st.columns(2)
    with col_info1:
        st.subheader("Summary Statistics")
        st.dataframe(df.describe().round(2), use_container_width=True)
    with col_info2:
        st.subheader("Dataset Information")
        buf = io.StringIO()
        df.info(buf=buf)
        st.text(buf.getvalue())

# -----------------------------------------------------------------------------
# PREPROCESSING & MODEL FITTING
# -----------------------------------------------------------------------------
feature_cols = ["Annual Income (k$)", "Spending Score (1-100)"]
if use_3d:
    feature_cols = ["Age", "Annual Income (k$)", "Spending Score (1-100)"]

X_raw = df[feature_cols].values
scaler = StandardScaler()
X_scaled = scaler.fit_transform(X_raw)

kmeans = KMeans(n_clusters=k_clusters, init="k-means++", n_init=10, random_state=random_state)
labels = kmeans.fit_predict(X_scaled)
df_clustered = df.copy()
df_clustered["Cluster"] = labels

# -----------------------------------------------------------------------------
# TAB 2: EXPLORATORY DATA ANALYSIS
# -----------------------------------------------------------------------------
with tab_eda:
    st.header("Demographic & Behavioral Distributions")
    col_e1, col_e2 = st.columns(2)

    with col_e1:
        if "Gender" in df.columns:
            fig_gender = px.pie(
                df, names="Gender", title="Gender Distribution",
                hole=0.4, color_discrete_sequence=["#3b82f6", "#ec4899"]
            )
            st.plotly_chart(fig_gender, use_container_width=True)

        fig_income = px.histogram(
            df, x="Annual Income (k$)", nbins=20, marginal="box",
            title="Annual Income Distribution (k$)", color_discrete_sequence=["#10b981"]
        )
        st.plotly_chart(fig_income, use_container_width=True)

    with col_e2:
        fig_age = px.histogram(
            df, x="Age", nbins=20, marginal="box",
            title="Age Distribution", color_discrete_sequence=["#8b5cf6"]
        )
        st.plotly_chart(fig_age, use_container_width=True)

        fig_score = px.histogram(
            df, x="Spending Score (1-100)", nbins=20, marginal="box",
            title="Spending Score Distribution (1-100)", color_discrete_sequence=["#f59e0b"]
        )
        st.plotly_chart(fig_score, use_container_width=True)

# -----------------------------------------------------------------------------
# TAB 3: OPTIMAL K EVALUATION
# -----------------------------------------------------------------------------
with tab_elbow:
    st.header("Evaluating Optimal Clusters (K)")
    st.markdown("Use the **Elbow Method (WCSS)** and **Silhouette Coefficient** to justify the choice of cluster count.")

    wcss_list = []
    sil_list = []
    k_vals = list(range(1, 11))
    for k in k_vals:
        km_test = KMeans(n_clusters=k, init="k-means++", n_init=10, random_state=42)
        km_test.fit(X_scaled)
        wcss_list.append(km_test.inertia_)
        if k >= 2:
            sil_list.append(silhouette_score(X_scaled, km_test.labels_))
        else:
            sil_list.append(None)

    col_k1, col_k2 = st.columns(2)
    with col_k1:
        fig_elbow = go.Figure()
        fig_elbow.add_trace(go.Scatter(
            x=k_vals, y=wcss_list, mode="lines+markers",
            marker=dict(size=8, color="#6366f1"),
            line=dict(width=2.5, color="#6366f1"),
            name="WCSS (Inertia)"
        ))
        fig_elbow.add_vline(x=5, line_width=2, line_dash="dash", line_color="crimson")
        fig_elbow.update_layout(
            title="Elbow Method Curve (WCSS vs K)",
            xaxis_title="Number of Clusters (K)",
            yaxis_title="Within-Cluster Sum of Squares"
        )
        st.plotly_chart(fig_elbow, use_container_width=True)

    with col_k2:
        fig_sil = go.Figure()
        fig_sil.add_trace(go.Scatter(
            x=list(range(2, 11)), y=[s for s in sil_list if s is not None],
            mode="lines+markers",
            marker=dict(size=8, color="#10b981"),
            line=dict(width=2.5, color="#10b981"),
            name="Silhouette Score"
        ))
        fig_sil.add_vline(x=5, line_width=2, line_dash="dash", line_color="crimson")
        fig_sil.update_layout(
            title="Silhouette Coefficient vs K",
            xaxis_title="Number of Clusters (K)",
            yaxis_title="Silhouette Score"
        )
        st.plotly_chart(fig_sil, use_container_width=True)

    st.success("""
    **Recommendation**: K = 5 is optimal for Mall Customers (2D Income vs Spending Score).
    - The **Elbow Curve** exhibits a distinct bend at K=5 where further increases yield diminishing returns.
    - The **Silhouette Score** remains high and yields 5 actionable, intuitive retail archetypes.
    """)

# -----------------------------------------------------------------------------
# TAB 4: CLUSTER VISUALIZATIONS
# -----------------------------------------------------------------------------
with tab_clusters:
    st.header("Customer Segmentation Visualizations")

    # 2D Scatter Plot
    unscaled_centers = scaler.inverse_transform(kmeans.cluster_centers_)
    
    col_v1, col_v2 = st.columns([3, 2])
    with col_v1:
        fig_2d = px.scatter(
            df_clustered,
            x="Annual Income (k$)",
            y="Spending Score (1-100)",
            color=df_clustered["Cluster"].astype(str),
            hover_data=["Age", "Gender"] if "Gender" in df_clustered.columns else ["Age"],
            title=f"2D Clusters: Income vs Spending Score (K={k_clusters})",
            color_discrete_sequence=px.colors.qualitative.Set2
        )
        # Add Centroids
        fig_2d.add_trace(go.Scatter(
            x=unscaled_centers[:, -2 if use_3d else 0],
            y=unscaled_centers[:, -1],
            mode="markers",
            marker=dict(symbol="x", size=14, color="white", line=dict(width=2, color="black")),
            name="Centroids"
        ))
        st.plotly_chart(fig_2d, use_container_width=True)

    with col_v2:
        # Cluster Size Distribution
        counts = df_clustered["Cluster"].value_counts().reset_index()
        counts.columns = ["Cluster", "Count"]
        counts["Cluster"] = "Cluster " + counts["Cluster"].astype(str)
        fig_bar = px.bar(
            counts, x="Cluster", y="Count", text="Count",
            title="Customer Volume per Segment",
            color="Cluster",
            color_discrete_sequence=px.colors.qualitative.Set2
        )
        st.plotly_chart(fig_bar, use_container_width=True)

    # 3D Interactive Plot if selected or available
    st.subheader("3D Feature Space (Age × Income × Spending Score)")
    fig_3d = px.scatter_3d(
        df_clustered,
        x="Age",
        y="Annual Income (k$)",
        z="Spending Score (1-100)",
        color=df_clustered["Cluster"].astype(str),
        hover_name="CustomerID" if "CustomerID" in df_clustered.columns else None,
        title="Interactive 3D Cluster Projection",
        opacity=0.85,
        color_discrete_sequence=px.colors.qualitative.Set2
    )
    st.plotly_chart(fig_3d, use_container_width=True)

    # Summary Table
    st.subheader("Per-Cluster Feature Averages")
    summary = df_clustered.groupby("Cluster").agg(
        Total_Customers=("Age", "count"),
        Mean_Age=("Age", "mean"),
        Mean_Income=("Annual Income (k$)", "mean"),
        Mean_Spending=("Spending Score (1-100)", "mean")
    ).round(2)
    st.dataframe(summary, use_container_width=True)

    # Download CSV
    csv_bytes = df_clustered.to_csv(index=False).encode("utf-8")
    st.download_button(
        label="📥 Download Clustered Dataset (customer_segments.csv)",
        data=csv_bytes,
        file_name="customer_segments.csv",
        mime="text/csv"
    )

# -----------------------------------------------------------------------------
# TAB 5: REAL-TIME CUSTOMER PREDICTOR & MARKETING PLAYBOOK
# -----------------------------------------------------------------------------
with tab_predict:
    st.header("🔮 Real-Time Customer Predictor")
    st.markdown("Adjust the sliders below to simulate a new customer and view their predicted segment and marketing strategy.")

    p_col1, p_col2 = st.columns([1, 1])

    with p_col1:
        st.subheader("Customer Attributes")
        input_age = st.slider("Customer Age", min_value=18, max_value=75, value=32, step=1)
        input_income = st.slider("Annual Income ($k)", min_value=10, max_value=140, value=85, step=1)
        input_score = st.slider("Spending Score (1-100)", min_value=1, max_value=100, value=82, step=1)

        # Scale and predict
        if use_3d:
            sample_point = np.array([[input_age, input_income, input_score]])
        else:
            sample_point = np.array([[input_income, input_score]])

        scaled_point = scaler.transform(sample_point)
        pred_cluster = int(kmeans.predict(scaled_point)[0])

    with p_col2:
        st.subheader("Segment Prediction Result")
        profile = CLUSTER_PROFILES.get(pred_cluster, {
            "name": f"Segment {pred_cluster}",
            "tag": f"Cluster {pred_cluster}",
            "color": "#6366f1",
            "description": "Standard retail cohort.",
            "strategy": "Engage with personalized recommendations and seasonal campaign updates."
        })

        st.markdown(f"""
        <div style="background-color: #1e293b; padding: 1.5rem; border-radius: 0.75rem; border: 1px solid #334155;">
            <h3 style="margin-top: 0; color: {profile['color']};">🏷️ {profile['tag']}</h3>
            <p><strong>Archetype:</strong> {profile['name']}</p>
            <p><strong>Behavioral Profile:</strong> {profile['description']}</p>
            <hr style="border-color: #334155; margin: 1rem 0;">
            <p><strong>🎯 Recommended Marketing Playbook:</strong></p>
            <p style="font-size: 1.05rem; line-height: 1.5;">{profile['strategy']}</p>
        </div>
        """, unsafe_allow_html=True)

    # Strategy Playbook Matrix
    st.subheader("Targeted Marketing Strategy Matrix (All Segments)")
    for cid, c_data in CLUSTER_PROFILES.items():
        st.markdown(f"""
        <div class="strategy-card">
            <h4 style="margin: 0; color: {c_data['color']};">Segment {cid}: {c_data['name']}</h4>
            <p style="margin: 0.25rem 0; color: #94a3b8; font-size: 0.9rem;">{c_data['description']}</p>
            <p style="margin: 0.5rem 0 0 0;"><strong>Actionable Playbook:</strong> {c_data['strategy']}</p>
        </div>
        """, unsafe_allow_html=True)
