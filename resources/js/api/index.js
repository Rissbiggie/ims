import client from './client';

export { default as apiClient } from './client';

export const authApi = {
  login: (email, password) => client.post('/login', { email, password }),
  logout: () => client.post('/logout'),
  getProfile: () => client.get('/me'),
};

export const productsApi = {
  list: (params) => client.get('/products', { params }),
  get: (id) => client.get(`/products/${id}`),
  create: (data) => client.post('/products', data),
  update: (id, data) => client.put(`/products/${id}`, data),
  delete: (id) => client.delete(`/products/${id}`),
  adjustStock: (id, data) => client.post(`/products/${id}/adjust-stock`, data),
  writeOff: (id, data) => client.post(`/products/${id}/write-off`, data),
};

export const categoriesApi = {
  list: (params) => client.get('/categories', { params }),
  get: (id) => client.get(`/categories/${id}`),
  create: (data) => client.post('/categories', data),
  update: (id, data) => client.put(`/categories/${id}`, data),
  delete: (id) => client.delete(`/categories/${id}`),
};

export const suppliersApi = {
  list: (params) => client.get('/suppliers', { params }),
  get: (id) => client.get(`/suppliers/${id}`),
  create: (data) => client.post('/suppliers', data),
  update: (id, data) => client.put(`/suppliers/${id}`, data),
  delete: (id) => client.delete(`/suppliers/${id}`),
};

export const purchaseOrdersApi = {
  list: (params) => client.get('/purchase-orders', { params }),
  get: (id) => client.get(`/purchase-orders/${id}`),
  create: (data) => client.post('/purchase-orders', data),
  update: (id, data) => client.put(`/purchase-orders/${id}`, data),
  submit: (id) => client.post(`/purchase-orders/${id}/submit`),
  approve: (id) => client.post(`/purchase-orders/${id}/approve`),
  reject: (id) => client.post(`/purchase-orders/${id}/reject`),
  receive: (id, data) => client.post(`/purchase-orders/${id}/receive`, data), // <-- FIXED: Now accepts data
};

export const requisitionsApi = {
  // GET /requisitions (filtered by status)
  getAll: (params) => client.get('/requisitions', { params }),
  
  // POST /requisitions (payload: { ..., submit: true/false })
  create: (data) => client.post('/requisitions', data),
  
  // PATCH /requisitions/:id/submit
  submit: (id) => client.patch(`/requisitions/${id}/submit`),
  
  // POST /requisitions/:id/approve (payload: { approved_quantities: {} })
  approve: (id, data) => client.post(`/requisitions/${id}/approve`, data),
  
  // POST /requisitions/:id/issue (payload: { items: [] })
  issue: (id, data) => client.post(`/requisitions/${id}/issue`, data),
};

export const dashboardApi = {
  getStats: () => client.get('/dashboard'),
};

export const reportsApi = {
    // Standard JSON APIs
    inventoryValuation: () => client.get('/reports/inventory-valuation'),
    stockMovement: (from, to) => client.get(`/reports/stock-movement?from=${from}&to=${to}`),
    lowStock: () => client.get('/reports/low-stock'),
    supplierPerformance: (from, to) => client.get(`/reports/supplier-performance?from=${from}&to=${to}`),
    monthlyTrend: () => client.get('/reports/monthly-trend'),
    topProducts: () => client.get('/reports/top-products'),
    forecast: () => client.get('/reports/forecast'),
    categoryDistribution: () => client.get('/reports/category-distribution'),

    // --- NEW PDF PRINT APIS ---
    
    /**
     * Triggers the Inventory Valuation PDF stream.
     * Use responseType: 'blob' to handle binary PDF data.
     */
    printInventoryPdf: () => client.get('/reports/inventory-valuation/pdf', { 
        responseType: 'blob' 
    }),

    /**
     * Triggers the Stock Movement PDF download for a specific range.
     */
    printMovementPdf: (from, to) => client.get(`/reports/stock-movement/pdf?from=${from}&to=${to}`, { 
        responseType: 'blob' 
    }),
};

export const usersApi = {
  list: (params) => client.get('/users', { params }),
  get: (id) => client.get(`/users/${id}`),
  create: (data) => client.post('/users', data),
  update: (id, data) => client.put(`/users/${id}`, data),
  delete: (id) => client.delete(`/users/${id}`),
};

export const alertsApi = {
  list: (params) => client.get('/alerts', { params }),
  get: (id) => client.get(`/alerts/${id}`),
  acknowledge: (id) => client.post(`/alerts/${id}/acknowledge`),
};

export const stockTransactionsApi = {
  list: (params) => client.get('/stock-transactions', { params }),
};
