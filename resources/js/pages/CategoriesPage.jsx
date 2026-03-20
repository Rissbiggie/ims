import { useEffect, useState } from 'react';
import { categoriesApi } from '../api';

export default function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');
  const [showForm, setShowForm]     = useState(false);
  const [editId, setEditId]         = useState(null);
  const [formData, setFormData]     = useState({ name: '', description: '' });

  useEffect(() => { fetchCategories(); }, []);

  const fetchCategories = async () => {
    try {
      const { data } = await categoriesApi.list();
      setCategories(data);
    } catch (err) {
      setError('Failed to load categories.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (editId) await categoriesApi.update(editId, formData);
      else        await categoriesApi.create(formData);
      await fetchCategories();
      resetForm();
    } catch (err) {
      setError('Failed to save category.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this category?')) return;
    setError('');
    try {
      await categoriesApi.delete(id);
      await fetchCategories();
    } catch (err) {
      setError('Failed to delete category.');
    }
  };

  const handleEdit = (category) => {
    setFormData(category);
    setEditId(category.id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetForm = () => {
    setFormData({ name: '', description: '' });
    setEditId(null);
    setShowForm(false);
    setError('');
  };

  // Stable color assignment per category initial
  const CHIP_COLORS = [
    'bg-blue-50  text-blue-700',
    'bg-amber-50 text-amber-700',
    'bg-green-50 text-green-700',
    'bg-purple-50 text-purple-700',
    'bg-red-50   text-red-700',
    'bg-teal-50  text-teal-700',
  ];
  const chipColor = (name = '') =>
    CHIP_COLORS[name.charCodeAt(0) % CHIP_COLORS.length];

  const fieldCls = "text-sm px-3 py-2 bg-gray-50 border border-gray-200 rounded focus:outline-none focus:border-gray-500 text-gray-900";

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <span className="font-mono text-xs tracking-widest text-gray-300 uppercase animate-pulse">
        Loading categories...
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
          <h1 className="font-mono text-2xl font-semibold tracking-tight text-gray-900">Categories</h1>
        </div>
        <button
          onClick={() => showForm ? resetForm() : setShowForm(true)}
          className={`font-mono text-xs font-medium tracking-wide px-4 py-2 rounded transition-all ${
            showForm
              ? 'bg-transparent text-gray-700 border border-gray-300 hover:border-gray-500'
              : 'bg-gray-900 text-white hover:bg-gray-700'
          }`}
        >
          {showForm ? '✕ Cancel' : '+ Add Category'}
        </button>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {[
          { label: 'Total',       value: categories.length },
          { label: 'With Description', value: categories.filter(c => c.description).length },
          { label: 'Added This Session', value: 0 },
        ].map(({ label, value }) => (
          <div key={label} className="bg-gray-50 rounded-md px-4 py-3">
            <p className="font-mono text-xs text-gray-400 uppercase tracking-widest mb-1">{label}</p>
            <p className="font-mono text-xl font-semibold text-gray-900">{value}</p>
          </div>
        ))}
        {/* Spacer to keep 4-col grid balanced */}
        <div className="bg-gray-50 rounded-md px-4 py-3 hidden md:block">
          <p className="font-mono text-xs text-gray-400 uppercase tracking-widest mb-1">Avg Name Length</p>
          <p className="font-mono text-xl font-semibold text-gray-900">
            {categories.length
              ? Math.round(categories.reduce((s, c) => s + (c.name?.length || 0), 0) / categories.length)
              : 0} <span className="text-sm font-normal text-gray-400">chars</span>
          </p>
        </div>
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
              {editId ? 'Edit Category' : 'Add Category'}
            </h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex flex-col gap-1">
              <label className="font-mono text-xs text-gray-400 uppercase tracking-widest">Category Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Electronics"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={`${fieldCls} max-w-md`}
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-mono text-xs text-gray-400 uppercase tracking-widest">Description</label>
              <textarea
                rows={3}
                placeholder="Optional — describe what belongs in this category..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className={`${fieldCls} resize-y max-w-xl`}
              />
            </div>

            <div className="flex gap-3 pt-2 border-t border-gray-100">
              <button type="submit"
                      className="font-mono text-xs font-medium px-5 py-2.5 bg-gray-900 text-white rounded hover:bg-gray-700 transition-all">
                {editId ? 'Update Category' : 'Create Category'}
              </button>
              <button type="button" onClick={resetForm}
                      className="font-mono text-xs px-5 py-2.5 border border-gray-300 text-gray-600 rounded hover:border-gray-500 transition-all">
                Discard
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Card grid */}
      {categories.length === 0 ? (
        <div className="text-center py-16 font-mono text-xs text-gray-300 uppercase tracking-widest">
          No categories on record.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((category) => (
            <div key={category.id}
                 className="bg-white border border-gray-200 rounded-md p-5 flex flex-col gap-3 hover:border-gray-300 transition-colors">

              {/* Card header */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-8 h-8 rounded flex items-center justify-center font-mono text-sm font-semibold flex-shrink-0 ${chipColor(category.name)}`}>
                    {(category.name || '?')[0].toUpperCase()}
                  </div>
                  <h3 className="font-medium text-gray-900 text-sm leading-snug truncate">
                    {category.name}
                  </h3>
                </div>
                <span className="font-mono text-xs text-gray-300 flex-shrink-0">
                  #{String(category.id).padStart(3, '0')}
                </span>
              </div>

              {/* Description */}
              <p className="text-sm text-gray-500 leading-relaxed flex-1 min-h-[2.5rem]">
                {category.description || (
                  <span className="text-gray-300 italic">No description provided.</span>
                )}
              </p>

              {/* Card footer */}
              <div className="flex gap-2 pt-2 border-t border-gray-100">
                <button onClick={() => handleEdit(category)}
                        className="font-mono text-xs px-2.5 py-1 rounded border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 transition-all">
                  Edit
                </button>
                <button onClick={() => handleDelete(category.id)}
                        className="font-mono text-xs px-2.5 py-1 rounded border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 transition-all">
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}