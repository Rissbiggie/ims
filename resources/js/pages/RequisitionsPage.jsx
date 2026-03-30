import { useEffect, useState } from 'react';
import { requisitionsApi, productsApi } from '../api';

export default function RequisitionsPage() {
  const [requisitions, setRequisitions] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [items, setItems] = useState([]);
  const [formData, setFormData] = useState({ department: '', purpose: '', required_date: '' });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [reqRes, prodRes] = await Promise.all([
        requisitionsApi.getAll(), // Matches the index method
        productsApi.list(),
      ]);
      setRequisitions(reqRes.data.data || reqRes.data);
      setProducts(prodRes.data.data || prodRes.data);
    } catch (err) {
      setError('SYSTEM_ERROR: Failed to synchronize with data stream.');
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

  const handleSubmit = async (e, shouldSubmitImmediately = false) => {
    if (e) e.preventDefault();
    setError('');
    
    if (!items.length) { 
        setError('VALIDATION_ERROR: At least one line item is required.'); 
        return; 
    }

    try {
      await requisitionsApi.create({
        ...formData,
        submit: shouldSubmitImmediately, // This triggers the Draft vs Pending logic in Laravel
        items: items.map(({ product_id, quantity }) => ({
          product_id,
          quantity_requested: quantity,
        })),
      });
      await fetchData();
      resetForm();
    } catch (err) {
      setError(err.response?.data?.message || 'SUBMISSION_FAILED: Backend rejected the request.');
    }
  };

  const handleAction = async (id, action) => {
    setError('');
    try {
      if (action === 'submit')  await requisitionsApi.submit(id);
      
      // Note: Approve and Issue usually require payloads for quantity adjustments.
      // For now, we pass empty objects to use defaults from the service.
      if (action === 'approve') await requisitionsApi.approve(id, { approved_quantities: {} });
      if (action === 'reject')  await requisitionsApi.reject(id, { reason: 'Denied by administrator.' });
      if (action === 'issue') {
        // Find the requisition and map items for the issue payload
        const req = requisitions.find(r => r.id === id);
        const issuePayload = {
            items: req.items.map(i => ({
                product_id: i.product_id,
                quantity_issued: i.quantity_approved || i.quantity_requested
            }))
        };
        await requisitionsApi.issue(id, issuePayload);
      }
      
      await fetchData();
    } catch (err) {
      setError(`ACTION_FAILED: Could not execute ${action.toUpperCase()}.`);
    }
  };

  const resetForm = () => {
    setFormData({ department: '', purpose: '', required_date: '' });
    setItems([]);
    setShowForm(false);
    setError('');
  };

  const statusStyles = {
    draft:     'bg-gray-100   text-gray-500   border-gray-200',
    pending:   'bg-amber-50  text-amber-700  border-amber-200',
    approved:  'bg-emerald-50 text-emerald-700 border-emerald-200',
    issued:    'bg-black      text-white      border-black',
    rejected:  'bg-red-50    text-red-700    border-red-200',
  };

  const Th = ({ children }) => (
    <th className="px-4 py-4 text-left font-mono text-[10px] tracking-[0.2em] uppercase text-gray-400 border-b border-gray-100">
      {children}
    </th>
  );

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-[#fafafa]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-6 h-6 border-2 border-black border-t-transparent rounded-full animate-spin" />
        <span className="font-mono text-[10px] tracking-[0.3em] text-gray-400 uppercase">Synchronizing...</span>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 antialiased min-h-screen bg-[#fafafa]" style={{ fontFamily: "'IBM Plex Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@300;400;600&display=swap');
      `}</style>

      {/* Header */}
      <div className="flex justify-between items-end mb-12">
        <div className="border-l-4 border-black pl-6">
          <h1 className="font-mono text-4xl font-bold tracking-tighter text-gray-900">REQUISITIONS</h1>
          <p className="text-gray-400 text-[10px] font-mono uppercase tracking-[0.2em] mt-1">UrbanLink_Inventory_Control</p>
        </div>
        <button
          onClick={() => showForm ? resetForm() : setShowForm(true)}
          className={`font-mono text-[10px] font-bold tracking-widest px-6 py-3 transition-all ${
            showForm ? 'text-gray-400 hover:text-black' : 'bg-black text-white hover:bg-gray-800 shadow-lg'
          }`}
        >
          {showForm ? 'DISCARD_CHANGES' : 'CREATE_NEW_REQUEST'}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-100 text-red-600 font-mono text-[10px] px-4 py-4 rounded mb-8 flex justify-between">
          <span>{error}</span>
          <button onClick={() => setError('')} className="underline">HIDE</button>
        </div>
      )}

      {/* Form Section */}
      {showForm && (
        <div className="bg-white border border-gray-200 rounded shadow-sm p-8 mb-12 animate-in fade-in slide-in-from-top-4">
          <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex flex-col gap-2">
                <label className="font-mono text-[10px] text-gray-400 uppercase tracking-widest">Department</label>
                <input
                  type="text"
                  required
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  className="text-sm px-4 py-3 bg-gray-50 border border-gray-100 rounded focus:bg-white focus:ring-1 focus:ring-black outline-none transition-all"
                />
              </div>
              <div className="flex flex-col gap-2 md:col-span-2">
                <label className="font-mono text-[10px] text-gray-400 uppercase tracking-widest">Purpose / Description</label>
                <input
                  type="text"
                  required
                  value={formData.purpose}
                  onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                  className="text-sm px-4 py-3 bg-gray-50 border border-gray-100 rounded focus:bg-white focus:ring-1 focus:ring-black outline-none transition-all"
                />
              </div>
            </div>

            <div className="pt-6 border-t border-gray-50">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-mono text-[10px] text-gray-900 font-bold uppercase tracking-widest">Line_Items</h3>
                <button type="button" onClick={handleAddItem} className="text-[10px] font-mono border border-gray-200 px-4 py-2 rounded hover:bg-gray-50 uppercase tracking-widest transition-all">
                  + Add_Entry
                </button>
              </div>

              <div className="space-y-3">
                {items.map((item, i) => (
                  <div key={i} className="grid grid-cols-[3fr_1fr_auto] gap-4 items-center animate-in fade-in">
                    <select
                      value={item.product_id}
                      onChange={(e) => handleItemChange(i, 'product_id', e.target.value)}
                      required
                      className="text-sm px-4 py-3 bg-gray-50 border border-gray-100 rounded outline-none"
                    >
                      <option value="">Select Resource...</option>
                      {products.map(p => <option key={p.id} value={p.id}>{p.name} (Stock: {p.quantity_on_hand})</option>)}
                    </select>
                    <input
                      type="number"
                      placeholder="Qty"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(i, 'quantity', e.target.value)}
                      required
                      className="text-sm px-4 py-3 bg-gray-50 border border-gray-100 rounded outline-none"
                    />
                    <button type="button" onClick={() => handleRemoveItem(i)} className="text-gray-300 hover:text-red-500 p-2 transition-colors">✕</button>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-4 pt-8">
              <button type="submit" className="font-mono text-[10px] font-bold px-8 py-4 border border-black hover:bg-gray-50 uppercase tracking-widest transition-all">
                SAVE_AS_DRAFT
              </button>
              <button type="button" onClick={(e) => handleSubmit(null, true)} className="font-mono text-[10px] font-bold px-8 py-4 bg-black text-white hover:bg-gray-800 uppercase tracking-widest transition-all shadow-lg">
                SUBMIT_FOR_APPROVAL
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Main Listing Table */}
      <div className="bg-white border border-gray-200 rounded shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr>
              <Th>Reference</Th>
              <Th>Dept / Purpose</Th>
              <Th>Status</Th>
              <Th>Items</Th>
              <Th>Actions</Th>
            </tr>
          </thead>
          <tbody>
            {requisitions.map(req => (
              <tr key={req.id} className="hover:bg-gray-50 transition-colors border-b border-gray-50">
                <td className="px-4 py-5 font-mono text-xs font-bold text-gray-900">{req.requisition_number}</td>
                <td className="px-4 py-5">
                  <div className="text-sm font-medium">{req.department}</div>
                  <div className="text-[10px] font-mono text-gray-400 uppercase mt-1">{req.purpose}</div>
                </td>
                <td className="px-4 py-5">
                  <span className={`font-mono text-[9px] font-bold px-3 py-1.5 rounded-full border uppercase tracking-[0.15em] ${statusStyles[req.status]}`}>
                    {req.status}
                  </span>
                </td>
                <td className="px-4 py-5 font-mono text-xs text-gray-400">{req.items?.length || 0} SKU</td>
                <td className="px-4 py-5">
                  <div className="flex gap-2">
                    {req.status === 'draft' && (
                      <button onClick={() => handleAction(req.id, 'submit')} className="text-[10px] font-mono font-bold text-blue-600 hover:underline tracking-widest">SUBMIT</button>
                    )}
                    {req.status === 'pending' && (
                      <>
                        <button onClick={() => handleAction(req.id, 'approve')} className="text-[10px] font-mono font-bold text-emerald-600 hover:underline tracking-widest">APPROVE</button>
                        <button onClick={() => handleAction(req.id, 'reject')} className="text-[10px] font-mono font-bold text-red-600 hover:underline tracking-widest">REJECT</button>
                      </>
                    )}
                    {req.status === 'approved' && (
                      <button onClick={() => handleAction(req.id, 'issue')} className="text-[10px] font-mono font-bold text-black hover:underline tracking-widest underline-offset-4">EXECUTE_ISSUE</button>
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