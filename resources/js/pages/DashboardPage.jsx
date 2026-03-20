import { useEffect, useState } from 'react';
import { dashboardApi } from '../api';

export default function DashboardPage() {
  const [stats, setStats]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await dashboardApi.getStats();
        setStats(data.data);
      } catch (err) {
        setError('Failed to load dashboard.');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <span className="font-mono text-xs tracking-widest text-gray-300 uppercase animate-pulse">
        Loading dashboard...
      </span>
    </div>
  );

  const STAT_CARDS = [
    {
      label: 'Total Products',
      value: stats?.total_products           || 0,
      color: 'text-blue-700',
      sub:   'SKUs in catalogue',
    },
    {
      label: 'Low Stock Items',
      value: stats?.low_stock_items          || 0,
      color: 'text-red-700',
      sub:   'Below reorder level',
    },
    {
      label: 'Pending Orders',
      value: stats?.pending_purchase_orders  || 0,
      color: 'text-amber-700',
      sub:   'Awaiting action',
    },
    {
      label: 'Pending Requisitions',
      value: stats?.pending_requisitions     || 0,
      color: 'text-green-700',
      sub:   'In workflow',
    },
  ];

  // Color chip for categories — deterministic from name
  const CHIP_COLORS = [
    'bg-blue-50  text-blue-700',
    'bg-amber-50 text-amber-700',
    'bg-green-50 text-green-700',
    'bg-purple-50 text-purple-700',
    'bg-red-50   text-red-700',
    'bg-teal-50  text-teal-700',
  ];
  const chipColor = (name = '') =>
    CHIP_COLORS[name.charCodeAt(0) % CHIP_COLORS.length];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10"
         style={{ fontFamily: "'IBM Plex Sans', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@300;400;500&display=swap');`}</style>

      {/* Masthead */}
      <div className="flex justify-between items-end mb-8 pb-4 border-b-2 border-gray-900">
        <div>
          <p className="font-mono text-xs tracking-widest text-gray-400 uppercase mb-1">Overview</p>
          <h1 className="font-mono text-2xl font-semibold tracking-tight text-gray-900">Dashboard</h1>
        </div>
        <span className="font-mono text-xs text-gray-400">
          {new Date().toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
        </span>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 font-mono text-xs px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        {STAT_CARDS.map(({ label, value, color, sub }) => (
          <div key={label} className="bg-gray-50 rounded-md px-4 py-4 flex flex-col gap-1">
            <p className="font-mono text-xs text-gray-400 uppercase tracking-widest">{label}</p>
            <p className={`font-mono text-3xl font-semibold leading-none mt-1 ${color}`}>{value}</p>
            <p className="text-xs text-gray-400 mt-1">{sub}</p>
          </div>
        ))}
      </div>

      {/* Two-panel row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Recent Stock Alerts */}
        <div className="bg-white border border-gray-200 rounded-md overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100">
            <span className="inline-block w-2 h-2 rounded-full bg-red-500 flex-shrink-0" />
            <h2 className="font-mono text-xs font-semibold tracking-widest text-gray-500 uppercase">
              Recent Stock Alerts
            </h2>
          </div>

          {stats?.recent_alerts?.length ? (
            <ul>
              {stats.recent_alerts.map((alert, i) => (
                <li key={alert.id}
                    className={`flex justify-between items-center px-5 py-3 ${
                      i < stats.recent_alerts.length - 1 ? 'border-b border-gray-100' : ''
                    } hover:bg-gray-50 transition-colors`}>
                  <div className="flex items-center gap-2.5">
                    <div className="w-6 h-6 rounded bg-red-50 flex items-center justify-center font-mono text-xs font-medium text-red-500 flex-shrink-0">
                      {(alert.product_name || '?')[0].toUpperCase()}
                    </div>
                    <span className="text-sm text-gray-700">{alert.product_name}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-xs font-medium text-red-700">{alert.current_stock}</span>
                    <span className="font-mono text-xs text-gray-400">units</span>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-5 py-8 font-mono text-xs text-gray-300 uppercase tracking-widest text-center">
              No active alerts.
            </p>
          )}
        </div>

        {/* Top Categories */}
        <div className="bg-white border border-gray-200 rounded-md overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100">
            <span className="inline-block w-2 h-2 rounded-full bg-gray-900 flex-shrink-0" />
            <h2 className="font-mono text-xs font-semibold tracking-widest text-gray-500 uppercase">
              Top Categories
            </h2>
          </div>

          {stats?.top_categories?.length ? (
            <ul>
              {stats.top_categories.map((category, i) => (
                <li key={category.id}
                    className={`flex justify-between items-center px-5 py-3 ${
                      i < stats.top_categories.length - 1 ? 'border-b border-gray-100' : ''
                    } hover:bg-gray-50 transition-colors`}>
                  <div className="flex items-center gap-2.5">
                    <div className={`w-6 h-6 rounded flex items-center justify-center font-mono text-xs font-medium flex-shrink-0 ${chipColor(category.name)}`}>
                      {(category.name || '?')[0].toUpperCase()}
                    </div>
                    <span className="text-sm text-gray-700">{category.name}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-xs font-medium text-gray-700">{category.product_count}</span>
                    <span className="font-mono text-xs text-gray-400">products</span>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-5 py-8 font-mono text-xs text-gray-300 uppercase tracking-widest text-center">
              No data available.
            </p>
          )}
        </div>

      </div>
    </div>
  );
}