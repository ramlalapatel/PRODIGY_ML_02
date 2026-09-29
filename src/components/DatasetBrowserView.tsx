import React, { useState, useMemo } from 'react';
import { CustomerRecord } from '../types/dataset';
import { CLUSTER_PROFILES_CATALOG } from '../data/mallCustomersData';
import { Search, ArrowUpDown, Download, Filter } from 'lucide-react';

interface DatasetBrowserViewProps {
  data: CustomerRecord[];
  onExportCsv: () => void;
}

export const DatasetBrowserView: React.FC<DatasetBrowserViewProps> = ({ data, onExportCsv }) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [genderFilter, setGenderFilter] = useState<string>('All');
  const [clusterFilter, setClusterFilter] = useState<string>('All');
  const [sortField, setSortField] = useState<keyof CustomerRecord>('CustomerID');
  const [sortAsc, setSortAsc] = useState<boolean>(true);

  const filteredAndSorted = useMemo(() => {
    return data
      .filter(item => {
        const matchesSearch =
          searchTerm === '' ||
          item.CustomerID.toString().includes(searchTerm) ||
          (item.Cluster_Tag && item.Cluster_Tag.toLowerCase().includes(searchTerm.toLowerCase()));

        const matchesGender =
          genderFilter === 'All' || item.Gender.toLowerCase() === genderFilter.toLowerCase();

        const matchesCluster =
          clusterFilter === 'All' || item.Cluster?.toString() === clusterFilter;

        return matchesSearch && matchesGender && matchesCluster;
      })
      .sort((a, b) => {
        const valA = a[sortField] ?? 0;
        const valB = b[sortField] ?? 0;
        if (valA < valB) return sortAsc ? -1 : 1;
        if (valA > valB) return sortAsc ? 1 : -1;
        return 0;
      });
  }, [data, searchTerm, genderFilter, clusterFilter, sortField, sortAsc]);

  const handleSort = (field: keyof CustomerRecord) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const clusterPalette: Record<number, string> = {
    2: '#8b5cf6',
    0: '#3b82f6',
    1: '#10b981',
    3: '#f59e0b',
    4: '#ef4444',
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800 gap-3">
        <div>
          <h3 className="text-lg font-bold text-white">Clustered Dataset Explorer</h3>
          <p className="text-xs text-slate-400">
            Interactive tabular inspection of all {data.length} customer records with assigned cluster segments.
          </p>
        </div>

        <button
          onClick={onExportCsv}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-200 bg-slate-900 border border-slate-800 hover:bg-slate-800 rounded-lg transition-colors self-start sm:self-auto"
        >
          <Download className="w-3.5 h-3.5 text-indigo-400" />
          <span>Export Table (CSV)</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center gap-3 bg-slate-900 p-3 rounded-xl border border-slate-800">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
          <input
            type="text"
            placeholder="Search Customer ID or Segment Tag..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Gender Filter */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Gender:</span>
          <select
            value={genderFilter}
            onChange={e => setGenderFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none"
          >
            <option value="All">All Genders</option>
            <option value="Female">Female</option>
            <option value="Male">Male</option>
          </select>
        </div>

        {/* Cluster Filter */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Cluster:</span>
          <select
            value={clusterFilter}
            onChange={e => setClusterFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none"
          >
            <option value="All">All Clusters</option>
            <option value="2">Cluster 2 (Target VIPs)</option>
            <option value="0">Cluster 0 (Careful)</option>
            <option value="1">Cluster 1 (Steady Middle)</option>
            <option value="3">Cluster 3 (Trend Seekers)</option>
            <option value="4">Cluster 4 (Budget Conscious)</option>
          </select>
        </div>

        <span className="text-xs text-slate-400 font-mono ml-auto">
          Showing {filteredAndSorted.length} of {data.length}
        </span>
      </div>

      {/* Dataset Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto max-h-[500px]">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-950 text-slate-400 font-mono border-b border-slate-800 sticky top-0 z-10">
              <tr>
                <th
                  onClick={() => handleSort('CustomerID')}
                  className="py-2.5 px-4 cursor-pointer hover:text-white"
                >
                  <div className="flex items-center gap-1">
                    <span>CustomerID</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('Gender')}
                  className="py-2.5 px-3 cursor-pointer hover:text-white"
                >
                  <div className="flex items-center gap-1">
                    <span>Gender</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('Age')}
                  className="py-2.5 px-3 cursor-pointer hover:text-white text-right"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Age</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('Annual Income (k$)')}
                  className="py-2.5 px-3 cursor-pointer hover:text-white text-right"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Income ($k)</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('Spending Score (1-100)')}
                  className="py-2.5 px-3 cursor-pointer hover:text-white text-right"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Score (1-100)</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('Cluster')}
                  className="py-2.5 px-4 cursor-pointer hover:text-white"
                >
                  <div className="flex items-center gap-1">
                    <span>Assigned Segment</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 font-mono text-slate-200">
              {filteredAndSorted.map(cust => (
                <tr key={cust.CustomerID} className="hover:bg-slate-800/40">
                  <td className="py-2 px-4 text-slate-400">#{cust.CustomerID}</td>
                  <td className="py-2 px-3 font-sans">
                    <span className={cust.Gender === 'Female' ? 'text-pink-400 font-medium' : 'text-blue-400 font-medium'}>
                      {cust.Gender}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-right tabular-nums">{cust.Age}</td>
                  <td className="py-2 px-3 text-right tabular-nums font-semibold text-emerald-400">
                    ${cust['Annual Income (k$)']}k
                  </td>
                  <td className="py-2 px-3 text-right tabular-nums font-semibold text-amber-400">
                    {cust['Spending Score (1-100)']}
                  </td>
                  <td className="py-2 px-4 font-sans">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: clusterPalette[cust.Cluster ?? 0] }}
                      />
                      <span className="text-white font-medium">
                        {cust.Cluster_Tag || `Cluster ${cust.Cluster}`}
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
