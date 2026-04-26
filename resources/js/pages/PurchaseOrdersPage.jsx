import { useEffect, useState } from 'react';
import { purchaseOrdersApi, suppliersApi, productsApi } from '../api';

export default function PurchaseOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [items, setItems] = useState([]);
  const [formData, setFormData] = useState({
    supplier_id: '',
    expected_delivery_date: '',
    notes: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const [ordersRes, suppliersRes, productsRes] = await Promise.all([
        purchaseOrdersApi.list(),
        suppliersApi.list(),
        productsApi.list(),
      ]);
      setOrders(ordersRes.data?.data || ordersRes.data || []);
      setSuppliers(suppliersRes.data?.data || suppliersRes.data || []);
      setProducts(productsRes.data?.data || productsRes.data || []);
    } catch (err) {
      setError('Failed to load procurement data.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = () => setItems([...items, { product_id: '', quantity_ordered: '', unit_price: '' }]);
  const handleRemoveItem = (i) => setItems(items.filter((_, idx) => idx !== i));
  const handleItemChange = (i, field, value) => {
    const updated = [...items];
    updated[i][field] = value;
    setItems(updated);
  };

  const handleEdit = (order) => {
    setEditId(order.id);
    setFormData({
      supplier_id: order.supplier_id || '',
      expected_delivery_date: order.expected_delivery_date?.split('T')[0] || '',
      notes: order.notes || '',
    });
    setItems(
      (order.items || []).map(({ product_id, quantity_ordered, unit_price }) => ({
        product_id,
        quantity_ordered,
        unit_price,
      }))
    );
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const payload = {
      ...formData,
      items: items.map((item) => ({
        product_id: item.product_id,
        quantity_ordered: Number(item.quantity_ordered),
        unit_price: Number(item.unit_price),
      })),
    };
    try {
      if (editId) await purchaseOrdersApi.update(editId, payload);
      else await purchaseOrdersApi.create(payload);
      await fetchData();
      resetForm();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save order.');
    }
  };

  const handleAction = async (id, action) => {
    setError('');
    try {
      if (action === 'submit') await purchaseOrdersApi.submit(id);
      else if (action === 'approve') await purchaseOrdersApi.approve(id);
      else if (action === 'reject') await purchaseOrdersApi.reject(id);
      else if (action === 'receive') await purchaseOrdersApi.receive(id);
      await fetchData();
    } catch (err) {
      setError(`Action Failed: Could not ${action} the order.`);
    }
  };

  const resetForm = () => {
    setFormData({ supplier_id: '', expected_delivery_date: '', notes: '' });
    setItems([]);
    setEditId(null);
    setShowForm(false);
  };

  const awaitingApprovalCount = orders.filter((o) => o.status === 'pending_approval').length;
  const approvedCount = orders.filter((o) => o.status === 'approved').length;
  const totalValue = orders.reduce((sum, o) => sum + Number(o.total_amount || 0), 0);

  const statusStyles = {
    draft: 'bg-gray-100 text-gray-500 border-gray-200',
    pending_approval: 'bg-blue-50 text-blue-700 border-blue-100',
    approved: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    received: 'bg-indigo-50 text-indigo-700 border-indigo-100',
    rejected: 'bg-red-50 text-red-700 border-red-100',
  };

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen">
        <span className="font-mono text-xs tracking-widest text-gray-300 uppercase animate-pulse">Syncing_Records...</span>
      </div>
    );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10" style={{ fontFamily: "'IBM Plex Sans', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@300;400;500;600&display=swap');`}</style>

      <div className="flex justify-between items-end mb-8 pb-4 border-b-2 border-gray-900">
        <div>
          <h1 className="font-mono text-2xl font-bold tracking-tighter text-gray-900 uppercase">Purchase_Orders</h1>
        </div>
        <button
          onClick={() => (showForm ? resetForm() : setShowForm(true))}
          className={`font-mono text-[10px] font-bold tracking-widest px-4 py-2 rounded transition-all uppercase ${
            showForm ? 'border border-gray-300 text-gray-400' : 'bg-gray-900 text-white'
          }`}
        >
          {showForm ? 'Cancel' : 'New_Purchase_Order'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-gray-50 p-5 border border-gray-100 rounded">
          <p className="font-mono text-[9px] text-gray-400 uppercase tracking-widest mb-1">Awaiting Approval</p>
          <p className="font-mono text-2xl font-bold text-blue-600">{awaitingApprovalCount}</p>
        </div>
        <div className="bg-gray-50 p-5 border border-gray-100 rounded">
          <p className="font-mono text-[9px] text-gray-400 uppercase tracking-widest mb-1">Approved Orders</p>
          <p className="font-mono text-2xl font-bold text-emerald-600">{approvedCount}</p>
        </div>
        <div className="bg-gray-50 p-5 border border-gray-100 rounded">
          <p className="font-mono text-[9px] text-gray-400 uppercase tracking-widest mb-1">Total Pipeline (KSH)</p>
          <p className="font-mono text-2xl font-bold text-gray-900">{totalValue.toLocaleString()}</p>
        </div>
      </div>

      {error && <div className="bg-red-50 border-l-4 border-red-500 text-red-700 font-mono text-[10px] p-4 mb-6 uppercase">{error}</div>}

      {showForm && (
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-10 shadow-sm animate-in fade-in slide-in-from-top-4 duration-300">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-2">
                <label className="font-mono text-[10px] text-gray-400 uppercase font-bold">Supplier</label>
                <select
                  value={formData.supplier_id}
                  onChange={(e) => setFormData({ ...formData, supplier_id: e.target.value })}
                  className="text-sm border border-gray-200 p-2.5 rounded bg-gray-50 focus:bg-white outline-none transition-all"
                >
                  <option value="">Select Vendor...</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-2">
                <label className="font-mono text-[10px] text-gray-400 uppercase font-bold">Expected Date</label>
                <input
                  type="date"
                  value={formData.expected_delivery_date}
                  onChange={(e) => setFormData({ ...formData, expected_delivery_date: e.target.value })}
                  className="text-sm border border-gray-200 p-2.5 rounded bg-gray-50 focus:bg-white outline-none transition-all"
                />
              </div>
            </div>

            <div className="border-t border-gray-100 pt-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-mono text-[10px] font-bold uppercase text-gray-500 tracking-widest">Order_Lines (KSH)</h3>
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="text-[10px] font-mono font-bold border border-gray-900 px-3 py-1 hover:bg-gray-900 hover:text-white transition-all"
                >
                  + Add_Line
                </button>
              </div>

              {items.map((item, i) => (
                <div key={i} className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr_auto] gap-3 mb-3 items-center">
                  <select
                    value={item.product_id}
                    onChange={(e) => handleItemChange(i, 'product_id', e.target.value)}
                    className="text-sm border border-gray-200 p-2 rounded focus:bg-white outline-none"
                  >
                    <option value="">Select Product</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.sku})
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    placeholder="Qty"
                    value={item.quantity_ordered}
                    onChange={(e) => handleItemChange(i, 'quantity_ordered', e.target.value)}
                    className="text-sm border border-gray-200 p-2 rounded outline-none"
                  />
                  <input
                    type="number"
                    placeholder="Price"
                    value={item.unit_price}
                    onChange={(e) => handleItemChange(i, 'unit_price', e.target.value)}
                    className="text-sm border border-gray-200 p-2 rounded outline-none"
                  />
                  <button type="button" onClick={() => handleRemoveItem(i)} className="text-red-400 font-mono font-bold px-2 hover:text-red-600 transition-colors">
                    ✕
                  </button>
                </div>
              ))}
            </div>

            <div className="flex gap-4 pt-4 border-t border-gray-100">
              <button
                type="submit"
                className="bg-gray-900 text-white font-mono text-[10px] font-bold px-8 py-3 rounded uppercase tracking-widest hover:opacity-90 transition-opacity"
              >
                Commit_Purchase
              </button>
              <button type="button" onClick={resetForm} className="font-mono text-[10px] text-gray-400 uppercase tracking-widest px-4">
                Discard
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {['Ref #', 'Supplier', 'Status', 'Total (KSH)', 'Controls'].map((h) => (
                <th key={h} className="px-6 py-4 text-left font-mono text-[10px] uppercase tracking-widest text-gray-400 font-bold">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {orders.map((order) => (
              <tr key={order.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-6 py-5 font-mono text-xs font-bold text-gray-900">{order.order_number}</td>
                <td className="px-6 py-5">
                  <span className="block font-semibold text-gray-800">{order.supplier?.name}</span>
                  <span className="text-[10px] font-mono text-gray-400">ID: {order.id}</span>
                </td>
                <td className="px-6 py-5">
                  <span
                    className={`px-2 py-1 rounded-[4px] border font-mono text-[9px] font-bold uppercase tracking-tighter ${
                      statusStyles[order.status]
                    }`}
                  >
                    {order.status === 'pending_approval' ? 'Pending Approval' : order.status}
                  </span>
                </td>
                <td className="px-6 py-5 font-mono text-sm font-bold text-gray-900">{Number(order.total_amount).toLocaleString()}</td>
                <td className="px-6 py-5">
                  <div className="flex gap-2">
                    {order.status === 'pending_approval' && (
                      <>
                        <button
                          onClick={() => handleAction(order.id, 'approve')}
                          className="text-[9px] font-mono font-bold bg-emerald-600 text-white px-3 py-1.5 rounded uppercase hover:bg-emerald-700 transition-colors"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleAction(order.id, 'reject')}
                          className="text-[9px] font-mono font-bold bg-red-600 text-white px-3 py-1.5 rounded uppercase hover:bg-red-700 transition-colors"
                        >
                          Reject
                        </button>
                      </>
                    )}
                    {(order.status === 'draft' || order.status === 'rejected') && (
                      <>
                        <button
                          onClick={() => handleEdit(order)}
                          className="text-[9px] font-mono font-bold border border-gray-300 px-3 py-1.5 rounded uppercase hover:bg-gray-900 hover:text-white transition-all"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleAction(order.id, 'submit')}
                          className="text-[9px] font-mono font-bold bg-blue-600 text-white px-3 py-1.5 rounded uppercase hover:bg-blue-700 transition-colors"
                        >
                          Submit
                        </button>
                      </>
                    )}
                    {order.status === 'approved' && (
                      <button
                        onClick={() => handleAction(order.id, 'receive')}
                        className="text-[9px] font-mono font-bold bg-indigo-600 text-white px-4 py-1.5 rounded uppercase hover:bg-indigo-700 transition-colors"
                      >
                        Receive_Goods
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-10 text-center font-mono text-xs text-gray-300 uppercase tracking-widest">
                  No procurement records found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}