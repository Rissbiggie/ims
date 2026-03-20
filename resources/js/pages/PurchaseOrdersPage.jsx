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

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const [ordersRes, suppliersRes, productsRes] = await Promise.all([
        purchaseOrdersApi.list(),
        suppliersApi.list(),
        productsApi.list(),
      ]);
      setOrders(ordersRes.data?.data || []);
      setSuppliers(suppliersRes.data?.data || []);
      setProducts(productsRes.data?.data || []);
    } catch (err) {
      console.error(err);
      setError('Failed to load data. Please check your connection.');
      setOrders([]); setSuppliers([]); setProducts([]);
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
      expected_delivery_date: order.expected_delivery_date || '',
      notes: order.notes || '',
    });
    setItems((order.items || []).map(({ product_id, quantity_ordered, unit_price }) => ({ product_id, quantity_ordered, unit_price })));
    setShowForm(true);
    setError('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!formData.supplier_id) { setError('Supplier is required.'); return; }
    if (!items.length) { setError('Add at least one line item.'); return; }
    for (const item of items) {
      if (!item.product_id) { setError('All items need a product selected.'); return; }
      if (!item.quantity_ordered || Number(item.quantity_ordered) <= 0) { setError('Quantity must be greater than 0.'); return; }
      if (item.unit_price === '' || Number(item.unit_price) < 0) { setError('Unit price must be 0 or more.'); return; }
    }
    const payload = {
      ...formData,
      items: items.map(({ product_id, quantity_ordered, unit_price }) => ({
        product_id,
        quantity_ordered: Number(quantity_ordered),
        unit_price: Number(unit_price),
      })),
    };
    try {
      if (editId) await purchaseOrdersApi.update(editId, payload);
      else await purchaseOrdersApi.create(payload);
      await fetchData();
      resetForm();
    } catch (err) {
      console.error(err);
      const backendErrors = err.response?.data?.errors;
      setError(backendErrors ? Object.values(backendErrors).flat().join(', ') : 'Failed to save purchase order.');
    }
  };

  const handleAction = async (id, action) => {
    setError('');
    try {
      if (action === 'submit') await purchaseOrdersApi.submit(id);
      if (action === 'approve') await purchaseOrdersApi.approve(id);
      if (action === 'reject') await purchaseOrdersApi.reject(id);
      if (action === 'receive') await purchaseOrdersApi.receive(id);
      await fetchData();
    } catch (err) {
      console.error(err);
      setError(`Failed to ${action} purchase order.`);
    }
  };

  const resetForm = () => {
    setFormData({ supplier_id: '', expected_delivery_date: '', notes: '' });
    setItems([]);
    setEditId(null);
    setShowForm(false);
    setError('');
  };

  // Derived metrics
  const totalValue = orders.reduce((sum, o) => sum + Number(o.total_amount || 0), 0);
  const pendingCount = orders.filter(o => o.status === 'draft' || o.status === 'submitted').length;
  const approvedCount = orders.filter(o => o.status === 'approved' || o.status === 'received').length;

  const statusStyles = {
    draft:     'bg-gray-100 text-gray-600',
    submitted: 'bg-blue-50 text-blue-700',
    approved:  'bg-green-50 text-green-700',
    received:  'bg-green-50 text-green-700',
    rejected:  'bg-red-50 text-red-700',
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <span className="font-mono text-sm tracking-widest text-gray-400 uppercase animate-pulse">
        Loading orders...
      </span>
    </div>
  );

  return (
    <div
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10"
      style={{ fontFamily: "'IBM Plex Sans', sans-serif" }}
    >
      {/* Google Fonts */}
      <style>{`@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@300;400;500&display=swap');`}</style>

      {/* Masthead */}
      <div className="flex justify-between items-end mb-8 pb-4 border-b-2 border-gray-900">
        <div>
          <p className="font-mono text-xs tracking-widest text-gray-400 uppercase mb-1">Procurement</p>
          <h1 className="font-mono text-2xl font-semibold tracking-tight text-gray-900">Purchase Orders</h1>
        </div>
        <button
          onClick={() => showForm ? resetForm() : setShowForm(true)}
          className={`font-mono text-xs font-medium tracking-wide px-4 py-2 rounded transition-all ${
            showForm
              ? 'bg-transparent text-gray-700 border border-gray-300 hover:border-gray-500'
              : 'bg-gray-900 text-white hover:bg-gray-700'
          }`}
        >
          {showForm ? '✕ Cancel' : '+ New Order'}
        </button>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {[
          { label: 'Total Orders', value: orders.length, color: 'text-gray-900' },
          { label: 'Pending', value: pendingCount, color: 'text-amber-700' },
          { label: 'Approved', value: approvedCount, color: 'text-green-700' },
          { label: 'Total Value', value: `$${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, color: 'text-blue-700' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-gray-50 rounded-md px-4 py-3">
            <p className="font-mono text-xs text-gray-400 uppercase tracking-widest mb-1">{label}</p>
            <p className={`font-mono text-xl font-semibold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 font-mono text-xs px-4 py-3 rounded mb-5">
          {error}
        </div>
      )}

      {/* Form */}
      {showForm && (
        <div className="bg-white border border-gray-200 rounded-md p-6 mb-8">
          <div className="flex items-center gap-2 mb-5">
            <span className="inline-block w-2 h-2 rounded-full bg-gray-900" />
            <h2 className="font-mono text-xs font-semibold tracking-widest text-gray-500 uppercase">
              {editId ? 'Edit Purchase Order' : 'Create Purchase Order'}
            </h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="font-mono text-xs text-gray-400 uppercase tracking-widest">Supplier</label>
                <select
                  value={formData.supplier_id}
                  onChange={(e) => setFormData({ ...formData, supplier_id: e.target.value })}
                  className="text-sm px-3 py-2 bg-gray-50 border border-gray-200 rounded focus:outline-none focus:border-gray-500 text-gray-900"
                >
                  <option value="">Select Supplier</option>
                  {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="font-mono text-xs text-gray-400 uppercase tracking-widest">Expected Delivery</label>
                <input
                  type="date"
                  value={formData.expected_delivery_date}
                  onChange={(e) => setFormData({ ...formData, expected_delivery_date: e.target.value })}
                  className="text-sm px-3 py-2 bg-gray-50 border border-gray-200 rounded focus:outline-none focus:border-gray-500 text-gray-900"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-mono text-xs text-gray-400 uppercase tracking-widest">Notes</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Internal notes or delivery instructions..."
                rows={2}
                className="text-sm px-3 py-2 bg-gray-50 border border-gray-200 rounded focus:outline-none focus:border-gray-500 text-gray-900 resize-y"
              />
            </div>

            {/* Line Items */}
            <div className="border-t border-gray-100 pt-4">
              <div className="flex justify-between items-center mb-3">
                <span className="font-mono text-xs text-gray-400 uppercase tracking-widest">Line Items</span>
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="font-mono text-xs px-3 py-1.5 border border-gray-300 text-gray-500 rounded hover:border-gray-500 hover:text-gray-800 transition-all"
                >
                  + Add Line
                </button>
              </div>

              {items.length === 0 && (
                <p className="font-mono text-xs text-gray-300 py-2">No items yet — click "+ Add Line" to begin.</p>
              )}

              {items.map((item, i) => (
                <div key={i} className="grid grid-cols-[2fr_1fr_1fr_auto] gap-2 mb-2 items-center">
                  <select
                    value={item.product_id}
                    onChange={(e) => handleItemChange(i, 'product_id', e.target.value)}
                    className="text-sm px-3 py-2 bg-gray-50 border border-gray-200 rounded focus:outline-none focus:border-gray-500 text-gray-900"
                  >
                    <option value="">Select product</option>
                    {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                  <input
                    type="number" min="1" placeholder="Qty"
                    value={item.quantity_ordered}
                    onChange={(e) => handleItemChange(i, 'quantity_ordered', e.target.value)}
                    className="text-sm px-3 py-2 bg-gray-50 border border-gray-200 rounded focus:outline-none focus:border-gray-500 text-gray-900"
                  />
                  <input
                    type="number" min="0" step="0.01" placeholder="Unit $"
                    value={item.unit_price}
                    onChange={(e) => handleItemChange(i, 'unit_price', e.target.value)}
                    className="text-sm px-3 py-2 bg-gray-50 border border-gray-200 rounded focus:outline-none focus:border-gray-500 text-gray-900"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(i)}
                    className="text-red-400 hover:text-red-600 text-lg leading-none px-2 py-1"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>

            <div className="flex gap-3 pt-2 border-t border-gray-100">
              <button
                type="submit"
                className="font-mono text-xs font-medium px-5 py-2.5 bg-gray-900 text-white rounded hover:bg-gray-700 transition-all"
              >
                {editId ? 'Update Order' : 'Create Order'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="font-mono text-xs px-5 py-2.5 border border-gray-300 text-gray-600 rounded hover:border-gray-500 transition-all"
              >
                Discard
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-md overflow-hidden">
        <table className="w-full text-sm border-collapse">
          <thead className="bg-gray-50">
            <tr>
              {['Order #', 'Supplier', 'Status', 'Items', 'Total', 'Actions'].map(h => (
                <th key={h} className="px-4 py-3 text-left font-mono text-xs text-gray-400 uppercase tracking-widest border-b border-gray-200">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-10 font-mono text-xs text-gray-300 uppercase tracking-widest">
                  No purchase orders on record.
                </td>
              </tr>
            ) : orders.map(order => (
              <tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3">
                  <span className="font-mono text-xs font-medium text-gray-900">
                    {order.order_number || `PO-${order.id}`}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-500 text-sm">{order.supplier?.name || '—'}</td>
                <td className="px-4 py-3">
                  <span className={`font-mono text-xs font-medium px-2 py-1 rounded uppercase tracking-wide ${statusStyles[order.status] || 'bg-gray-100 text-gray-500'}`}>
                    {order.status}
                  </span>
                </td>
                <td className="px-4 py-3 font-mono text-xs text-gray-400">
                  {(order.items || []).length} line{(order.items || []).length !== 1 ? 's' : ''}
                </td>
                <td className="px-4 py-3 font-mono text-sm font-medium text-gray-900">
                  ${Number(order.total_amount || 0).toFixed(2)}
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1.5 flex-wrap items-center">
                    <button onClick={() => handleEdit(order)}
                      className="font-mono text-xs px-2.5 py-1 rounded border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 transition-all">
                      Edit
                    </button>
                    {order.status === 'draft' && <>
                      <button onClick={() => handleAction(order.id, 'submit')}
                        className="font-mono text-xs px-2.5 py-1 rounded border border-green-200 bg-green-50 text-green-700 hover:bg-green-100 transition-all">
                        Submit
                      </button>
                      <button onClick={() => handleAction(order.id, 'reject')}
                        className="font-mono text-xs px-2.5 py-1 rounded border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 transition-all">
                        Reject
                      </button>
                    </>}
                    {order.status === 'submitted' && <>
                      <button onClick={() => handleAction(order.id, 'approve')}
                        className="font-mono text-xs px-2.5 py-1 rounded border border-green-200 bg-green-50 text-green-700 hover:bg-green-100 transition-all">
                        Approve
                      </button>
                      <button onClick={() => handleAction(order.id, 'reject')}
                        className="font-mono text-xs px-2.5 py-1 rounded border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 transition-all">
                        Reject
                      </button>
                    </>}
                    {order.status === 'approved' && (
                      <button onClick={() => handleAction(order.id, 'receive')}
                        className="font-mono text-xs px-2.5 py-1 rounded border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 transition-all">
                        Receive
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}