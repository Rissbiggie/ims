# Role-Based Login & Dashboard System - Implementation Guide

## 🎯 Overview

A comprehensive role-based login system has been implemented for your IMS application. Users with different roles (Admin, Manager, Store Clerk) now have dedicated dashboards with role-specific features and data tailored to their responsibilities.

---

## 🏗️ Architecture

### Backend Stack
- **Laravel 11** with Sanctum authentication
- **Role-based middleware** for route protection
- **Custom controllers** for each role's dashboard
- **Service layer** for business logic and data aggregation

### Frontend Stack
- **React** with Vite
- **Zustand** for state management
- **Tailwind CSS** for styling (maintained existing aesthetic)
- **IBM Plex Sans/Mono** font family

---

## 🔐 Login Flow

```
User Login (Email/Password)
        ↓
AuthController validates credentials
        ↓
Returns user data + token + dashboard_route
        ↓
Frontend redirects to role-specific dashboard
        ↓
RoleProtectedRoute renders appropriate component
```

### Example Login Response:
```json
{
  "user": {
    "id": 1,
    "name": "Admin User",
    "email": "admin@example.com",
    "role": "admin"
  },
  "token": "abc123...",
  "dashboard_route": "/admin-dashboard"
}
```

---

## 👥 Role-Based Dashboards

### 1. **ADMIN DASHBOARD** (`/admin-dashboard`)
**Purpose:** System-wide oversight and control

#### Key Metrics:
- Total inventory value and health percentage
- Low/out-of-stock items count
- Pending approvals (POs + Requisitions)
- Daily transactions summary
- User statistics (active, inactive, logins)
- Financial summary (monthly PO value, avg cost)

#### Features:
- **Overview Tab**: Inventory health, pending approvals, financial metrics
- **Users Tab**: Active users, users by role, login analytics
- **Activity Tab**: 20 recent system activities with timestamps
- **Alerts Tab**: Critical stock alerts with severity levels

#### Unique Logic:
- Calculates inventory health percentage: `(total - low - out) / total * 100`
- Groups users by role for performance tracking
- Color-codes alerts: RED=Critical, AMBER=Warning

#### API Endpoints:
```
GET  /api/admin-dashboard              → Full dashboard data
GET  /api/admin-dashboard/user-activity  → Login & audit logs
GET  /api/admin-dashboard/system-health  → System metrics
```

---

### 2. **MANAGER DASHBOARD** (`/manager-dashboard`)
**Purpose:** Procurement oversight and operational control

#### Key Metrics:
- Pending purchase orders & requisitions
- Today's activity (POs created, requisitions, stock movements)
- Monthly approve PO value
- Current month procurement spend
- Budget percentage used vs. target
- Supplier performance ranking

#### Features:
- **Overview Tab**: Today's activity, monthly summary, budget status
- **Approvals Tab**: Queue of pending POs & requisitions with priorities
- **Procurement Tab**: Performance metrics, MoM growth %, top suppliers
- **Transactions Tab**: Recent stock movements (last 7 days)

#### Unique Logic:
- Calculates MoM growth: `(current_month - previous_month) / previous_month * 100`
- Ranks suppliers by total order value and count
- Color priorities: HIGH (red) for >50K orders, NORMAL (amber) for rest
- Tracks budget usage percentage and highlights overspend

#### API Endpoints:
```
GET  /api/manager-dashboard              → Full dashboard data
GET  /api/manager-dashboard/approval-queue     → Pending items
GET  /api/manager-dashboard/procurement-metrics → Performance data
```

---

### 3. **CLERK DASHBOARD** (`/clerk-dashboard`)
**Purpose:** Daily task management and stock operations

#### Key Metrics:
- Transactions today (in/out counts)
- Pending requisitions
- Low stock items count
- Out of stock items
- Critical & warning alerts

#### Features:
- **Tasks Tab**: Daily task checklist (PO receipts, requisition issues, alerts)
- **Operations Tab**: Pending stock transactions & requisition items to issue
- **Alerts Tab**: Critical (red) and warning (amber) alerts with stock levels
- **Activity Tab**: Recent 2-day activity audit trail

#### Unique Logic:
- Tasks have priority levels (CRITICAL, HIGH, NORMAL)
- Color-codes transactions: Green=Receiving, Red=Issuing
- Shows stock availability status for requisition items
- Shows items with insufficient stock highlighted in red
- Critical alerts banner if any out-of-stock items exist

#### API Endpoints:
```
GET  /api/clerk-dashboard              → Full dashboard data
GET  /api/clerk-dashboard/todays-tasks       → Daily checklist
GET  /api/clerk-dashboard/pending-operations → Stock operations
```

---

## 🎨 Frontend Pages

### AdminDashboard.jsx
- Tabbed interface with 4 tabs
- Metric cards with Tailwind styling
- User statistics table
- Activity feed with timestamps
- Alert list with severity indicators

### ManagerDashboard.jsx
- Tabbed interface with 4 tabs
- Quick stat cards (smaller, focused layout)
- Approval queue with priority badges
- Procurement metrics with growth indicators
- Supplier performance ranking

### ClerkDashboard.jsx
- Tabbed interface with 4 tabs
- Task checklist with checkbox interaction
- Color-coded priorities (CRITICAL=red, HIGH=amber)
- Operations split: transactions + requisition items
- Alert categorization (critical vs warning)

### Styling Features:
- **Colors Used:**
  - Gray-900: Headers and main elements
  - Red-600: Critical alerts/out-of-stock
  - Amber-600: Warnings/pending approvals
  - Green-600: Healthy stock/in-flow
  - Blue-600: Information/pending requisitions

- **Typography:**
  - Font: IBM Plex Sans (main), IBM Plex Mono (data)
  - Headers: Bold, uppercase, monospace
  - Sizes: 10px labels, 12px text, 14-48px headers

- **Layout:**
  - Max 7xl container, responsive grid
  - 4 column on desktop, 2 column on mobile
  - 6px base spacing unit (p-6 = 24px)

---

## 🔧 Backend Implementation

### Controllers

#### AdminDashboardController.php
```php
class AdminDashboardController {
    public function index(Request $request): JsonResponse
    public function userActivity(Request $request): JsonResponse
    public function systemHealth(Request $request): JsonResponse
}
```

#### ManagerDashboardController.php
```php
class ManagerDashboardController {
    public function index(Request $request): JsonResponse
    public function approvalQueue(Request $request): JsonResponse
    public function procurementMetrics(Request $request): JsonResponse
}
```

#### ClerkDashboardController.php
```php
class ClerkDashboardController {
    public function index(Request $request): JsonResponse
    public function todaysTasks(Request $request): JsonResponse
    public function pendingOperations(Request $request): JsonResponse
}
```

### Services

Each service handles complex business logic:

- **AdminDashboardService**: System analytics, user tracking, financial summaries
- **ManagerDashboardService**: Procurement analytics, supplier performance, budget tracking
- **ClerkDashboardService**: Task generation, operation tracking, alert categorization

#### Example Logic in Services:
```php
// Calculate inventory health
$healthyItems = $total - $lowStock - $outOfStock;
return round(($healthyItems / $total) * 100);

// Calculate MoM growth
$growth = ($current - $previous) / $previous * 100;

// Rank suppliers
$suppliers = DB::table('purchase_orders')
    ->join('suppliers', 'purchase_orders.supplier_id', '=', 'suppliers.id')
    ->select('suppliers.name', DB::raw('COUNT(*) as order_count'))
    ->groupBy('suppliers.id')
    ->orderByDesc('order_count')
    ->limit(5)
    ->get();
```

---

## 📁 Files Created/Modified

### New Files Created:

**Backend:**
- `/app/Http/Controllers/AdminDashboardController.php`
- `/app/Http/Controllers/ManagerDashboardController.php`
- `/app/Http/Controllers/ClerkDashboardController.php`
- `/app/Services/AdminDashboardService.php`
- `/app/Services/ManagerDashboardService.php`
- `/app/Services/ClerkDashboardService.php`

**Frontend:**
- `/resources/js/pages/AdminDashboard.jsx`
- `/resources/js/pages/ManagerDashboard.jsx`
- `/resources/js/pages/ClerkDashboard.jsx`

### Modified Files:

**Backend:**
- `/app/Http/Controllers/AuthController.php` - Added dashboard_route to login response
- `/routes/api.php` - Added role-based dashboard route groups

**Frontend:**
- `/resources/js/App.jsx` - Added new dashboard routes
- `/resources/js/pages/LoginPage.jsx` - Updated redirect to use dashboard_route
- `/resources/js/stores/authStore.js` - Store dashboard_route on login
- `/resources/js/api/index.js` - Exported apiClient

---

## 🔐 Route Protection

All dashboard routes use role middleware:

```php
// routes/api.php
Route::middleware('role:admin')->prefix('admin-dashboard')->group(function () {
    // Admin only routes
});

Route::middleware('role:manager')->prefix('manager-dashboard')->group(function () {
    // Manager only routes
});

Route::middleware('role:store_clerk')->prefix('clerk-dashboard')->group(function () {
    // Clerk only routes
});
```

The `role` middleware validates user role and returns 403 if unauthorized.

---

## 🧪 Testing Checklist

### 1. Authentication
- [ ] Login with admin@example.com → redirects to `/admin-dashboard`
- [ ] Login with manager account → redirects to `/manager-dashboard`
- [ ] Login with store_clerk account → redirects to `/clerk-dashboard`
- [ ] Dashboard route persisted in localStorage
- [ ] Logout clears token and dashboardRoute

### 2. Admin Dashboard
- [ ] Displays system-wide metrics
- [ ] Shows pending approvals count
- [ ] Lists recent activities (20 items)
- [ ] Shows user statistics by role
- [ ] Displays inventory health percentage
- [ ] Tabs switch correctly

### 3. Manager Dashboard
- [ ] Shows pending approvals with priorities
- [ ] Displays budget usage percentage
- [ ] Shows top suppliers ranked by value
- [ ] Displays MoM growth percentage
- [ ] Recent transactions limited to 7 days
- [ ] Tabs switch correctly

### 4. Clerk Dashboard
- [ ] Shows today's task checklist
- [ ] Displays pending operations (transactions + requisitions)
- [ ] Shows critical alerts banner
- [ ] Separates critical (red) and warning (amber) alerts
- [ ] Shows stock availability status
- [ ] Tabs switch correctly

### 5. Styling
- [ ] Colors consistent across all dashboards
- [ ] Responsive layout on mobile (2 cols) and desktop (4 cols)
- [ ] IBM Plex Sans font applied
- [ ] Hover effects on interactive elements
- [ ] Loading spinner displays correctly

### 6. API Integration
- [ ] Dashboard endpoints return correct data
- [ ] Role middleware prevents unauthorized access
- [ ] Error messages display on API failure
- [ ] Token automatically added to requests

---

## 🚀 Deployment Notes

### Backend Requirements:
- Laravel 11+
- PHP 8.1+
- SQLite/MySQL database with existing schema
- Sanctum authentication configured

### Frontend Requirements:
- Node.js 16+ with npm/yarn
- Vite build tool
- Environment: `VITE_API_URL=http://localhost:8000/api`

### Build & Deploy:
```bash
# Backend
php artisan migrate
php artisan serve

# Frontend
npm install
npm run dev  # Development
npm run build  # Production
```

---

## 📊 Data Flow Diagram

```
Login Page
    ↓
POST /api/login
    ↓
AuthController.login()
    ↓
Returns {user, token, dashboard_route}
    ↓
Frontend stores token + dashboardRoute in localStorage
    ↓
Navigate to role-specific dashboard
    ↓
MainLayout + Role Dashboard Page
    ↓
Fetch from /api/{admin|manager|clerk}-dashboard
    ↓
RoleService aggregates data with business logic
    ↓
Return formatted JSON response
    ↓
Display in tabbed interface with role-specific metrics
```

---

## 🎯 Future Enhancements

1. **Real-time Updates**: WebSocket integration for live alert updates
2. **Dashboard Customization**: User preferences for widget visibility
3. **Export Features**: PDF/CSV export for reports
4. **Notifications**: Toast/email alerts for critical events
5. **Dark Mode**: Theme toggle for user preference
6. **Mobile App**: React Native companion app
7. **Advanced Analytics**: Trend analysis and forecasting
8. **Multi-tenant**: Support multiple organizations

---

## 💡 Key Insights & Design Decisions

### 1. **Separation of Concerns**
- Each role has dedicated service with business logic
- Controllers remain thin and focused
- Frontend pages independently manage their state

### 2. **Consistent Styling**
- Maintained existing Tailwind/IBM Plex aesthetic
- Used consistent color palette across roles
- Priority indicators help users focus on important items

### 3. **Performance Optimization**
- Aggregated queries in services reduce multiple trips
- Limited data sets (e.g., 20 activities, 5 suppliers)
- Single dashboard API call on page load

### 4. **User Experience**
- Role-specific redirects eliminate navigation confusion
- Task checklists for clerks prioritize daily work
- Approval queues for managers show pending actions
- Metrics for admins track system health

### 5. **Security**
- Role middleware prevents unauthorized access
- Token validation on every request
- Logout clears all session data

---

## 📞 Support & Troubleshooting

### Common Issues:

**Q: Dashboard not loading?**
- A: Check browser console for 401 error → logout and re-login
- A: Verify API_URL in .env matches frontend VITE_API_URL

**Q: Data not displaying?**
- A: Check Network tab in DevTools → verify API returns data
- A: Ensure role middleware allows the request

**Q: Styling looks wrong?**
- A: Clear browser cache and rebuild frontend: `npm run build`
- A: Verify Tailwind CSS is compiled correctly

**Q: Permission denied error?**
- A: Check user role has appropriate permissions in UserRole::permissions()

---

## 🎉 Summary

Your IMS now features a complete role-based system with:
- ✅ Automated dashboard routing based on role
- ✅ Tailored metrics and features for each role
- ✅ Complex business logic for meaningful insights
- ✅ Consistent, responsive design with excellent UX
- ✅ Robust security with role-based middleware
- ✅ Scalable architecture for future enhancements

All dashboards maintain your existing theme/style while providing distinct functionality for Admin, Manager, and Store Clerk roles!
