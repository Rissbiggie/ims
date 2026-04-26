import { useEffect, useState } from 'react';
import { dashboardApi } from '../api';

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await dashboardApi.getStats();
        setStats(data.data || data);
      } catch (err) {
        setError('Failed to sync with IMS server.');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="flex flex-col items-center gap-2">
          <div className="w-5 h-5 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
          <span className="font-mono text-[10px] tracking-widest text-gray-400 uppercase">Synchronizing...</span>
        </div>
      </div>
    );

  const CARDS = [
    { label: 'Total Products', value: stats?.total_products, sub: 'Active SKUs', color: 'text-gray-900' },
    { label: 'Low Stock', value: stats?.low_stock_count, sub: 'Immediate Action', color: stats?.low_stock_count > 0 ? 'text-red-600' : 'text-gray-900' },
    { label: 'Pending POs', value: stats?.pending_po_count, sub: 'Procurement', color: 'text-amber-600' },
    { label: 'Pending Reqs', value: stats?.pending_req_count, sub: 'Internal Distribution', color: 'text-blue-600' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 selection:bg-gray-900 selection:text-white" style={{ fontFamily: "'IBM Plex Sans', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;600&family=IBM+Plex+Sans:wght@400;500;600&display=swap');`}</style>

      <div className="flex justify-between items-end mb-10 pb-6 border-b-2 border-gray-900">
        <div>
          <h1 className="font-mono text-2xl font-bold tracking-tighter uppercase italic">IMS Dashboard</h1>
          <p className="text-xs text-gray-500 font-medium">System Status: <span className="text-green-600 uppercase">Operational</span></p>
        </div>
        <div className="text-right">
          <p className="font-mono text-xs text-gray-400 uppercase tracking-widest">Inventory Value</p>
          <p className="font-mono text-lg font-bold">KES {stats?.total_stock_value?.toLocaleString()}</p>
        </div>
      </div>

      {error && <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-600 font-mono text-xs text-red-700 uppercase">{error}</div>}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {CARDS.map((card) => (
          <div key={card.label} className="bg-gray-50 p-6 border border-gray-100 transition-all hover:border-gray-300">
            <p className="font-mono text-[10px] text-gray-400 uppercase tracking-widest mb-1">{card.label}</p>
            <p className={`font-mono text-4xl font-bold ${card.color}`}>{card.value || 0}</p>
            <p className="text-[10px] text-gray-400 mt-2 uppercase font-semibold">{card.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="border border-gray-900">
          <div className="bg-gray-900 text-white px-4 py-2 flex justify-between items-center">
            <h2 className="font-mono text-[10px] uppercase tracking-widest font-bold">Recent Transactions</h2>
            <span className="font-mono text-[10px] opacity-50">Live Feed</span>
          </div>
          <div className="p-2">
            {stats?.recent_transactions?.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {stats.recent_transactions.map((t) => (
                  <div key={t.id} className="p-3 flex justify-between items-center hover:bg-gray-50">
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{t.product_name}</p>
                      <p className="text-[10px] text-gray-400 uppercase font-mono">{t.user} • {t.date}</p>
                    </div>
                    <span className={`font-mono text-xs font-bold ${t.type === 'IN' ? 'text-green-600' : 'text-red-600'}`}>
                      {t.type === 'IN' ? '+' : ''}{t.change}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center py-12 font-mono text-[10px] text-gray-300 uppercase tracking-widest">No Recent Flux</p>
            )}
          </div>
        </div>

        <div className="border border-red-600">
          <div className="bg-red-600 text-white px-4 py-2 flex justify-between items-center">
            <h2 className="font-mono text-[10px] uppercase tracking-widest font-bold">Stock Alerts</h2>
            <div className="flex gap-1">
              <div className="w-1.5 h-1.5 bg-white rounded-full animate-ping" />
            </div>
          </div>
          <div className="p-2">
            {stats?.unresolved_alerts?.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {stats.unresolved_alerts.map((alert) => (
                  <div key={alert.id} className="p-3 flex justify-between items-center bg-red-50/30">
                    <span className="text-sm font-medium text-gray-700">{alert.product_name}</span>
                    <div className="text-right">
                      <p className="font-mono text-xs font-bold text-red-600">{alert.current_stock} units</p>
                      <p className="text-[9px] text-gray-400 uppercase font-bold">Min: {alert.threshold}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center italic text-gray-400 text-xs">Inventory levels within safe parameters.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}