import { useEffect, useState } from 'react';
import { requisitionsApi, productsApi } from '../api';

export default function RequisitionsPage() {

  const [requisitions, setRequisitions] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [items, setItems] = useState([]);
  const [formData, setFormData] = useState({ reference_number: '', purpose: '' });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [reqRes, prodRes] = await Promise.all([
        requisitionsApi.list(),
        productsApi.list(),
      ]);
      setRequisitions(reqRes.data.data || reqRes.data);
      setProducts(prodRes.data.data || prodRes.data);
    } catch (err) {
      setError('Failed to load data.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem    = () => setItems([...items, { product_id: '', quantity: '' }]);
  const handleRemoveItem = (i) => setItems(items.filter((_, idx) => idx !== i));
  const handleItemChange = (i, field, value) => {
    const updated = [...items];
    updated[i][field] = value;
    setItems(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!items.length) { setError('Add at least one item.'); return; }
    try {
      await requisitionsApi.create({
        ...formData,
        items: items.map(({ product_id, quantity }) => ({
          product_id,
          quantity_requested: quantity,
        })),
      });
      await fetchData();
      resetForm();
    } catch (err) {
      setError('Failed to create requisition.');
    }
  };

  const handleAction = async (id, action) => {
    setError('');
    try {
      if (action === 'submit')  await requisitionsApi.submit(id);
      if (action === 'approve') await requisitionsApi.approve(id);
      if (action === 'reject')  await requisitionsApi.reject(id);
      if (action === 'issue')   await requisitionsApi.issue(id);
      await fetchData();
    } catch (err) {
      setError(`Failed to ${action} requisition.`);
    }
  };

  const resetForm = () => {
    setFormData({ reference_number: '', purpose: '' });
    setItems([]);
    setShowForm(false);
    setError('');
  };

  // Derived metrics
  const pendingCount  = requisitions.filter(r => r.status === 'pending' || r.status === 'submitted').length;
  const approvedCount = requisitions.filter(r => r.status === 'approved').length;
  const issuedCount   = requisitions.filter(r => r.status === 'issued').length;

  const statusStyles = {
    pending:   'bg-amber-50  text-amber-700  border border-amber-200',
    submitted: 'bg-blue-50   text-blue-700   border border-blue-200',
    approved:  'bg-green-50  text-green-700  border border-green-200',
    issued:    'bg-green-50  text-green-700  border border-green-200',
    rejected:  'bg-red-50    text-red-700    border border-red-200',
  };

  const Th = ({ children }) => (
    <th className="px-4 py-3 text-left font-mono text-xs tracking-widest uppercase text-gray-400 border-b border-gray-200">
      {children}
    </th>
  );

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <span className="font-mono text-xs tracking-widest text-gray-300 uppercase animate-pulse">
        Loading requisitions...
      </span>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10"
         style={{ fontFamily: "'IBM Plex Sans', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@300;400;500&display=swap');`}</style>

      {/* Masthead */}
      <div className="flex justify-between items-end mb-8 pb-4 border-b-2 border-gray-900">
        <div>
          <p className="font-mono text-xs tracking-widest text-gray-400 uppercase mb-1">Inventory</p>
          <h1 className="font-mono text-2xl font-semibold tracking-tight text-gray-900">Requisitions</h1>
        </div>
        <button
          onClick={() => showForm ? resetForm() : setShowForm(true)}
          className={`font-mono text-xs font-medium tracking-wide px-4 py-2 rounded transition-all ${
            showForm
              ? 'bg-transparent text-gray-700 border border-gray-300 hover:border-gray-500'
              : 'bg-gray-900 text-white hover:bg-gray-700'
          }`}
        >
          {showForm ? '✕ Cancel' : '+ New Requisition'}
        </button>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {[
          { label: 'Total',    value: requisitions.length, color: 'text-gray-900'  },
          { label: 'Pending',  value: pendingCount,        color: 'text-amber-700' },
          { label: 'Approved', value: approvedCount,       color: 'text-green-700' },
          { label: 'Issued',   value: issuedCount,         color: 'text-blue-700'  },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-gray-50 rounded-md px-4 py-3">
            <p className="font-mono text-xs text-gray-400 uppercase tracking-widest mb-1">{label}</p>
            <p className={`font-mono text-xl font-semibold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 font-mono text-xs px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {/* Form */}
      {showForm && (
        <div className="bg-white border border-gray-200 rounded-md p-6 mb-8">
          <div className="flex items-center gap-2 mb-5">
            <span className="inline-block w-2 h-2 rounded-full bg-gray-900" />
            <h2 className="font-mono text-xs font-semibold tracking-widest text-gray-500 uppercase">
              Create Requisition
            </h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="font-mono text-xs text-gray-400 uppercase tracking-widest">Reference Number</label>
                <input
                  type="text"
                  placeholder="e.g. REQ-2024-001"
                  value={formData.reference_number}
                  onChange={(e) => setFormData({ ...formData, reference_number: e.target.value })}
                  className="text-sm px-3 py-2 bg-gray-50 border border-gray-200 rounded focus:outline-none focus:border-gray-500 text-gray-900"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="font-mono text-xs text-gray-400 uppercase tracking-widest">Purpose</label>
                <input
                  type="text"
                  placeholder="e.g. Office restocking"
                  value={formData.purpose}
                  onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                  className="text-sm px-3 py-2 bg-gray-50 border border-gray-200 rounded focus:outline-none focus:border-gray-500 text-gray-900"
                />
              </div>
            </div>

            {/* Line Items */}
            <div className="border-t border-gray-100 pt-4">
              <div className="flex justify-between items-center mb-3">
                <span className="font-mono text-xs text-gray-400 uppercase tracking-widest">Requested Items</span>
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
                <div key={i} className="grid grid-cols-[2fr_1fr_auto] gap-2 mb-2 items-center">
                  <select
                    value={item.product_id}
                    onChange={(e) => handleItemChange(i, 'product_id', e.target.value)}
                    required
                    className="text-sm px-3 py-2 bg-gray-50 border border-gray-200 rounded focus:outline-none focus:border-gray-500 text-gray-900"
                  >
                    <option value="">Select product</option>
                    {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                  <input
                    type="number"
                    placeholder="Qty"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => handleItemChange(i, 'quantity', e.target.value)}
                    required
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
                Create Requisition
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
        <table className="w-full border-collapse text-sm">
          <thead className="bg-gray-50">
            <tr>
              <Th>Requisition #</Th>
              <Th>Purpose</Th>
              <Th>Status</Th>
              <Th>Items</Th>
              <Th>Actions</Th>
            </tr>
          </thead>
          <tbody>
            {requisitions.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-10 font-mono text-xs text-gray-300 uppercase tracking-widest">
                  No requisitions on record.
                </td>
              </tr>
            ) : requisitions.map(req => (
              <tr key={req.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3">
                  <span className="font-mono text-xs font-medium text-gray-900">
                    REQ-{String(req.id).padStart(5, '0')}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-500">
                  {req.purpose || <span className="text-gray-300 italic">—</span>}
                </td>
                <td className="px-4 py-3">
                  <span className={`font-mono text-xs font-medium px-2 py-1 rounded uppercase tracking-wide ${statusStyles[req.status] || 'bg-gray-100 text-gray-500 border border-gray-200'}`}>
                    {req.status}
                  </span>
                </td>
                <td className="px-4 py-3 font-mono text-xs text-gray-400">
                  {req.items?.length || 0} line{(req.items?.length || 0) !== 1 ? 's' : ''}
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1.5 flex-wrap items-center">
                    {req.status === 'pending' && <>
                      <button onClick={() => handleAction(req.id, 'submit')}
                        className="font-mono text-xs px-2.5 py-1 rounded border border-green-200 bg-green-50 text-green-700 hover:bg-green-100 transition-all">
                        Submit
                      </button>
                      <button onClick={() => handleAction(req.id, 'reject')}
                        className="font-mono text-xs px-2.5 py-1 rounded border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 transition-all">
                        Reject
                      </button>
                    </>}
                    {req.status === 'submitted' && <>
                      <button onClick={() => handleAction(req.id, 'approve')}
                        className="font-mono text-xs px-2.5 py-1 rounded border border-green-200 bg-green-50 text-green-700 hover:bg-green-100 transition-all">
                        Approve
                      </button>
                      <button onClick={() => handleAction(req.id, 'reject')}
                        className="font-mono text-xs px-2.5 py-1 rounded border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 transition-all">
                        Reject
                      </button>
                    </>}
                    {req.status === 'approved' && (
                      <button onClick={() => handleAction(req.id, 'issue')}
                        className="font-mono text-xs px-2.5 py-1 rounded border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 transition-all">
                        Issue
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