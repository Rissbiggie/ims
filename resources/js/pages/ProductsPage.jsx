import { useEffect, useState } from 'react';
import { productsApi, categoriesApi } from '../api';

export default function ProductsPage() {
  const [products, setProducts]     = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');
  const [showForm, setShowForm]     = useState(false);
  const [editId, setEditId]         = useState(null);
  const [formData, setFormData]     = useState({
    name: '', category_id: '', unit_of_measure: '', unit_price: '',
    selling_price: '', reorder_level: '', reorder_quantity: '',
    minimum_stock: '', maximum_stock: '', description: '',
  });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const [productsRes, categoriesRes] = await Promise.all([
        productsApi.list(),
        categoriesApi.list(),
      ]);
      setCategories(categoriesRes.data?.data ?? categoriesRes.data ?? []);
      setProducts(productsRes.data?.data ?? productsRes.data ?? []);
    } catch (err) {
      console.error(err);
      setError('Failed to load products or categories.');
      setProducts([]); setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const required = [
      'name','category_id','unit_of_measure','unit_price',
      'selling_price','reorder_level','reorder_quantity','minimum_stock','maximum_stock',
    ];
    for (const field of required) {
      if (!formData[field]) {
        setError(`Please fill in the ${field.replace(/_/g, ' ')}.`);
        return;
      }
    }
    const payload = {
      ...formData,
      unit_price:       Number(formData.unit_price),
      selling_price:    Number(formData.selling_price),
      reorder_level:    Number(formData.reorder_level),
      reorder_quantity: Number(formData.reorder_quantity),
      minimum_stock:    Number(formData.minimum_stock),
      maximum_stock:    Number(formData.maximum_stock),
    };
    try {
      if (editId) await productsApi.update(editId, payload);
      else        await productsApi.create(payload);
      await fetchData();
      resetForm();
    } catch (err) {
      console.error(err);
      const backendErrors = err.response?.data?.errors;
      setError(backendErrors ? Object.values(backendErrors).flat().join(', ') : 'Failed to save product.');
    }
  };

  const handleEdit = (product) => {
    setFormData({
      name:             product.name             || '',
      category_id:      product.category_id      || '',
      unit_of_measure:  product.unit_of_measure  || '',
      unit_price:       product.unit_price        || '',
      selling_price:    product.selling_price     || '',
      reorder_level:    product.reorder_level     || '',
      reorder_quantity: product.reorder_quantity  || '',
      minimum_stock:    product.minimum_stock     || '',
      maximum_stock:    product.maximum_stock     || '',
      description:      product.description       || '',
    });
    setEditId(product.id);
    setShowForm(true);
    setError('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this product?')) return;
    setError('');
    try {
      await productsApi.delete(id);
      await fetchData();
    } catch (err) {
      console.error(err);
      setError('Failed to delete product.');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '', category_id: '', unit_of_measure: '', unit_price: '',
      selling_price: '', reorder_level: '', reorder_quantity: '',
      minimum_stock: '', maximum_stock: '', description: '',
    });
    setEditId(null);
    setShowForm(false);
    setError('');
  };

  const set  = (field) => (e) => setFormData({ ...formData, [field]: e.target.value });
  const fCls = "text-sm px-3 py-2 bg-gray-50 border border-gray-200 rounded focus:outline-none focus:border-gray-500 text-gray-900 w-full";

  const Th = ({ children, right }) => (
    <th className={`px-4 py-3 font-mono text-xs tracking-widest uppercase text-gray-400 border-b border-gray-200 ${right ? 'text-right' : 'text-left'}`}>
      {children}
    </th>
  );
  const Td = ({ children, mono, right, className = '' }) => (
    <td className={`px-4 py-3 text-sm border-b border-gray-100 ${mono ? 'font-mono' : ''} ${right ? 'text-right' : ''} ${className}`}>
      {children}
    </td>
  );

  // Derived metrics
  const avgPrice   = products.length
    ? (products.reduce((s, p) => s + Number(p.selling_price || 0), 0) / products.length).toFixed(2)
    : '0.00';
  const lowStock   = products.filter(p => Number(p.reorder_level || 0) > 0).length;
  const catCount   = new Set(products.map(p => p.category_id).filter(Boolean)).size;

  if (loading && !showForm) return (
    <div className="flex items-center justify-center min-h-screen">
      <span className="font-mono text-xs tracking-widest text-gray-300 uppercase animate-pulse">
        Loading products...
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
          <h1 className="font-mono text-2xl font-semibold tracking-tight text-gray-900">Products</h1>
        </div>
        <button
          onClick={() => showForm ? resetForm() : setShowForm(true)}
          className={`font-mono text-xs font-medium tracking-wide px-4 py-2 rounded transition-all ${
            showForm
              ? 'bg-transparent text-gray-700 border border-gray-300 hover:border-gray-500'
              : 'bg-gray-900 text-white hover:bg-gray-700'
          }`}
        >
          {showForm ? '✕ Cancel' : '+ Add Product'}
        </button>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {[
          { label: 'Total Products',  value: products.length,       color: 'text-gray-900'  },
          { label: 'Categories Used', value: catCount,              color: 'text-blue-700'  },
          { label: 'With Reorder',    value: lowStock,              color: 'text-amber-700' },
          { label: 'Avg Sell Price',  value: `$${avgPrice}`,        color: 'text-green-700' },
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
              {editId ? 'Edit Product' : 'Add Product'}
            </h2>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Section: Identity */}
            <p className="font-mono text-xs text-gray-400 uppercase tracking-widest mb-3">Identity</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="flex flex-col gap-1">
                <label className="font-mono text-xs text-gray-400 uppercase tracking-widest">Product Name *</label>
                <input type="text" required placeholder="e.g. Laptop Stand" value={formData.name} onChange={set('name')} className={fCls} />
              </div>
              <div className="flex flex-col gap-1">
                <label className="font-mono text-xs text-gray-400 uppercase tracking-widest">Category *</label>
                <select required value={formData.category_id} onChange={set('category_id')}
                        className={`${fCls} appearance-none`}>
                  <option value="">Select category</option>
                  {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="font-mono text-xs text-gray-400 uppercase tracking-widest">Unit of Measure *</label>
                <input type="text" required placeholder="e.g. pcs, kg, box" value={formData.unit_of_measure} onChange={set('unit_of_measure')} className={fCls} />
              </div>
              <div className="flex flex-col gap-1 md:col-span-2">
                <label className="font-mono text-xs text-gray-400 uppercase tracking-widest">Description</label>
                <textarea rows={2} placeholder="Optional product notes..." value={formData.description} onChange={set('description')} className={`${fCls} resize-y`} />
              </div>
            </div>

            {/* Section: Pricing */}
            <p className="font-mono text-xs text-gray-400 uppercase tracking-widest mb-3 pt-4 border-t border-gray-100">Pricing</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="flex flex-col gap-1">
                <label className="font-mono text-xs text-gray-400 uppercase tracking-widest">Unit Cost *</label>
                <input type="number" required step="0.01" min="0" placeholder="0.00" value={formData.unit_price} onChange={set('unit_price')} className={fCls} />
              </div>
              <div className="flex flex-col gap-1">
                <label className="font-mono text-xs text-gray-400 uppercase tracking-widest">Selling Price *</label>
                <input type="number" required step="0.01" min="0" placeholder="0.00" value={formData.selling_price} onChange={set('selling_price')} className={fCls} />
              </div>
            </div>

            {/* Section: Stock Thresholds */}
            <p className="font-mono text-xs text-gray-400 uppercase tracking-widest mb-3 pt-4 border-t border-gray-100">Stock Thresholds</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {[
                { label: 'Reorder Level *',    field: 'reorder_level'    },
                { label: 'Reorder Quantity *', field: 'reorder_quantity' },
                { label: 'Minimum Stock *',    field: 'minimum_stock'    },
                { label: 'Maximum Stock *',    field: 'maximum_stock'    },
              ].map(({ label, field }) => (
                <div key={field} className="flex flex-col gap-1">
                  <label className="font-mono text-xs text-gray-400 uppercase tracking-widest">{label}</label>
                  <input type="number" required min="0" placeholder="0" value={formData[field]} onChange={set(field)} className={fCls} />
                </div>
              ))}
            </div>

            <div className="flex gap-3 pt-4 border-t border-gray-100">
              <button type="submit"
                      className="font-mono text-xs font-medium px-5 py-2.5 bg-gray-900 text-white rounded hover:bg-gray-700 transition-all">
                {editId ? 'Update Product' : 'Create Product'}
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
              <Th>Product</Th>
              <Th>Category</Th>
              <Th>UoM</Th>
              <Th right>Unit Cost</Th>
              <Th right>Sell Price</Th>
              <Th right>Reorder Lvl</Th>
              <Th>Actions</Th>
            </tr>
          </thead>
          <tbody>
            {products.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-10 font-mono text-xs text-gray-300 uppercase tracking-widest">
                  No products on record.
                </td>
              </tr>
            ) : products.map(product => (
              <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                <Td>
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded bg-gray-100 flex items-center justify-center font-mono text-xs font-medium text-gray-500 flex-shrink-0">
                      {(product.name || '?')[0].toUpperCase()}
                    </div>
                    <span className="font-medium text-gray-900">{product.name}</span>
                  </div>
                </Td>
                <Td>
                  {product.category?.name
                    ? <span className="font-mono text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-500">{product.category.name}</span>
                    : <span className="text-gray-300">—</span>}
                </Td>
                <Td mono className="text-gray-500">{product.unit_of_measure || <span className="text-gray-300">—</span>}</Td>
                <Td mono right className="text-gray-700">${Number(product.unit_price    || 0).toFixed(2)}</Td>
                <Td mono right className="text-gray-900 font-medium">${Number(product.selling_price || 0).toFixed(2)}</Td>
                <Td mono right className="text-amber-700">{product.reorder_level ?? <span className="text-gray-300">—</span>}</Td>
                <Td>
                  <div className="flex gap-1.5 items-center">
                    <button onClick={() => handleEdit(product)}
                      className="font-mono text-xs px-2.5 py-1 rounded border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 transition-all">
                      Edit
                    </button>
                    <button onClick={() => handleDelete(product.id)}
                      className="font-mono text-xs px-2.5 py-1 rounded border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 transition-all">
                      Delete
                    </button>
                  </div>
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}