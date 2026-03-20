import { useEffect, useState } from 'react';
import { suppliersApi } from '../api';

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [showForm, setShowForm]   = useState(false);
  const [editId, setEditId]       = useState(null);
  const [formData, setFormData]   = useState({
    name: '', email: '', phone: '', address: '', city: '', country: '',
  });

  useEffect(() => { fetchSuppliers(); }, []);

  const fetchSuppliers = async () => {
    try {
      const { data } = await suppliersApi.list();
      setSuppliers(data.data || []);
    } catch (err) {
      setError('Failed to load suppliers.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (editId) await suppliersApi.update(editId, formData);
      else        await suppliersApi.create(formData);
      await fetchSuppliers();
      resetForm();
    } catch (err) {
      setError('Failed to save supplier.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this supplier?')) return;
    setError('');
    try {
      await suppliersApi.delete(id);
      await fetchSuppliers();
    } catch (err) {
      setError('Failed to delete supplier.');
    }
  };

  const handleEdit = (supplier) => {
    setFormData(supplier);
    setEditId(supplier.id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetForm = () => {
    setFormData({ name: '', email: '', phone: '', address: '', city: '', country: '' });
    setEditId(null);
    setShowForm(false);
    setError('');
  };

  const set = (field) => (e) => setFormData({ ...formData, [field]: e.target.value });

  const fieldCls = "text-sm px-3 py-2 bg-gray-50 border border-gray-200 rounded focus:outline-none focus:border-gray-500 text-gray-900";

  const Th = ({ children }) => (
    <th className="px-4 py-3 text-left font-mono text-xs tracking-widest uppercase text-gray-400 border-b border-gray-200">
      {children}
    </th>
  );

  // Derived metrics
  const withEmail   = suppliers.filter(s => s.email).length;
  const cities      = new Set(suppliers.map(s => s.city).filter(Boolean)).size;
  const countries   = new Set(suppliers.map(s => s.country).filter(Boolean)).size;

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <span className="font-mono text-xs tracking-widest text-gray-300 uppercase animate-pulse">
        Loading suppliers...
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
          <p className="font-mono text-xs tracking-widest text-gray-400 uppercase mb-1">Procurement</p>
          <h1 className="font-mono text-2xl font-semibold tracking-tight text-gray-900">Suppliers</h1>
        </div>
        <button
          onClick={() => showForm ? resetForm() : setShowForm(true)}
          className={`font-mono text-xs font-medium tracking-wide px-4 py-2 rounded transition-all ${
            showForm
              ? 'bg-transparent text-gray-700 border border-gray-300 hover:border-gray-500'
              : 'bg-gray-900 text-white hover:bg-gray-700'
          }`}
        >
          {showForm ? '✕ Cancel' : '+ Add Supplier'}
        </button>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {[
          { label: 'Total Suppliers', value: suppliers.length,  color: 'text-gray-900'  },
          { label: 'With Email',      value: withEmail,         color: 'text-blue-700'  },
          { label: 'Cities',          value: cities,            color: 'text-amber-700' },
          { label: 'Countries',       value: countries,         color: 'text-green-700' },
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
              {editId ? 'Edit Supplier' : 'Add Supplier'}
            </h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="font-mono text-xs text-gray-400 uppercase tracking-widest">Supplier Name *</label>
                <input type="text" required value={formData.name} onChange={set('name')}
                       placeholder="e.g. Acme Supplies Co." className={fieldCls} />
              </div>
              <div className="flex flex-col gap-1">
                <label className="font-mono text-xs text-gray-400 uppercase tracking-widest">Email</label>
                <input type="email" value={formData.email} onChange={set('email')}
                       placeholder="contact@supplier.com" className={fieldCls} />
              </div>
              <div className="flex flex-col gap-1">
                <label className="font-mono text-xs text-gray-400 uppercase tracking-widest">Phone</label>
                <input type="tel" value={formData.phone} onChange={set('phone')}
                       placeholder="+1 (555) 000-0000" className={fieldCls} />
              </div>
              <div className="flex flex-col gap-1">
                <label className="font-mono text-xs text-gray-400 uppercase tracking-widest">City</label>
                <input type="text" value={formData.city} onChange={set('city')}
                       placeholder="e.g. Nairobi" className={fieldCls} />
              </div>
              <div className="flex flex-col gap-1 md:col-span-2 md:w-1/2">
                <label className="font-mono text-xs text-gray-400 uppercase tracking-widest">Country</label>
                <input type="text" value={formData.country} onChange={set('country')}
                       placeholder="e.g. Kenya" className={fieldCls} />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-mono text-xs text-gray-400 uppercase tracking-widest">Address</label>
              <textarea value={formData.address} onChange={set('address')} rows={2}
                        placeholder="Street address..." className={`${fieldCls} resize-y`} />
            </div>

            <div className="flex gap-3 pt-2 border-t border-gray-100">
              <button type="submit"
                      className="font-mono text-xs font-medium px-5 py-2.5 bg-gray-900 text-white rounded hover:bg-gray-700 transition-all">
                {editId ? 'Update Supplier' : 'Create Supplier'}
              </button>
              <button type="button" onClick={resetForm}
                      className="font-mono text-xs px-5 py-2.5 border border-gray-300 text-gray-600 rounded hover:border-gray-500 transition-all">
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
              <Th>Supplier</Th>
              <Th>Email</Th>
              <Th>Phone</Th>
              <Th>City</Th>
              <Th>Country</Th>
              <Th>Actions</Th>
            </tr>
          </thead>
          <tbody>
            {suppliers.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-10 font-mono text-xs text-gray-300 uppercase tracking-widest">
                  No suppliers on record.
                </td>
              </tr>
            ) : suppliers.map((supplier) => (
              <tr key={supplier.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded bg-gray-100 flex items-center justify-center font-mono text-xs font-medium text-gray-500 flex-shrink-0">
                      {(supplier.name || '?')[0].toUpperCase()}
                    </div>
                    <span className="font-medium text-gray-900 text-sm">{supplier.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-gray-500">
                  {supplier.email
                    ? <a href={`mailto:${supplier.email}`} className="hover:text-gray-900 transition-colors">{supplier.email}</a>
                    : <span className="text-gray-300">—</span>}
                </td>
                <td className="px-4 py-3 font-mono text-xs text-gray-500">
                  {supplier.phone || <span className="text-gray-300 font-sans">—</span>}
                </td>
                <td className="px-4 py-3 text-sm text-gray-500">
                  {supplier.city || <span className="text-gray-300">—</span>}
                </td>
                <td className="px-4 py-3 text-sm text-gray-500">
                  {supplier.country || <span className="text-gray-300">—</span>}
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1.5 items-center">
                    <button onClick={() => handleEdit(supplier)}
                      className="font-mono text-xs px-2.5 py-1 rounded border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 transition-all">
                      Edit
                    </button>
                    <button onClick={() => handleDelete(supplier.id)}
                      className="font-mono text-xs px-2.5 py-1 rounded border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 transition-all">
                      Delete
                    </button>
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