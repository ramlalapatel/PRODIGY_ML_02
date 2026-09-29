import React, { useState, useRef, useEffect, useCallback } from 'react';
import { CustomerRecord, Centroid } from '../types/dataset';
import { CLUSTER_PROFILES_CATALOG } from '../data/mallCustomersData';
import { Rotate3d, Compass } from 'lucide-react';

interface ClusterVisualizer3DProps {
  data: CustomerRecord[];
  centroids: Centroid[];
  highlightCustomer?: { income: number; spendingScore: number; age?: number } | null;
}

export const ClusterVisualizer3D: React.FC<ClusterVisualizer3DProps> = ({
  data,
  centroids,
  highlightCustomer
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Rotation angles (radians)
  const [rotX, setRotX] = useState<number>(0.4);
  const [rotY, setRotY] = useState<number>(0.65);
  const isDraggingRef = useRef<boolean>(false);
  const lastMousePosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Range bounds for 3D normalization [-1, 1]
  const minAge = 18, maxAge = 70;
  const minInc = 15, maxInc = 140;
  const minScore = 1, maxScore = 100;

  const clusterPalette: Record<number, string> = {
    2: '#a855f7', // Purple
    0: '#3b82f6', // Blue
    1: '#10b981', // Green
    3: '#f59e0b', // Amber
    4: '#ef4444', // Red
  };

  const project3D = useCallback((x: number, y: number, z: number, width: number, height: number) => {
    // Rotate around Y axis
    const cosY = Math.cos(rotY);
    const sinY = Math.sin(rotY);
    const x1 = x * cosY + z * sinY;
    const z1 = -x * sinY + z * cosY;

    // Rotate around X axis
    const cosX = Math.cos(rotX);
    const sinX = Math.sin(rotX);
    const y2 = y * cosX - z1 * sinX;
    const z2 = y * sinX + z1 * cosX;

    // Camera perspective projection
    const cameraDist = 3.2;
    const fov = 350;
    const depth = cameraDist + z2;
    const scale = fov / Math.max(depth, 0.5);

    const screenX = width / 2 + x1 * scale;
    const screenY = height / 2 - y2 * scale;

    return { screenX, screenY, depth, scale };
  }, [rotX, rotY]);

  // Render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Clear background
    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, width, height);

    // Draw 3D Bounding Cube
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;

    const cubeCorners = [
      [-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1],
      [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]
    ];

    const edges = [
      [0, 1], [1, 2], [2, 3], [3, 0],
      [4, 5], [5, 6], [6, 7], [7, 4],
      [0, 4], [1, 5], [2, 6], [3, 7]
    ];

    edges.forEach(([i, j]) => {
      const p1 = project3D(cubeCorners[i][0], cubeCorners[i][1], cubeCorners[i][2], width, height);
      const p2 = project3D(cubeCorners[j][0], cubeCorners[j][1], cubeCorners[j][2], width, height);

      ctx.beginPath();
      ctx.moveTo(p1.screenX, p1.screenY);
      ctx.lineTo(p2.screenX, p2.screenY);
      ctx.stroke();
    });

    // Collect all 3D points for depth sorting
    type RenderItem = {
      type: 'point' | 'centroid' | 'highlight';
      x: number;
      y: number;
      z: number;
      color: string;
      radius: number;
      label?: string;
    };

    const items: RenderItem[] = [];

    // Customer Points
    data.forEach(cust => {
      // Normalize to [-1, 1]
      const nx = ((cust.Age - minAge) / (maxAge - minAge)) * 2 - 1;
      const ny = ((cust['Annual Income (k$)'] - minInc) / (maxInc - minInc)) * 2 - 1;
      const nz = ((cust['Spending Score (1-100)'] - minScore) / (maxScore - minScore)) * 2 - 1;

      items.push({
        type: 'point',
        x: nx,
        y: ny,
        z: nz,
        color: clusterPalette[cust.Cluster ?? 0] || '#64748b',
        radius: 3.5
      });
    });

    // Centroids
    centroids.forEach(c => {
      const ageVal = c.age ?? 38.8;
      const nx = ((ageVal - minAge) / (maxAge - minAge)) * 2 - 1;
      const ny = ((c.income - minInc) / (maxInc - minInc)) * 2 - 1;
      const nz = ((c.spendingScore - minScore) / (maxScore - minScore)) * 2 - 1;

      items.push({
        type: 'centroid',
        x: nx,
        y: ny,
        z: nz,
        color: clusterPalette[c.kIndex] || '#ffffff',
        radius: 8,
        label: `μ${c.kIndex}`
      });
    });

    // Live highlight point
    if (highlightCustomer) {
      const ageVal = highlightCustomer.age ?? 35;
      const nx = ((ageVal - minAge) / (maxAge - minAge)) * 2 - 1;
      const ny = ((highlightCustomer.income - minInc) / (maxInc - minInc)) * 2 - 1;
      const nz = ((highlightCustomer.spendingScore - minScore) / (maxScore - minScore)) * 2 - 1;

      items.push({
        type: 'highlight',
        x: nx,
        y: ny,
        z: nz,
        color: '#38bdf8',
        radius: 9,
        label: 'Live Customer'
      });
    }

    // Depth sort (far to near)
    const projectedItems = items.map(item => {
      const proj = project3D(item.x, item.y, item.z, width, height);
      return { ...item, ...proj };
    }).sort((a, b) => b.depth - a.depth);

    // Draw projected points
    projectedItems.forEach(item => {
      if (item.type === 'point') {
        ctx.beginPath();
        const r = Math.max(item.radius * (item.scale / 100), 1.5);
        ctx.arc(item.screenX, item.screenY, r, 0, Math.PI * 2);
        ctx.fillStyle = item.color;
        ctx.globalAlpha = 0.85;
        ctx.fill();
        ctx.strokeStyle = '#020617';
        ctx.lineWidth = 0.5;
        ctx.stroke();
      } else if (item.type === 'centroid') {
        // Centroid Cross
        ctx.globalAlpha = 1.0;
        ctx.beginPath();
        ctx.arc(item.screenX, item.screenY, 7, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 10px monospace';
        ctx.textAlign = 'center';
        if (item.label) {
          ctx.fillText(item.label, item.screenX, item.screenY - 10);
        }
      } else if (item.type === 'highlight') {
        // Pulsing Live input
        ctx.globalAlpha = 1.0;
        ctx.beginPath();
        ctx.arc(item.screenX, item.screenY, 12, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(56, 189, 248, 0.3)';
        ctx.fill();

        ctx.beginPath();
        ctx.arc(item.screenX, item.screenY, 6, 0, Math.PI * 2);
        ctx.fillStyle = '#38bdf8';
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#38bdf8';
        ctx.font = 'bold 11px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('● Live Input', item.screenX, item.screenY - 14);
      }
    });

    ctx.globalAlpha = 1.0;

    // Draw Axis Orientations Indicator in Bottom Left
    const axisOrigin = project3D(-0.9, -0.9, -0.9, width, height);
    const axisX = project3D(-0.4, -0.9, -0.9, width, height);
    const axisY = project3D(-0.9, -0.4, -0.9, width, height);
    const axisZ = project3D(-0.9, -0.9, -0.4, width, height);

    ctx.lineWidth = 2;

    // X Axis: Age (Red)
    ctx.strokeStyle = '#ef4444';
    ctx.beginPath();
    ctx.moveTo(axisOrigin.screenX, axisOrigin.screenY);
    ctx.lineTo(axisX.screenX, axisX.screenY);
    ctx.stroke();

    // Y Axis: Income (Green)
    ctx.strokeStyle = '#10b981';
    ctx.beginPath();
    ctx.moveTo(axisOrigin.screenX, axisOrigin.screenY);
    ctx.lineTo(axisY.screenX, axisY.screenY);
    ctx.stroke();

    // Z Axis: Spending Score (Blue)
    ctx.strokeStyle = '#3b82f6';
    ctx.beginPath();
    ctx.moveTo(axisOrigin.screenX, axisOrigin.screenY);
    ctx.lineTo(axisZ.screenX, axisZ.screenY);
    ctx.stroke();
  }, [data, centroids, highlightCustomer, rotX, rotY, project3D]);

  // Mouse interaction handlers for rotation
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    isDraggingRef.current = true;
    lastMousePosRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDraggingRef.current) return;
    const dx = e.clientX - lastMousePosRef.current.x;
    const dy = e.clientY - lastMousePosRef.current.y;

    setRotY(prev => prev + dx * 0.008);
    setRotX(prev => Math.max(Math.min(prev + dy * 0.008, 1.4), -1.4));

    lastMousePosRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  const handleResetCamera = () => {
    setRotX(0.4);
    setRotY(0.65);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 lg:p-5 flex flex-col justify-between">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800 gap-2">
        <div>
          <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
            3D Spatial Projection: Age × Income × Spending Score
          </h4>
          <p className="text-[11px] text-slate-400">
            Click and drag to rotate the 3D customer point cloud in real-time.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleResetCamera}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
          >
            <Compass className="w-3.5 h-3.5 text-indigo-400" />
            <span>Reset Camera</span>
          </button>
        </div>
      </div>

      {/* 3D Canvas */}
      <div className="relative w-full h-[360px] lg:h-[420px] my-2 select-none overflow-hidden rounded-lg">
        <canvas
          ref={canvasRef}
          width={600}
          height={420}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          className="w-full h-full cursor-grab active:cursor-grabbing block"
        />

        {/* 3D Axis Legend Badge */}
        <div className="absolute top-3 left-3 bg-slate-950/80 backdrop-blur-sm border border-slate-800 p-2 rounded-lg text-[11px] space-y-1">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-1 rounded bg-red-500 inline-block" />
            <span className="text-slate-300">X: Age (18 – 70)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-1 rounded bg-emerald-500 inline-block" />
            <span className="text-slate-300">Y: Annual Income ($15k – $140k)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-1 rounded bg-blue-500 inline-block" />
            <span className="text-slate-300">Z: Spending Score (1 – 100)</span>
          </div>
        </div>

        {/* Rotational Info */}
        <div className="absolute bottom-3 right-3 text-[10px] font-mono text-slate-500 bg-slate-950/60 px-2 py-1 rounded">
          Pitch: {(rotX * (180 / Math.PI)).toFixed(0)}° · Yaw: {(rotY * (180 / Math.PI)).toFixed(0)}°
        </div>
      </div>

      <div className="flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-800 pt-2">
        <div className="flex items-center gap-2">
          <Rotate3d className="w-3.5 h-3.5 text-indigo-400" />
          <span>Interactive 3D Perspective Projection</span>
        </div>
        <span>Equi-variance depth scaled</span>
      </div>
    </div>
  );
};
