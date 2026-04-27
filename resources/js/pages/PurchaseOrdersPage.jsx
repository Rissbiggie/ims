import { useEffect, useState } from 'react';
import { purchaseOrdersApi, suppliersApi, productsApi } from '../api';

export default function PurchaseOrdersPage() {
  // --- State ---
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

  // --- Data Fetching ---
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
      // Handle both paginated and non-paginated responses
      setOrders(ordersRes.data?.data || ordersRes.data || []);
      setSuppliers(suppliersRes.data?.data || suppliersRes.data || []);
      setProducts(productsRes.data?.data || productsRes.data || []);
    } catch (err) {
      setError('Failed to load procurement data.');
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  // --- Form Handlers ---
  const handleAddItem = () => {
    setItems([...items, { product_id: '', quantity_ordered: '', unit_price: '' }]);
  };

  const handleRemoveItem = (index) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index, field, value) => {
    const updatedItems = [...items];
    updatedItems[index][field] = value;
    setItems(updatedItems);
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

    // Validate at least one item exists
    if (items.length === 0) {
      setError('At least one item is required for the order.');
      return;
    }

    // Validate all items have required fields
    for (const item of items) {
      if (!item.product_id || !item.quantity_ordered || !item.unit_price) {
        setError('All order items must have a product, quantity, and price.');
        return;
      }
    }

    const payload = {
      ...formData,
      items: items.map((item) => ({
        product_id: Number(item.product_id),
        quantity_ordered: Number(item.quantity_ordered),
        unit_price: Number(item.unit_price),
      })),
    };

    try {
      if (editId) {
        await purchaseOrdersApi.update(editId, payload);
      } else {
        await purchaseOrdersApi.create(payload);
      }
      await fetchData();
      resetForm();
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to save order.';
      setError(errorMessage);
      console.error('Submit error:', err);
    }
  };

  // --- Action Handlers ---
  const handleAction = async (id, action) => {
    setError('');
    try {
      if (action === 'submit') {
        await purchaseOrdersApi.submit(id);
      } else if (action === 'approve') {
        await purchaseOrdersApi.approve(id);
      } else if (action === 'reject') {
        await purchaseOrdersApi.reject(id);
      } else if (action === 'receive') {
        // Find the order in the current state
        const order = orders.find(o => o.id === id);
        if (!order) {
          setError('Order not found in current data.');
          return;
        }

        // Prepare the payload with items
        const receivePayload = {
          items: order.items.map(item => ({
            product_id: item.product_id,
            quantity_received: item.quantity_ordered, // or item.quantity if that's what your backend expects
            // Add any other required fields here
          }))
        };

        // Send the payload to the backend
        await purchaseOrdersApi.receive(id, receivePayload);
      }
      await fetchData(); // Refresh the data after any action
    } catch (err) {
      const errorMessage = err.response?.data?.message ||
                         `Action Failed: Could not ${action} the order.`;
      setError(errorMessage);
      console.error(`Action error (${action}):`, err);
    }
  };

  const resetForm = () => {
    setFormData({
      supplier_id: '',
      expected_delivery_date: '',
      notes: '',
    });
    setItems([]);
    setEditId(null);
    setShowForm(false);
    setError('');
  };

  // --- Computed Values ---
  const awaitingApprovalCount = orders.filter(o => o.status === 'pending_approval').length;
  const approvedCount = orders.filter(o => o.status === 'approved').length;
  const totalValue = orders.reduce((sum, o) => sum + Number(o.total_amount || 0), 0);

  // Status styles for badges
  const statusStyles = {
    draft: 'bg-gray-100 text-gray-500 border-gray-200',
    pending_approval: 'bg-blue-50 text-blue-700 border-blue-100',
    approved: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    received: 'bg-indigo-50 text-indigo-700 border-indigo-100',
    rejected: 'bg-red-50 text-red-700 border-red-100',
  };

  // --- Loading State ---
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-2">
          <div className="w-6 h-6 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
          <span className="font-mono text-[10px] tracking-widest text-gray-400 uppercase animate-pulse">
            Loading Purchase Orders...
          </span>
        </div>
      </div>
    );
  }

  // --- Main Render ---
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10"
         style={{ fontFamily: "'IBM Plex Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@300;400;500;600&display=swap');
      `}</style>

      {/* Header */}
      <div className="flex justify-between items-end mb-8 pb-4 border-b-2 border-gray-900">
        <div>
          <h1 className="font-mono text-2xl font-bold tracking-tighter text-gray-900 uppercase">
            Purchase Orders
          </h1>
          <p className="text-xs text-gray-500 font-medium mt-1">
            Manage your procurement pipeline
          </p>
        </div>
        <button
          onClick={() => showForm ? resetForm() : setShowForm(true)}
          className={`font-mono text-[10px] font-bold tracking-widest px-4 py-2 rounded transition-all uppercase ${
            showForm
              ? 'border border-gray-300 text-gray-400 hover:bg-gray-50'
              : 'bg-gray-900 text-white hover:bg-gray-700'
          }`}
        >
          {showForm ? 'Cancel' : '+ New Order'}
        </button>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-gray-50 p-5 border border-gray-100 rounded">
          <p className="font-mono text-[9px] text-gray-400 uppercase tracking-widest mb-1">
            Awaiting Approval
          </p>
          <p className="font-mono text-2xl font-bold text-blue-600">
            {awaitingApprovalCount}
          </p>
        </div>
        <div className="bg-gray-50 p-5 border border-gray-100 rounded">
          <p className="font-mono text-[9px] text-gray-400 uppercase tracking-widest mb-1">
            Approved Orders
          </p>
          <p className="font-mono text-2xl font-bold text-emerald-600">
            {approvedCount}
          </p>
        </div>
        <div className="bg-gray-50 p-5 border border-gray-100 rounded">
          <p className="font-mono text-[9px] text-gray-400 uppercase tracking-widest mb-1">
            Total Pipeline (KES)
          </p>
          <p className="font-mono text-2xl font-bold text-gray-900">
            {totalValue.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 mb-6">
          <p className="font-mono text-[10px] uppercase tracking-widest">{error}</p>
        </div>
      )}

      {/* Order Form */}
      {showForm && (
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-10 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Supplier and Date */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="font-mono text-[10px] text-gray-400 uppercase tracking-widest">
                  Supplier *
                </label>
                <select
                  value={formData.supplier_id}
                  onChange={(e) => setFormData({...formData, supplier_id: e.target.value})}
                  className="w-full text-sm p-2.5 bg-gray-50 border border-gray-200 rounded focus:outline-none focus:border-gray-500"
                  required
                >
                  <option value="">Select Supplier</option>
                  {suppliers.map((supplier) => (
                    <option key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="font-mono text-[10px] text-gray-400 uppercase tracking-widest">
                  Expected Delivery Date *
                </label>
                <input
                  type="date"
                  value={formData.expected_delivery_date}
                  onChange={(e) => setFormData({...formData, expected_delivery_date: e.target.value})}
                  className="w-full text-sm p-2.5 bg-gray-50 border border-gray-200 rounded focus:outline-none focus:border-gray-500"
                  required
                />
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <label className="font-mono text-[10px] text-gray-400 uppercase tracking-widest">
                Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                className="w-full text-sm p-2.5 bg-gray-50 border border-gray-200 rounded focus:outline-none focus:border-gray-500"
                rows={3}
                placeholder="Additional notes about this order..."
              />
            </div>

            {/* Order Items Section */}
            <div className="border-t border-gray-100 pt-6 space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-mono text-[10px] font-bold uppercase text-gray-500 tracking-widest">
                  Order Items
                </h3>
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="text-[10px] font-mono font-bold border border-gray-900 px-3 py-1 rounded hover:bg-gray-900 hover:text-white transition-colors"
                >
                  + Add Item
                </button>
              </div>

              {/* Items Table */}
              <div className="space-y-3">
                {items.map((item, index) => (
                  <div
                    key={index}
                    className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr_auto] gap-3 items-center p-3 bg-gray-50 rounded"
                  >
                    <select
                      value={item.product_id}
                      onChange={(e) => handleItemChange(index, 'product_id', e.target.value)}
                      className="text-sm p-2 bg-white border border-gray-200 rounded focus:outline-none focus:border-gray-500"
                      required
                    >
                      <option value="">Select Product</option>
                      {products.map((product) => (
                        <option key={product.id} value={product.id}>
                          {product.name} ({product.sku || product.id})
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      value={item.quantity_ordered}
                      onChange={(e) => handleItemChange(index, 'quantity_ordered', e.target.value)}
                      placeholder="Qty"
                      min="1"
                      className="text-sm p-2 bg-white border border-gray-200 rounded focus:outline-none focus:border-gray-500"
                      required
                    />
                    <input
                      type="number"
                      value={item.unit_price}
                      onChange={(e) => handleItemChange(index, 'unit_price', e.target.value)}
                      placeholder="Price (KES)"
                      min="0"
                      step="0.01"
                      className="text-sm p-2 bg-white border border-gray-200 rounded focus:outline-none focus:border-gray-500"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(index)}
                      className="text-red-400 hover:text-red-600 transition-colors"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex gap-4 pt-4 border-t border-gray-100">
              <button
                type="submit"
                className="bg-gray-900 text-white font-mono text-[10px] font-bold px-8 py-3 rounded uppercase tracking-widest hover:bg-gray-700 transition-colors"
              >
                {editId ? 'Update Order' : 'Create Order'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="font-mono text-[10px] text-gray-500 uppercase tracking-widest px-4 hover:text-gray-700"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Orders Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-4 text-left font-mono text-[10px] uppercase tracking-widest text-gray-400">
                Order #
              </th>
              <th className="px-6 py-4 text-left font-mono text-[10px] uppercase tracking-widest text-gray-400">
                Supplier
              </th>
              <th className="px-6 py-4 text-left font-mono text-[10px] uppercase tracking-widest text-gray-400">
                Status
              </th>
              <th className="px-6 py-4 text-left font-mono text-[10px] uppercase tracking-widest text-gray-400">
                Total (KES)
              </th>
              <th className="px-6 py-4 text-left font-mono text-[10px] uppercase tracking-widest text-gray-400">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {orders.length > 0 ? (
              orders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-mono text-xs font-bold text-gray-900">
                      {order.order_number}
                    </p>
                    <p className="text-[10px] text-gray-400 font-mono">
                      ID: {order.id}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-medium text-gray-800">
                      {order.supplier?.name || 'N/A'}
                    </p>
                    <p className="text-[10px] text-gray-400">
                      {order.supplier?.email || ''}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 rounded border font-mono text-[9px] font-bold uppercase tracking-tighter ${
                        statusStyles[order.status] || 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {order.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-mono text-sm font-bold text-gray-900">
                    {Number(order.total_amount || 0).toLocaleString()}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      {/* Draft/Rejected: Can edit or submit */}
                      {(order.status === 'draft' || order.status === 'rejected') && (
                        <>
                          <button
                            onClick={() => handleEdit(order)}
                            className="text-[9px] font-mono font-bold border border-gray-300 px-3 py-1.5 rounded uppercase hover:bg-gray-100 transition-colors"
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

                      {/* Pending Approval: Can approve or reject */}
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

                      {/* Approved: Can receive goods */}
                      {order.status === 'approved' && (
                        <button
                          onClick={() => handleAction(order.id, 'receive')}
                          className="text-[9px] font-mono font-bold bg-indigo-600 text-white px-4 py-1.5 rounded uppercase hover:bg-indigo-700 transition-colors"
                        >
                          Receive Goods
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="px-6 py-10 text-center">
                  <p className="font-mono text-xs text-gray-300 uppercase tracking-widest">
                    No purchase orders found
                  </p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}