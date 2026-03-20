import client from './client';

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
  submit: (id) => client.post(`/purchase-orders/${id}/submit`),
  approve: (id) => client.post(`/purchase-orders/${id}/approve`),
  reject: (id) => client.post(`/purchase-orders/${id}/reject`),
  receive: (id) => client.post(`/purchase-orders/${id}/receive`),
};

export const requisitionsApi = {
  list: (params) => client.get('/requisitions', { params }),
  get: (id) => client.get(`/requisitions/${id}`),
  create: (data) => client.post('/requisitions', data),
  submit: (id) => client.post(`/requisitions/${id}/submit`),
  approve: (id) => client.post(`/requisitions/${id}/approve`),
  reject: (id) => client.post(`/requisitions/${id}/reject`),
  issue: (id) => client.post(`/requisitions/${id}/issue`),
};

export const dashboardApi = {
  getStats: () => client.get('/dashboard'),
};
export const reportsApi = {

  inventoryValuation: () =>
    client.get('/reports/inventory-valuation'),

  stockMovement: (params) =>
    client.get('/reports/stock-movement', { params }),

  lowStock: () =>
    client.get('/reports/low-stock'),

  supplierPerformance: (params) =>
    client.get('/reports/supplier-performance', { params }),

  monthlyTrend: () =>
    client.get('/reports/monthly-trend'),

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
