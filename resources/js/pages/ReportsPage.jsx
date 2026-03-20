import { useEffect, useState } from "react";
import { reportsApi } from "../api";

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState("inventory");
  const [inventory, setInventory] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [movement, setMovement] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [trend, setTrend] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => { loadReport(); }, [activeTab]);

  const loadReport = async () => {
    try {
      setLoading(true);
      setError("");
      if (activeTab === "inventory") { const res = await reportsApi.inventoryValuation(); setInventory(res.data.items || []); }
      if (activeTab === "lowstock")  { const res = await reportsApi.lowStock();           setLowStock(res.data.items || []); }
      if (activeTab === "movement")  { const res = await reportsApi.stockMovement();      setMovement(res.data.data  || []); }
      if (activeTab === "suppliers") { const res = await reportsApi.supplierPerformance();setSuppliers(res.data.data || []); }
      if (activeTab === "trend")     { const res = await reportsApi.monthlyTrend();       setTrend(res.data.data    || []); }
    } catch (err) {
      setError("Failed to load report.");
    } finally {
      setLoading(false);
    }
  };

  const TABS = [
    { id: "inventory", label: "Inventory Valuation" },
    { id: "lowstock",  label: "Low Stock"           },
    { id: "movement",  label: "Stock Movement"      },
    { id: "suppliers", label: "Supplier Performance"},
    { id: "trend",     label: "Monthly Trend"       },
  ];

  const Th = ({ children, right }) => (
    <th className={`px-4 py-3 font-mono text-xs tracking-widest uppercase text-gray-400 border-b border-gray-200 ${right ? "text-right" : "text-left"}`}>
      {children}
    </th>
  );

  const Td = ({ children, mono, right, className = "" }) => (
    <td className={`px-4 py-3 text-sm border-b border-gray-100 ${mono ? "font-mono" : ""} ${right ? "text-right" : ""} ${className}`}>
      {children}
    </td>
  );

  const movementColor = (type) => {
    if (!type) return "";
    const t = type.toLowerCase();
    if (t === "in"  || t === "receipt"  || t === "purchase") return "bg-green-50 text-green-700 border border-green-200";
    if (t === "out" || t === "dispatch" || t === "sale")     return "bg-red-50 text-red-700 border border-red-200";
    return "bg-gray-100 text-gray-600 border border-gray-200";
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10"
         style={{ fontFamily: "'IBM Plex Sans', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@300;400;500&display=swap');`}</style>

      {/* Masthead */}
      <div className="flex justify-between items-end mb-8 pb-4 border-b-2 border-gray-900">
        <div>
          <p className="font-mono text-xs tracking-widest text-gray-400 uppercase mb-1">Analytics</p>
          <h1 className="font-mono text-2xl font-semibold tracking-tight text-gray-900">Reports</h1>
        </div>
        <button
          onClick={loadReport}
          className="font-mono text-xs font-medium tracking-wide px-4 py-2 rounded bg-gray-900 text-white hover:bg-gray-700 transition-all"
        >
          ↻ Refresh
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 font-mono text-xs px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {/* Tab bar */}
      <div className="flex flex-wrap gap-1 mb-8 border-b border-gray-200 pb-px">
        {TABS.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`font-mono text-xs tracking-wide px-4 py-2.5 border-b-2 -mb-px transition-all ${
              activeTab === id
                ? "border-gray-900 text-gray-900 font-medium"
                : "border-transparent text-gray-400 hover:text-gray-600 hover:border-gray-300"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <span className="font-mono text-xs tracking-widest text-gray-300 uppercase animate-pulse">
            Loading report...
          </span>
        </div>
      )}

      {/* ── Inventory Valuation ── */}
      {!loading && activeTab === "inventory" && (
        <div className="bg-white border border-gray-200 rounded-md overflow-hidden">
          <table className="w-full border-collapse">
            <thead className="bg-gray-50">
              <tr>
                <Th>Product</Th>
                <Th right>Quantity</Th>
                <Th right>Unit Cost</Th>
                <Th right>Total Value</Th>
              </tr>
            </thead>
            <tbody>
              {inventory.length === 0 ? (
                <tr><td colSpan={4} className="text-center py-10 font-mono text-xs text-gray-300 uppercase tracking-widest">No data available.</td></tr>
              ) : inventory.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                  <Td>{item.name}</Td>
                  <Td mono right>{item.quantity_on_hand}</Td>
                  <Td mono right>{item.unit_cost}</Td>
                  <Td mono right className="font-medium text-gray-900">{item.total_value}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Low Stock ── */}
      {!loading && activeTab === "lowstock" && (
        <div className="bg-white border border-gray-200 rounded-md overflow-hidden">
          <table className="w-full border-collapse">
            <thead className="bg-gray-50">
              <tr>
                <Th>Product</Th>
                <Th right>Current Stock</Th>
                <Th right>Reorder Level</Th>
                <Th right>Variance</Th>
              </tr>
            </thead>
            <tbody>
              {lowStock.length === 0 ? (
                <tr><td colSpan={4} className="text-center py-10 font-mono text-xs text-gray-300 uppercase tracking-widest">No low-stock items.</td></tr>
              ) : lowStock.map((item) => {
                const variance = item.quantity_on_hand - item.reorder_level;
                return (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <Td>
                      <div className="flex items-center gap-2">
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />
                        {item.name}
                      </div>
                    </Td>
                    <Td mono right className="text-red-700 font-medium">{item.quantity_on_hand}</Td>
                    <Td mono right className="text-gray-500">{item.reorder_level}</Td>
                    <Td mono right className="text-red-600 font-medium">{variance}</Td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Stock Movement ── */}
      {!loading && activeTab === "movement" && (
        <div className="bg-white border border-gray-200 rounded-md overflow-hidden">
          <table className="w-full border-collapse">
            <thead className="bg-gray-50">
              <tr>
                <Th>Product</Th>
                <Th>Type</Th>
                <Th right>Quantity</Th>
                <Th right>Date</Th>
              </tr>
            </thead>
            <tbody>
              {movement.length === 0 ? (
                <tr><td colSpan={4} className="text-center py-10 font-mono text-xs text-gray-300 uppercase tracking-widest">No movement data.</td></tr>
              ) : movement.map((m) => (
                <tr key={m.id} className="hover:bg-gray-50 transition-colors">
                  <Td>{m.product?.name || "—"}</Td>
                  <Td>
                    <span className={`font-mono text-xs font-medium px-2 py-1 rounded uppercase tracking-wide ${movementColor(m.type)}`}>
                      {m.type}
                    </span>
                  </Td>
                  <Td mono right>{m.quantity}</Td>
                  <Td mono right className="text-gray-400">
                    {new Date(m.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Supplier Performance ── */}
      {!loading && activeTab === "suppliers" && (
        <div className="bg-white border border-gray-200 rounded-md overflow-hidden">
          <table className="w-full border-collapse">
            <thead className="bg-gray-50">
              <tr>
                <Th>Supplier</Th>
                <Th right>Orders</Th>
                <Th right>Total Value</Th>
              </tr>
            </thead>
            <tbody>
              {suppliers.length === 0 ? (
                <tr><td colSpan={3} className="text-center py-10 font-mono text-xs text-gray-300 uppercase tracking-widest">No supplier data.</td></tr>
              ) : suppliers.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                  <Td>
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded bg-gray-100 flex items-center justify-center font-mono text-xs font-medium text-gray-500 flex-shrink-0">
                        {(s.name || "?")[0].toUpperCase()}
                      </div>
                      {s.name}
                    </div>
                  </Td>
                  <Td mono right>{s.orders_count}</Td>
                  <Td mono right className="font-medium text-gray-900">{s.total_value}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Monthly Trend ── */}
      {!loading && activeTab === "trend" && (
        <div className="bg-white border border-gray-200 rounded-md overflow-hidden">
          <table className="w-full border-collapse">
            <thead className="bg-gray-50">
              <tr>
                <Th>Month</Th>
                <Th right>Stock In</Th>
                <Th right>Stock Out</Th>
                <Th right>Net</Th>
              </tr>
            </thead>
            <tbody>
              {trend.length === 0 ? (
                <tr><td colSpan={4} className="text-center py-10 font-mono text-xs text-gray-300 uppercase tracking-widest">No trend data.</td></tr>
              ) : trend.map((t, i) => {
                const net = (t.stock_in || 0) - (t.stock_out || 0);
                return (
                  <tr key={i} className="hover:bg-gray-50 transition-colors">
                    <Td className="font-medium">{t.month}</Td>
                    <Td mono right className="text-green-700">{t.stock_in}</Td>
                    <Td mono right className="text-red-600">{t.stock_out}</Td>
                    <Td mono right className={`font-medium ${net >= 0 ? "text-green-700" : "text-red-600"}`}>
                      {net >= 0 ? "+" : ""}{net}
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}