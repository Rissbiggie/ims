# Role-Based Dashboard - Quick Reference

## 📋 Quick File Reference

### Backend Controllers (app/Http/Controllers/)
| File | Purpose | Middleware |
|------|---------|-----------|
| AdminDashboardController.php | System overview & control | role:admin |
| ManagerDashboardController.php | Procurement oversight | role:manager |
| ClerkDashboardController.php | Daily tasks & operations | role:store_clerk |

### Backend Services (app/Services/)
| File | Methods | Data |
|------|---------|------|
| AdminDashboardService.php | getDashboardData(), getUserActivity(), getSystemHealth() | System-wide metrics |
| ManagerDashboardService.php | getDashboardData(), getApprovalQueue(), getProcurementMetrics() | Procurement data |
| ClerkDashboardService.php | getDashboardData(), getTodaysTasks(), getPendingOperations() | Task & operation data |

### Frontend Pages (resources/js/pages/)
| File | Tabs | Route |
|------|------|-------|
| AdminDashboard.jsx | Overview, Users, Activity, Alerts | /admin-dashboard |
| ManagerDashboard.jsx | Overview, Approvals, Procurement, Transactions | /manager-dashboard |
| ClerkDashboard.jsx | Tasks, Operations, Alerts, Activity | /clerk-dashboard |

### Modified Files
| File | Changes |
|------|---------|
| routes/api.php | Added role-based dashboard routes (3 groups) |
| AuthController.php | Added dashboard_route to login response |
| App.jsx | Imported & added 3 new dashboard route definitions |
| LoginPage.jsx | Updated redirect to use dashboard_route from response |
| authStore.js | Added dashboardRoute state management |
| api/index.js | Exported apiClient for direct usage |

---

## 🔌 API Endpoints

### Admin Endpoints
```
GET  /api/admin-dashboard              # Full dashboard
GET  /api/admin-dashboard/user-activity
GET  /api/admin-dashboard/system-health
```

### Manager Endpoints
```
GET  /api/manager-dashboard              # Full dashboard
GET  /api/manager-dashboard/approval-queue
GET  /api/manager-dashboard/procurement-metrics
```

### Clerk Endpoints
```
GET  /api/clerk-dashboard              # Full dashboard
GET  /api/clerk-dashboard/todays-tasks
GET  /api/clerk-dashboard/pending-operations
```

---

## 🎯 Key Business Logic

### Admin Dashboard
```
Inventory Health = (total - low_stock - out_of_stock) / total * 100
User Login Tracking: last_login_at >= now()->subDay()
System Health: unresolved alerts + data integrity checks
```

### Manager Dashboard
```
MoM Growth = (current_month - previous_month) / previous_month * 100
Budget Used = (monthly_spend / estimated_budget) * 100
Supplier Rank: by total_value DESC
Priority: HIGH if order_value > 50000, else NORMAL
```

### Clerk Dashboard
```
Task Checklist: approved POs + approved requisitions + critical alerts
Stock Status: available >= requested ? 'ready' : 'insufficient_stock'
Alert Severity: outOfStock() ? 'CRITICAL' : 'WARNING'
```

---

## 🔐 Security

### Middleware
- **Route Protection**: `middleware('role:admin')` etc.
- **Validation**: RequireRole.php checks user->hasRole()
- **Response**: 403 Forbidden if unauthorized

### Auth Flow
1. User login → AuthController.login()
2. Validate credentials & user active status
3. Create Sanctum token
4. Return dashboard_route based on user role
5. Frontend redirects to role-specific page

---

## 🎨 Styling System

### Color Codes
- **Gray-900**: Headers, primary text
- **Red-600**: Critical alerts, out of stock
- **Amber-600**: Warnings, pending approvals
- **Green-600**: Stock in, healthy metrics
- **Blue-600**: Info, pending requisitions

### Responsive Grid
- Mobile: `grid-cols-2`
- Desktop: `grid-cols-4` (or `grid-cols-3`, `grid-cols-5`)
- Tablet: breakpoint at `lg:`

### Typography
- Headers: `font-mono text-[10px] uppercase tracking-widest`
- Titles: `text-sm font-semibold`
- Data: `font-mono font-bold`

---

## 🚀 Quick Start for Developers

### Adding a New Metric to Admin Dashboard

1. **Backend Service** (AdminDashboardService.php)
```php
private function getNewMetric(): array {
    $data = /* query data */;
    return ['metric_name' => $data];
}

// Add to getDashboardData():
'new_metric' => $this->getNewMetric(),
```

2. **Frontend Component** (AdminDashboard.jsx)
```jsx
const newMetric = data?.new_metric || {};
// In render:
<MetricCard label="Label" value={newMetric.value} color="text-blue-600" />
```

### Adding a New Tab to Dashboard

1. Add tab button with className condition
```jsx
<button onClick={() => setActiveTab('new_tab')} className={...}>
  New Tab
</button>
```

2. Add conditional render
```jsx
{activeTab === 'new_tab' && (
  <div>
    {/* Tab content */}
  </div>
)}
```

---

## 📊 Data Response Format

### Admin Dashboard Response
```json
{
  "overview": {
    "total_products": 150,
    "total_inventory_value": 500000,
    "inventory_health": 85
  },
  "critical_metrics": {
    "pending_approvals": {
      "purchase_orders": 5,
      "requisitions": 3
    }
  },
  "alerts": [...],
  "recent_activity": [...]
}
```

### Manager Dashboard Response
```json
{
  "key_metrics": {
    "pending_approvals": {"purchase_orders": 5, "requisitions": 3},
    "todays_activity": {"po_created": 2, ...}
  },
  "approval_queue": [
    {
      "id": 1,
      "type": "Purchase Order",
      "supplier": "ABC Corp",
      "priority": "HIGH"
    }
  ]
}
```

### Clerk Dashboard Response
```json
{
  "todays_tasks": [
    {
      "task_type": "PO_RECEIPT",
      "priority": "HIGH",
      "status": "pending_receipt"
    }
  ],
  "stock_alerts": {
    "critical_count": 2,
    "critical_alerts": [...]
  }
}
```

---

## 🧪 Testing Commands

### Backend Routes
```bash
php artisan route:list --path=dashboard
php artisan route:list --name=dashboard
```

### Frontend Build
```bash
npm run build -- --analyze  # Check bundle size
npm run dev                  # Start dev server
npm run lint               # Check for errors
```

### API Testing (with cURL)
```bash
# Login
curl -X POST http://localhost:8000/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password"}'

# Get Admin Dashboard
curl -X GET http://localhost:8000/api/admin-dashboard \
  -H "Authorization: Bearer {token}"
```

---

## 📈 Performance Tips

1. **Query Optimization**: Use `with()` for eager loading
2. **Data Limits**: Cap recent activity at 20 items
3. **Caching**: Consider Redis for dashboard stats
4. **Pagination**: Add limit/offset to list endpoints
5. **Indexing**: Ensure DB indexes on `role`, `status`, dates

---

## 🔄 State Management

### Zustand Auth Store
```javascript
// Get current auth state
const { user, token, dashboardRoute } = useAuthStore();

// Login
await useAuthStore().login(email, password);

// Logout
await useAuthStore().logout();

// Access dashboard route from response
const response = await login(email, password);
navigate(response.dashboard_route);
```

---

## 🐛 Debugging Tips

1. **Network Tab**: Check API requests and responses
2. **React DevTools**: Inspect component state
3. **Console Logs**: Add debug output in services
4. **Laravel Debugbar**: Monitor queries in dev

### Example Debug Output
```javascript
console.log('Dashboard data:', data);
console.log('User role:', user?.role);
console.log('Route params:', location.pathname);
```

---

## 📦 Dependencies

### Backend
- Laravel 11
- Sanctum (authentication)
- Built-in middleware system

### Frontend
- React 18+
- Zustand (state management)
- Axios (HTTP client)
- Tailwind CSS (styling)
- React Router (navigation)

---

## ✅ Deployment Checklist

- [ ] Database migrations run
- [ ] API keys configured
- [ ] Frontend environment variables set
- [ ] Role middleware registered
- [ ] Dashboard services instantiated
- [ ] Frontend build created
- [ ] Asset manifest generated
- [ ] CORS configured (if separate domains)
- [ ] Rate limiting enabled
- [ ] Error logging configured

---

Generated: 2024 | IMS Role-Based Dashboard v1.0
