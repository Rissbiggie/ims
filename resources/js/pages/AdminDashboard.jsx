import { useEffect, useState } from 'react';
import { apiClient } from '../api';

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: response } = await apiClient.get('/admin-dashboard');
        setData(response.data || response);
      } catch (err) {
        setError('Failed to load admin dashboard');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="flex flex-col items-center gap-2">
          <div className="w-5 h-5 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
          <span className="font-mono text-[10px] tracking-widest text-gray-400 uppercase">Loading...</span>
        </div>
      </div>
    );

  if (error)
    return (
      <div className="p-6">
        <div className="bg-red-50 border-l-4 border-red-600 p-4 font-mono text-xs text-red-700 uppercase">{error}</div>
      </div>
    );

  const overview = data?.overview || {};
  const metrics = data?.critical_metrics || {};
  const alerts = data?.alerts || [];
  const users = data?.user_statistics || {};
  const activity = data?.recent_activity || [];

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 selection:bg-gray-900 selection:text-white" style={{ fontFamily: "'IBM Plex Sans', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;600&family=IBM+Plex+Sans:wght@400;500;600&display=swap');`}</style>

      <div className="flex justify-between items-end mb-10 pb-6 border-b-2 border-gray-900">
        <div>
          <h1 className="font-mono text-2xl font-bold tracking-tighter uppercase italic">Admin Dashboard</h1>
          <p className="text-xs text-gray-500 font-medium">System-wide Overview & Control</p>
        </div>
        <div className="text-right">
          <p className="font-mono text-xs text-gray-400 uppercase tracking-widest">System Value</p>
          <p className="font-mono text-lg font-bold">KES {overview?.total_inventory_value?.toLocaleString()}</p>
        </div>
      </div>

      <div className="flex gap-1 mb-6 border-b border-gray-200">
        {['overview', 'users', 'activity', 'alerts'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 font-mono text-xs uppercase tracking-widest transition-all ${
              activeTab === tab ? 'border-b-2 border-gray-900 text-gray-900 font-bold' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <MetricCard label="Total Products" value={overview.total_products} sub="Active SKUs" />
            <MetricCard label="Inventory Value" value={`KES ${overview.total_inventory_value?.toLocaleString()}`} sub="Current" color="text-blue-600" />
            <MetricCard label="Low Stock" value={overview.low_stock_items} sub="Items" color="text-amber-600" />
            <MetricCard label="Out of Stock" value={overview.out_of_stock_items} sub="Critical" color={overview.out_of_stock_items > 0 ? 'text-red-600' : 'text-gray-900'} />
          </div>

          <div className="mb-8 bg-gray-50 p-6 border border-gray-100">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-mono text-[10px] uppercase tracking-widest font-bold">Inventory Health</h2>
              <span className="font-mono text-lg font-bold">{overview.inventory_health}%</span>
            </div>
            <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
              <div className="h-full bg-green-600" style={{ width: `${overview.inventory_health}%` }}></div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div className="border border-gray-900 bg-white">
              <div className="bg-gray-900 text-white px-4 py-2">
                <h3 className="font-mono text-[10px] uppercase tracking-widest font-bold">Pending Approvals</h3>
              </div>
              <div className="p-4 space-y-2">
                <div className="flex justify-between items-center p-2 bg-gray-50">
                  <span className="text-xs font-semibold">Purchase Orders</span>
                  <span className="font-mono font-bold text-lg">{metrics?.pending_approvals?.purchase_orders || 0}</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-gray-50">
                  <span className="text-xs font-semibold">Requisitions</span>
                  <span className="font-mono font-bold text-lg">{metrics?.pending_approvals?.requisitions || 0}</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-red-50">
                  <span className="text-xs font-semibold font-bold">Total Pending</span>
                  <span className="font-mono font-bold text-lg text-red-600">
                    {(metrics?.pending_approvals?.purchase_orders || 0) + (metrics?.pending_approvals?.requisitions || 0)}
                  </span>
                </div>
              </div>
            </div>

            <div className="border border-gray-900 bg-white">
              <div className="bg-gray-900 text-white px-4 py-2">
                <h3 className="font-mono text-[10px] uppercase tracking-widest font-bold">Today's Activity</h3>
              </div>
              <div className="p-4 space-y-2">
                <div className="flex justify-between items-center p-2 bg-green-50">
                  <span className="text-xs font-semibold">Stock In</span>
                  <span className="font-mono font-bold text-lg text-green-600">{metrics?.daily_transactions?.stock_in || 0}</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-red-50">
                  <span className="text-xs font-semibold">Stock Out</span>
                  <span className="font-mono font-bold text-lg text-red-600">{metrics?.daily_transactions?.stock_out || 0}</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-gray-50">
                  <span className="text-xs font-semibold">Total Transactions</span>
                  <span className="font-mono font-bold text-lg">
                    {(metrics?.daily_transactions?.stock_in || 0) + (metrics?.daily_transactions?.stock_out || 0)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 p-6 border border-gray-100 mb-8">
            <h2 className="font-mono text-[10px] uppercase tracking-widest font-bold mb-4">Financial Summary</h2>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="p-4 bg-white border border-gray-200">
                <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Monthly PO Value</p>
                <p className="font-mono text-xl font-bold">KES {data?.financial_summary?.monthly_po_value?.toLocaleString()}</p>
              </div>
              <div className="p-4 bg-white border border-gray-200">
                <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Current Inventory</p>
                <p className="font-mono text-xl font-bold">KES {data?.financial_summary?.current_inventory_value?.toLocaleString()}</p>
              </div>
              <div className="p-4 bg-white border border-gray-200">
                <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Avg Monthly Cost</p>
                <p className="font-mono text-xl font-bold">KES {data?.financial_summary?.avg_monthly_po_cost?.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'users' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="border border-gray-900">
            <div className="bg-gray-900 text-white px-4 py-2">
              <h3 className="font-mono text-[10px] uppercase tracking-widest font-bold">User Overview</h3>
            </div>
            <div className="p-4 space-y-3">
              <div className="flex justify-between p-2 bg-green-50">
                <span className="text-xs font-semibold">Active Users</span>
                <span className="font-mono font-bold text-lg text-green-600">{users?.total_active || 0}</span>
              </div>
              <div className="flex justify-between p-2 bg-gray-50">
                <span className="text-xs font-semibold">Inactive Users</span>
                <span className="font-mono font-bold">{users?.total_inactive || 0}</span>
              </div>
              <div className="flex justify-between p-2 bg-blue-50">
                <span className="text-xs font-semibold">Last 24h Logins</span>
                <span className="font-mono font-bold text-lg text-blue-600">{users?.last_24h_logins || 0}</span>
              </div>
              <div className="flex justify-between p-2 bg-purple-50">
                <span className="text-xs font-semibold">Last 7d Logins</span>
                <span className="font-mono font-bold text-lg text-purple-600">{users?.last_7d_logins || 0}</span>
              </div>
            </div>
          </div>

          <div className="border border-gray-900">
            <div className="bg-gray-900 text-white px-4 py-2">
              <h3 className="font-mono text-[10px] uppercase tracking-widest font-bold">By Role</h3>
            </div>
            <div className="p-4 space-y-2 divide-y">
              {Object.entries(users?.by_role || {}).map(([role, count]) => (
                <div key={role} className="flex justify-between py-2">
                  <span className="text-xs font-semibold capitalize">{role.replace(/_/g, ' ')}</span>
                  <span className="font-mono font-bold">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'activity' && (
        <div className="border border-gray-900">
          <div className="bg-gray-900 text-white px-4 py-2">
            <h3 className="font-mono text-[10px] uppercase tracking-widest font-bold">Recent Activity</h3>
          </div>
          <div className="divide-y divide-gray-100">
            {activity.length > 0 ? (
              activity.map((log, idx) => (
                <div key={idx} className="p-3 hover:bg-gray-50 transition-colors">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-semibold text-gray-800 uppercase">{log.description}</p>
                      <p className="text-[10px] text-gray-500 font-mono mt-1">{log.user} • {log.model}</p>
                    </div>
                    <span className="text-[10px] text-gray-400">{log.timestamp}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-12 text-center">
                <p className="font-mono text-[10px] text-gray-300 uppercase tracking-widest">No recent activity</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'alerts' && (
        <div className="space-y-4">
          {alerts.length > 0 ? (
            alerts.map((alert) => (
              <div key={alert.id} className={`border-l-4 p-4 ${alert.severity === 'CRITICAL' ? 'border-l-red-600 bg-red-50' : 'border-l-amber-600 bg-amber-50'}`}>
                <div className="flex justify-between items-start">
                  <div>
                    <p className={`text-sm font-bold ${alert.severity === 'CRITICAL' ? 'text-red-700' : 'text-amber-700'}`}>{alert.product}</p>
                    <p className="text-xs text-gray-600 mt-1">{alert.message}</p>
                  </div>
                  <span
                    className={`font-mono text-xs font-bold px-2 py-1 rounded ${
                      alert.severity === 'CRITICAL' ? 'bg-red-600 text-white' : 'bg-amber-600 text-white'
                    }`}
                  >
                    {alert.severity}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12">
              <p className="font-mono text-[10px] text-gray-300 uppercase tracking-widest">No alerts</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function MetricCard({ label, value, sub, color = 'text-gray-900' }) {
  return (
    <div className="bg-gray-50 p-6 border border-gray-100 transition-all hover:border-gray-300">
      <p className="font-mono text-[10px] text-gray-400 uppercase tracking-widest mb-1">{label}</p>
      <p className={`font-mono text-4xl font-bold ${color}`}>{value}</p>
      <p className="text-[10px] text-gray-400 mt-2 uppercase font-semibold">{sub}</p>
    </div>
  );
}