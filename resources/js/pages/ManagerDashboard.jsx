import { useEffect, useState } from 'react';
import { apiClient } from '../api';

export default function ManagerDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: response } = await apiClient.get('/manager-dashboard');
        setData(response.data || response);
      } catch (err) {
        setError('Failed to load manager dashboard');
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

  const metrics = data?.key_metrics || {};
  const approvals = data?.approval_queue || [];
  const procurement = data?.procurement_metrics || {};
  const stock = data?.stock_overview || {};
  const transactions = data?.recent_transactions || [];

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 selection:bg-gray-900 selection:text-white" style={{ fontFamily: "'IBM Plex Sans', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;600&family=IBM+Plex+Sans:wght@400;500;600&display=swap');`}</style>

      <div className="flex justify-between items-end mb-10 pb-6 border-b-2 border-gray-900">
        <div>
          <h1 className="font-mono text-2xl font-bold tracking-tighter uppercase italic">Manager Dashboard</h1>
          <p className="text-xs text-gray-500 font-medium">Procurement & Operational Oversight</p>
        </div>
        <div className="text-right">
          <p className="font-mono text-xs text-gray-400 uppercase tracking-widest">Inventory Value</p>
          <p className="font-mono text-lg font-bold">KES {stock?.total_inventory_value?.toLocaleString()}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <MetricCard
          label="Pending POs"
          value={metrics?.pending_approvals?.purchase_orders || 0}
          color={metrics?.pending_approvals?.purchase_orders > 0 ? 'text-amber-600' : 'text-gray-900'}
        />
        <MetricCard
          label="Pending Reqs"
          value={metrics?.pending_approvals?.requisitions || 0}
          color={metrics?.pending_approvals?.requisitions > 0 ? 'text-blue-600' : 'text-gray-900'}
        />
        <MetricCard
          label="Total Approvals"
          value={metrics?.pending_approvals?.total || 0}
          color={metrics?.pending_approvals?.total > 0 ? 'text-red-600' : 'text-gray-900'}
        />
        <MetricCard label="Low Stock" value={stock?.low_stock_items || 0} color="text-orange-600" />
      </div>

      <div className="flex gap-1 mb-6 border-b border-gray-200">
        {['overview', 'approvals', 'procurement', 'transactions'].map((tab) => (
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
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="border border-gray-900">
              <div className="bg-gray-900 text-white px-4 py-2">
                <h3 className="font-mono text-[10px] uppercase tracking-widest font-bold">Today's Activity</h3>
              </div>
              <div className="p-4 space-y-2">
                <div className="flex justify-between p-2 bg-amber-50">
                  <span className="text-xs font-semibold">POs Created</span>
                  <span className="font-mono font-bold text-lg">{metrics?.todays_activity?.po_created || 0}</span>
                </div>
                <div className="flex justify-between p-2 bg-blue-50">
                  <span className="text-xs font-semibold">Requisitions</span>
                  <span className="font-mono font-bold text-lg">{metrics?.todays_activity?.requisitions_created || 0}</span>
                </div>
                <div className="flex justify-between p-2 bg-gray-50">
                  <span className="text-xs font-semibold">Stock Movements</span>
                  <span className="font-mono font-bold text-lg">{metrics?.todays_activity?.stock_movements || 0}</span>
                </div>
              </div>
            </div>

            <div className="border border-gray-900">
              <div className="bg-gray-900 text-white px-4 py-2">
                <h3 className="font-mono text-[10px] uppercase tracking-widest font-bold">Monthly Summary</h3>
              </div>
              <div className="p-4 space-y-2">
                <div className="flex justify-between p-2 bg-gray-50">
                  <span className="text-xs font-semibold">PO Value Approved</span>
                  <span className="font-mono font-bold">KES {(metrics?.monthly_summary?.po_value_approved || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between p-2 bg-gray-50">
                  <span className="text-xs font-semibold">Requisitions Issued</span>
                  <span className="font-mono font-bold text-lg">{metrics?.monthly_summary?.requisitions_issued || 0}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 p-6 border border-gray-100">
            <h2 className="font-mono text-[10px] uppercase tracking-widest font-bold mb-3">Procurement Status</h2>
            <p className="text-sm text-gray-600 mb-3">Monthly spend vs. target budget</p>
            <div className="w-full bg-gray-200 h-3 rounded-full overflow-hidden">
              <div
                className={`h-full ${procurement?.on_target ? 'bg-green-600' : 'bg-red-600'}`}
                style={{ width: `${Math.min(data?.budget_status?.percentage_used || 0, 100)}%` }}
              ></div>
            </div>
            <div className="flex justify-between mt-3 font-mono text-xs">
              <span>
                KES {(data?.budget_status?.monthly_spend || 0).toLocaleString()} / {(data?.budget_status?.estimated_budget || 0).toLocaleString()}
              </span>
              <span className={data?.budget_status?.percentage_used > 80 ? 'text-red-600 font-bold' : 'text-gray-600'}>
                {(data?.budget_status?.percentage_used || 0).toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'approvals' && (
        <div className="border border-gray-900">
          <div className="bg-gray-900 text-white px-4 py-2">
            <h3 className="font-mono text-[10px] uppercase tracking-widest font-bold">Approval Queue ({approvals.length})</h3>
          </div>
          <div className="divide-y divide-gray-100">
            {approvals.length > 0 ? (
              approvals.map((item, idx) => (
                <div key={idx} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="flex gap-2 items-center">
                        <span
                          className={`font-mono text-[10px] font-bold px-2 py-1 rounded ${
                            item.type === 'Purchase Order' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {item.type}
                        </span>
                        <span
                          className={`font-mono text-[8px] font-bold px-2 py-1 rounded ${
                            item.priority === 'HIGH' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {item.priority}
                        </span>
                      </div>
                      <p className="text-sm font-semibold mt-2">{item.supplier || item.department}</p>
                      <p className="text-[10px] text-gray-500 mt-1">{item.created_by} • {item.created_at}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-mono text-lg font-bold">{item.total_value || item.item_count}</p>
                      <p className="text-[10px] text-gray-500">{item.item_count} items</p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-12 text-center">
                <p className="font-mono text-[10px] text-gray-300 uppercase tracking-widest">No pending approvals</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'procurement' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="border border-gray-900">
              <div className="bg-gray-900 text-white px-4 py-2">
                <h3 className="font-mono text-[10px] uppercase tracking-widest font-bold">Performance</h3>
              </div>
              <div className="p-4 space-y-3">
                <div className="flex justify-between items-center p-2 bg-gray-50">
                  <span className="text-xs font-semibold">Current Month</span>
                  <span className="font-mono font-bold">KES {(procurement?.current_month_value || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-gray-50">
                  <span className="text-xs font-semibold">Previous Month</span>
                  <span className="font-mono font-bold">KES {(procurement?.previous_month_value || 0).toLocaleString()}</span>
                </div>
                <div className={`flex justify-between items-center p-2 ${procurement?.growth_percentage >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
                  <span className="text-xs font-semibold">Growth</span>
                  <span className={`font-mono font-bold text-lg ${procurement?.growth_percentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {procurement?.growth_percentage >= 0 ? '+' : ''}{procurement?.growth_percentage}%
                  </span>
                </div>
              </div>
            </div>

            <div className="border border-gray-900">
              <div className="bg-gray-900 text-white px-4 py-2">
                <h3 className="font-mono text-[10px] uppercase tracking-widest font-bold">Top Suppliers</h3>
              </div>
              <div className="p-4 space-y-2 divide-y">
                {(procurement?.top_suppliers || []).map((supplier, idx) => (
                  <div key={idx} className="py-2">
                    <p className="text-xs font-semibold">{supplier.name}</p>
                    <div className="flex justify-between text-[10px] text-gray-600 mt-1">
                      <span>{supplier.orders_count} orders</span>
                      <span>Avg: KES {supplier.avg_order_value?.toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'transactions' && (
        <div className="border border-gray-900">
          <div className="bg-gray-900 text-white px-4 py-2">
            <h3 className="font-mono text-[10px] uppercase tracking-widest font-bold">Recent Transactions (Last 7 Days)</h3>
          </div>
          <div className="divide-y divide-gray-100">
            {transactions.length > 0 ? (
              transactions.map((tx, idx) => (
                <div key={idx} className="p-3 hover:bg-gray-50 transition-colors">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-semibold">{tx.product}</p>
                      <p className="text-[10px] text-gray-500 font-mono">{tx.performed_by} • {tx.date} {tx.time}</p>
                    </div>
                    <span className={`font-mono text-xs font-bold ${tx.type === 'stock_in' ? 'text-green-600' : 'text-red-600'}`}>
                      {tx.type === 'stock_in' ? '↓' : '↑'} {tx.quantity}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-12 text-center">
                <p className="font-mono text-[10px] text-gray-300 uppercase tracking-widest">No transactions</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function MetricCard({ label, value, color = 'text-gray-900' }) {
  return (
    <div className="bg-gray-50 p-6 border border-gray-100 transition-all hover:border-gray-300">
      <p className="font-mono text-[10px] text-gray-400 uppercase tracking-widest mb-1">{label}</p>
      <p className={`font-mono text-4xl font-bold ${color}`}>{value}</p>
    </div>
  );
}