import { useEffect, useState } from 'react';
import { apiClient } from '../api';

export default function ClerkDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('tasks');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: response } = await apiClient.get('/clerk-dashboard');
        setData(response.data || response);
      } catch (err) {
        setError('Failed to load clerk dashboard');
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

  const tasks = data?.todays_tasks || [];
  const operations = data?.pending_operations || {};
  const stats = data?.quick_stats || {};
  const alerts = data?.stock_alerts || {};
  const activity = data?.recent_activity || [];

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 selection:bg-gray-900 selection:text-white" style={{ fontFamily: "'IBM Plex Sans', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;600&family=IBM+Plex+Sans:wght@400;500;600&display=swap');`}</style>

      <div className="flex justify-between items-end mb-10 pb-6 border-b-2 border-gray-900">
        <div>
          <h1 className="font-mono text-2xl font-bold tracking-tighter uppercase italic">Store Clerk Dashboard</h1>
          <p className="text-xs text-gray-500 font-medium">Daily Tasks & Operations</p>
        </div>
        <div className="text-right">
          <p className="font-mono text-xs text-gray-400 uppercase tracking-widest">Today's Activity</p>
          <p className="font-mono text-lg font-bold">{stats?.transactions_today || 0} Transactions</p>
        </div>
      </div>

      {alerts?.critical_count > 0 && (
        <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-600">
          <div className="flex justify-between items-center">
            <div>
              <p className="font-mono text-xs font-bold text-red-800 uppercase">⚠ {alerts.critical_count} CRITICAL ALERTS</p>
              <p className="text-sm text-red-700 mt-1">Items are out of stock!</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-8">
        <StatCard label="Transactions" value={stats?.transactions_today || 0} />
        <StatCard label="Stock In" value={stats?.stock_in_today || 0} color="text-green-600" />
        <StatCard label="Stock Out" value={stats?.stock_out_today || 0} color="text-red-600" />
        <StatCard label="Pending Reqs" value={stats?.pending_requisitions || 0} color="text-blue-600" />
        <StatCard label="Low Stock" value={stats?.low_stock_alerts || 0} color="text-amber-600" />
      </div>

      <div className="flex gap-1 mb-6 border-b border-gray-200">
        {['tasks', 'operations', 'alerts', 'activity'].map((tab) => (
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

      {activeTab === 'tasks' && (
        <div className="border border-gray-900">
          <div className="bg-gray-900 text-white px-4 py-2">
            <h3 className="font-mono text-[10px] uppercase tracking-widest font-bold">Today's Task Checklist</h3>
          </div>
          <div className="divide-y divide-gray-100">
            {tasks.length > 0 ? (
              tasks.map((task, idx) => (
                <div
                  key={idx}
                  className={`p-4 hover:bg-gray-50 transition-colors border-l-4 ${
                    task.priority === 'CRITICAL' ? 'border-l-red-600 bg-red-50' : task.priority === 'HIGH' ? 'border-l-amber-600 bg-amber-50' : 'border-l-gray-300'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex gap-2 items-center mb-1">
                        <span
                          className={`font-mono text-[10px] font-bold px-2 py-1 rounded ${
                            task.task_type === 'PO_RECEIPT'
                              ? 'bg-blue-100 text-blue-800'
                              : task.task_type === 'REQUISITION_ISSUE'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {task.task_type.replace(/_/g, ' ')}
                        </span>
                        <span
                          className={`font-mono text-[8px] font-bold px-2 py-1 rounded ${
                            task.priority === 'CRITICAL'
                              ? 'bg-red-200 text-red-800'
                              : task.priority === 'HIGH'
                              ? 'bg-amber-200 text-amber-800'
                              : 'bg-gray-200 text-gray-800'
                          }`}
                        >
                          {task.priority}
                        </span>
                      </div>
                      <p className="text-sm font-semibold">{task.title}</p>
                      <p className="text-[10px] text-gray-600 mt-1">{task.description}</p>
                      <p className="text-[10px] text-gray-400 font-mono mt-2">{task.created_at}</p>
                    </div>
                    <input type="checkbox" className="w-5 h-5 mt-1 cursor-pointer" />
                  </div>
                </div>
              ))
            ) : (
              <div className="p-12 text-center">
                <p className="font-mono text-[10px] text-gray-300 uppercase tracking-widest">✓ No tasks for today</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'operations' && (
        <div className="space-y-6">
          {(operations?.stock_transactions || []).length > 0 && (
            <div className="border border-gray-900">
              <div className="bg-gray-900 text-white px-4 py-2">
                <h3 className="font-mono text-[10px] uppercase tracking-widest font-bold">Pending Transactions</h3>
              </div>
              <div className="divide-y divide-gray-100">
                {(operations.stock_transactions || []).map((tx, idx) => (
                  <div key={idx} className="p-3 hover:bg-gray-50 transition-colors">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-semibold">{tx.product}</p>
                        <p className="text-[10px] text-gray-500 font-mono">{tx.performed_by} • {tx.date}</p>
                        <p className="text-xs text-gray-600 mt-1">Ref: {tx.reference}</p>
                      </div>
                      <div className="text-right">
                        <span className={`font-mono text-xs font-bold block ${tx.type === 'Receiving' ? 'text-green-600' : 'text-blue-600'}`}>{tx.type}</span>
                        <span className="font-mono text-lg font-bold">{tx.quantity}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {(operations?.requisition_items || []).length > 0 && (
            <div className="border border-gray-900">
              <div className="bg-gray-900 text-white px-4 py-2">
                <h3 className="font-mono text-[10px] uppercase tracking-widest font-bold">Requisition Items to Issue</h3>
              </div>
              <div className="divide-y divide-gray-100">
                {(operations.requisition_items || []).map((item, idx) => (
                  <div
                    key={idx}
                    className={`p-3 hover:bg-gray-50 transition-colors ${item.status === 'insufficient_stock' ? 'bg-red-50' : ''}`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-semibold">{item.product}</p>
                        <p className="text-[10px] text-gray-500">For: {item.department}</p>
                        <p className="text-[10px] text-gray-500 font-mono">{item.requested_at}</p>
                      </div>
                      <div className="text-right">
                        <div
                          className={`px-2 py-1 rounded text-[10px] font-bold mb-2 ${
                            item.status === 'ready' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {item.status === 'ready' ? 'READY' : 'INSUFFICIENT'}
                        </div>
                        <div className="font-mono text-xs">
                          <span className="font-bold">{item.quantity_requested}</span>
                          <span className="text-gray-500"> / {item.quantity_available}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {(operations?.stock_transactions || []).length === 0 && (operations?.requisition_items || []).length === 0 && (
            <div className="text-center py-12 border border-gray-100 rounded">
              <p className="font-mono text-[10px] text-gray-300 uppercase tracking-widest">No pending operations</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'alerts' && (
        <div className="space-y-4">
          {(alerts?.critical_alerts || []).length > 0 && (
            <div>
              <h3 className="font-mono text-[10px] uppercase tracking-widest font-bold mb-3 text-red-600">⚠ CRITICAL ALERTS ({alerts.critical_count})</h3>
              <div className="space-y-2">
                {alerts.critical_alerts.map((alert, idx) => (
                  <div key={idx} className="border-l-4 border-l-red-600 bg-red-50 p-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-bold text-red-800">{alert.product}</p>
                        <p className="text-xs text-red-700 mt-1">{alert.message}</p>
                        <p className="text-[10px] text-gray-600 font-mono mt-1">SKU: {alert.sku} | Stock: {alert.current_stock}</p>
                      </div>
                      <span className="font-mono text-[10px] text-gray-500">{alert.created_at}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {(alerts?.warning_alerts || []).length > 0 && (
            <div>
              <h3 className="font-mono text-[10px] uppercase tracking-widest font-bold mb-3 text-amber-600">⚡ WARNINGS ({alerts.warning_count})</h3>
              <div className="space-y-2">
                {alerts.warning_alerts.map((alert, idx) => (
                  <div key={idx} className="border-l-4 border-l-amber-600 bg-amber-50 p-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-semibold text-amber-800">{alert.product}</p>
                        <p className="text-[10px] text-amber-700 mt-1">{alert.message}</p>
                        <p className="text-[10px] text-gray-600 font-mono mt-1">
                          Stock: {alert.current_stock} | Reorder Level: {alert.reorder_level}
                        </p>
                      </div>
                      <span className="font-mono text-[10px] text-gray-500">{alert.created_at}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {(alerts?.critical_alerts || []).length === 0 && (alerts?.warning_alerts || []).length === 0 && (
            <div className="text-center py-12 border border-gray-100 rounded">
              <p className="font-mono text-[10px] text-gray-300 uppercase tracking-widest">✓ No alerts</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'activity' && (
        <div className="border border-gray-900">
          <div className="bg-gray-900 text-white px-4 py-2">
            <h3 className="font-mono text-[10px] uppercase tracking-widest font-bold">Recent Activity (Last 2 Days)</h3>
          </div>
          <div className="divide-y divide-gray-100">
            {activity.length > 0 ? (
              activity.map((log, idx) => (
                <div key={idx} className="p-3 hover:bg-gray-50 transition-colors">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-semibold">{log.product}</p>
                      <p className="text-[10px] text-gray-500">{log.by} • {log.date_time}</p>
                    </div>
                    <div className="text-right">
                      <span className={`font-mono text-xs font-bold block mb-1 ${log.type === 'stock_in' ? 'text-green-600' : 'text-red-600'}`}>
                        {log.type === 'stock_in' ? 'IN' : 'OUT'}
                      </span>
                      <span className="font-mono text-sm font-bold">{log.quantity}</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-12 text-center">
                <p className="font-mono text-[10px] text-gray-300 uppercase tracking-widest">No activity</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, color = 'text-gray-900' }) {
  return (
    <div className="bg-gray-50 p-4 border border-gray-100 transition-all hover:border-gray-300">
      <p className="font-mono text-[9px] text-gray-400 uppercase tracking-widest mb-1">{label}</p>
      <p className={`font-mono text-3xl font-bold ${color}`}>{value}</p>
    </div>
  );
}