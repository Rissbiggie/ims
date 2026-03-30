import { useEffect, useState } from "react";
import { reportsApi } from "../api";

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState("inventory");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  const [dateRange, setDateRange] = useState({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0]
  });

  const [data, setData] = useState({
    inventory: [], 
    inventoryTotal: 0,
    lowStock: [], 
    movement: { transactions: [], summary: { total_in: 0, total_out: 0, net_change: 0 } },
    suppliers: [], 
    trend: [], 
    topProducts: [], 
    forecast: [], 
    categories: []
  });

  const TABS = [
    { id: "inventory", label: "Valuation" },
    { id: "movement",  label: "Movement" },
    { id: "lowstock",  label: "Alerts" },
    { id: "trend",     label: "Trend" },
    { id: "top",       label: "Top Movers" },
  ];

  useEffect(() => { loadReport(); }, [activeTab]);

  const loadReport = async () => {
    try {
      setLoading(true);
      setError("");
      const { from, to } = dateRange;
      let res;

      switch (activeTab) {
        case "inventory":  
          res = await reportsApi.inventoryValuation(); 
          setData(p => ({ ...p, inventory: res.data.items, inventoryTotal: res.data.total_value })); 
          break;
        case "lowstock":   
          res = await reportsApi.lowStock(); 
          setData(p => ({ ...p, lowStock: res.data.items })); 
          break;
        case "movement":   
          res = await reportsApi.stockMovement(from, to); 
          setData(p => ({ ...p, movement: res.data })); 
          break;
        case "trend":      
          res = await reportsApi.monthlyTrend(); 
          setData(p => ({ ...p, trend: res.data })); 
          break;
        case "top":        
          res = await reportsApi.topProducts(); 
          setData(p => ({ ...p, topProducts: res.data })); 
          break;
      }
    } catch (err) {
      setError(err.response?.data?.message || "SERVER_ERROR: Service unavailable.");
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = async () => {
    try {
      setLoading(true);
      setError("");
      let response;
      const { from, to } = dateRange;

      if (activeTab === "inventory") {
        response = await reportsApi.printInventoryPdf();
      } else if (activeTab === "movement") {
        response = await reportsApi.printMovementPdf(from, to);
      } else {
        window.print();
        return;
      }

      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${activeTab}_report_${new Date().toISOString().split('T')[0]}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError("PDF_EXPORT_FAILED: Backend engine not responding.");
    } finally {
      setLoading(false);
    }
  };

  // Reusable UI Components
  const Th = ({ children, right }) => (
    <th className={`px-4 py-4 font-mono text-[10px] tracking-widest uppercase text-gray-400 border-b border-gray-200 bg-gray-50/50 ${right ? "text-right" : "text-left"}`}>
      {children}
    </th>
  );

  const Td = ({ children, mono, right, className = "" }) => (
    <td className={`px-4 py-4 text-sm border-b border-gray-100 ${mono ? "font-mono text-xs" : ""} ${right ? "text-right" : ""} ${className}`}>
      {children}
    </td>
  );

  const KSH = (val) => new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KSH' }).format(val);

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 antialiased min-h-screen bg-[#fafafa]" style={{ fontFamily: "'IBM Plex Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@300;400;600&display=swap');
        @media print { .no-print { display: none !important; } body { background: white; } }
      `}</style>

      {/* Header Section */}
      <div className="flex justify-between items-end mb-12 no-print">
        <div className="border-l-4 border-black pl-6">
          <h1 className="font-mono text-4xl font-bold tracking-tighter text-gray-900">REPORTS</h1>
        </div>
        
        <div className="flex gap-3">
          <button onClick={handlePrint} disabled={loading} className="font-mono text-[10px] font-bold px-6 py-3 border border-gray-200 rounded hover:bg-white shadow-sm transition-all disabled:opacity-50">
            {loading ? "GENERATING..." : "DOWNLOAD_PDF"}
          </button>
          <button onClick={loadReport} disabled={loading} className="font-mono text-[10px] font-bold px-6 py-3 bg-black text-white rounded hover:bg-gray-800 shadow-lg transition-all disabled:opacity-50">
            EXECUTE_QUERY
          </button>
        </div>
      </div>

      {/* Tabs & Filters */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-10 border-b border-gray-200 no-print">
        <div className="flex flex-wrap">
          {TABS.map(({ id, label }) => (
            <button key={id} onClick={() => setActiveTab(id)} className={`font-mono text-[10px] tracking-widest px-6 py-4 border-b-2 transition-all ${activeTab === id ? "border-black text-black font-bold" : "border-transparent text-gray-400 hover:text-gray-600"}`}>
              {label.toUpperCase()}
            </button>
          ))}
        </div>
        
        {activeTab === "movement" && (
          <div className="flex items-center gap-3 bg-white p-2 px-4 rounded-full border border-gray-200 shadow-sm mb-4 md:mb-0">
            <input type="date" value={dateRange.from} onChange={(e) => setDateRange({...dateRange, from: e.target.value})} className="bg-transparent font-mono text-[10px] focus:outline-none" />
            <span className="text-gray-300 font-mono">--&gt;</span>
            <input type="date" value={dateRange.to} onChange={(e) => setDateRange({...dateRange, to: e.target.value})} className="bg-transparent font-mono text-[10px] focus:outline-none" />
          </div>
        )}
      </div>

      {error && <div className="mb-8 p-4 bg-red-50 border border-red-100 text-red-600 font-mono text-[10px] rounded flex justify-between">
        <span>{error}</span>
        <button onClick={() => setError("")} className="underline font-bold italic">DISMISS</button>
      </div>}

      {loading ? (
        <div className="py-40 text-center">
            <div className="inline-block w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="font-mono text-[10px] text-gray-400 tracking-[0.3em] uppercase">Processing_Data_Stream...</p>
        </div>
      ) : (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
          
          {/* 1. Inventory Valuation View */}
          {activeTab === "inventory" && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-2 bg-black p-10 rounded shadow-2xl text-white">
                    <p className="font-mono text-[10px] text-gray-500 uppercase tracking-[0.3em] mb-4">Total_Inventory_Value</p>
                    <h2 className="text-5xl font-bold tracking-tighter">{KSH(data.inventoryTotal)}</h2>
                </div>
                <div className="bg-white border border-gray-200 p-10 rounded flex flex-col justify-center">
                    <p className="font-mono text-[10px] text-gray-400 uppercase mb-2">High_Value_SKU</p>
                    <p className="text-xl font-bold">{data.inventory[0]?.name || "N/A"}</p>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded shadow-sm overflow-hidden">
                <table className="w-full text-left">
                  <thead>
                    <tr><Th>Product_Identifier</Th><Th>Category</Th><Th right>Qty</Th><Th right>Total_KSH</Th></tr>
                  </thead>
                  <tbody>
                    {data.inventory?.length > 0 ? data.inventory.map(item => (
                      <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                        <Td><div>{item.name}</div><div className="text-[10px] font-mono text-gray-400">{item.sku}</div></Td>
                        <Td><span className="text-[10px] font-mono bg-gray-100 px-2 py-1 rounded">{item.category}</span></Td>
                        <Td mono right>{item.quantity_on_hand}</Td>
                        <Td mono right className="font-bold">{Number(item.total_value).toLocaleString()}</Td>
                      </tr>
                    )) : <tr><Td colSpan="4" className="text-center py-20 text-gray-300 italic uppercase">No_Inventory_Data</Td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 2. Stock Movement View */}
          {activeTab === "movement" && (
            <div className="space-y-8">
              <div className="grid grid-cols-3 gap-8">
                <div className="p-8 bg-white border border-gray-100 rounded shadow-sm">
                    <p className="font-mono text-[10px] text-gray-400 mb-2 uppercase">Inbound</p>
                    <p className="text-3xl font-bold text-green-600">+{data.movement.summary?.total_in || 0}</p>
                </div>
                <div className="p-8 bg-white border border-gray-100 rounded shadow-sm">
                    <p className="font-mono text-[10px] text-gray-400 mb-2 uppercase">Outbound</p>
                    <p className="text-3xl font-bold text-red-600">-{data.movement.summary?.total_out || 0}</p>
                </div>
                <div className="p-8 bg-gray-50 border border-gray-200 rounded shadow-sm">
                    <p className="font-mono text-[10px] text-gray-500 mb-2 uppercase">Net_Change</p>
                    <p className="text-3xl font-bold">{data.movement.summary?.net_change || 0}</p>
                </div>
              </div>
              <div className="bg-white border border-gray-200 rounded shadow-sm overflow-hidden">
                <table className="w-full">
                  <thead><tr><Th>Timestamp</Th><Th>Product</Th><Th right>Change</Th></tr></thead>
                  <tbody>
                    {data.movement.transactions?.length > 0 ? data.movement.transactions.map(m => (
                      <tr key={m.id} className="hover:bg-gray-50">
                        <Td mono className="text-gray-400">{m.transaction_date}</Td>
                        <Td className="font-medium">{m.product?.name}</Td>
                        <Td mono right className={m.quantity_change > 0 ? "text-green-600" : "text-red-600"}>{m.quantity_change > 0 ? `+${m.quantity_change}` : m.quantity_change}</Td>
                      </tr>
                    )) : <tr><Td colSpan="3" className="text-center py-20 text-gray-300 italic uppercase">No_Movement_Logged</Td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 3. Alerts View */}
          {activeTab === "lowstock" && (
            <div className="bg-white border border-red-100 rounded shadow-sm overflow-hidden">
              <table className="w-full text-left">
                <thead><tr><Th>Item_Name</Th><Th>On_Hand</Th><Th right>Min_Limit</Th></tr></thead>
                <tbody>
                  {data.lowStock?.length > 0 ? data.lowStock.map(item => (
                    <tr key={item.id} className="hover:bg-red-50/30">
                      <Td className="font-bold text-red-600">{item.name}</Td>
                      <Td mono className="text-red-500">{item.quantity_on_hand}</Td>
                      <Td mono right className="text-gray-400">{item.min_stock_level}</Td>
                    </tr>
                  )) : <tr><Td colSpan="3" className="py-20 text-center text-gray-300 font-mono italic uppercase">All_Stock_Levels_Nominal</Td></tr>}
                </tbody>
              </table>
            </div>
          )}

          {/* 4. Trend View */}
          {activeTab === "trend" && (
            <div className="bg-white border border-gray-200 rounded shadow-sm overflow-hidden">
              <table className="w-full text-left">
                <thead><tr><Th>Month_Year</Th><Th right>In_Flow</Th><Th right>Out_Flow</Th></tr></thead>
                <tbody>
                  {data.trend?.length > 0 ? data.trend.map((t, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <Td className="font-mono text-xs italic">{t.month}</Td>
                      <Td mono right className="text-green-600">+{t.total_in}</Td>
                      <Td mono right className="text-red-600">-{t.total_out}</Td>
                    </tr>
                  )) : <tr><Td colSpan="3" className="py-20 text-center text-gray-300 font-mono italic uppercase">Insufficient_Time_Series_Data</Td></tr>}
                </tbody>
              </table>
            </div>
          )}

          {/* 5. Top Movers View */}
          {activeTab === "top" && (
            <div className="bg-white border border-gray-200 rounded shadow-sm overflow-hidden">
              <table className="w-full text-left">
                <thead><tr><Th>Product_Identifier</Th><Th right>Activity_Count</Th></tr></thead>
                <tbody>
                  {data.topProducts?.length > 0 ? data.topProducts.map((p, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <Td className="font-medium uppercase tracking-tight">{p.name}</Td>
                      <Td mono right className="font-bold text-black bg-gray-50">{p.transactions_count}</Td>
                    </tr>
                  )) : <tr><Td colSpan="2" className="py-20 text-center text-gray-300 font-mono italic uppercase">No_Frequent_Movers_Found</Td></tr>}
                </tbody>
              </table>
            </div>
          )}

        </div>
      )}
    </div>
  );
}