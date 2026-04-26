# Test Users & Credentials Guide

## 👥 Test User Accounts

Use the following credentials to test each role dashboard:

### Admin User
```
Email: admin@example.com
Password: password
Role: Administrator
Dashboard: /admin-dashboard

Access:
✅ System-wide metrics
✅ User management
✅ All approvals
✅ Financial reports
✅ Audit trail
✅ System health monitoring
```

### Manager User
```
Email: manager@example.com
Password: password
Role: Manager
Dashboard: /manager-dashboard

Access:
✅ Procurement overview
✅ Approval queue (POs & requisitions)
✅ Supplier performance metrics
✅ Budget tracking
✅ Stock reports
✅ Transaction history
```

### Store Clerk User
```
Email: clerk@example.com
Password: password
Role: Store Clerk
Dashboard: /clerk-dashboard

Access:
✅ Daily task checklist
✅ Pending operations
✅ Stock alerts
✅ Activity log
✅ Stock receipt/issue operations
```

---

## 🧪 Test Scenarios

### Scenario 1: Complete Login to Dashboard Flow

**Steps:**
1. Navigate to http://localhost:3000/login
2. Enter `admin@example.com` / `password`
3. Click "Sign in →"
4. Observe redirect to `/admin-dashboard`
5. Verify admin dashboard loads with metrics

**Expected Results:**
- ✅ No errors in console
- ✅ Admin dashboard displays
- ✅ Inventory value shows in header
- ✅ All tabs accessible (Overview, Users, Activity, Alerts)
- ✅ Token stored in localStorage

**Validation:**
```javascript
// In dev console:
localStorage.getItem('token')      // Should show token
localStorage.getItem('dashboard_route')  // Should show /admin-dashboard
```

---

### Scenario 2: Manager Dashboard Data Display

**Steps:**
1. Login as manager
2. Navigate to /manager-dashboard
3. Open Overview tab
4. Check all metric cards display correctly
5. Click through other tabs (Approvals, Procurement, Transactions)

**Expected Results:**
- ✅ Quick stat cards show accurate counts
- ✅ Approval queue items listed (if any pending)
- ✅ Procurement metrics show growth %
- ✅ Budget percentage visible and color-coded
- ✅ Supplier performance ranked by value

**Validation:**
```javascript
// Check API response:
fetch('/api/manager-dashboard')
  .then(r => r.json())
  .then(console.log)
```

---

### Scenario 3: Clerk Task Checklist

**Steps:**
1. Login as clerk
2. View Tasks tab
3. Look for items with CRITICAL priority (red)
4. Look for items with HIGH priority (amber)
5. Check Operations tab for stock items

**Expected Results:**
- ✅ Tasks displayed with correct priorities
- ✅ Color coding matches severity levels
- ✅ Cannot interact with checkboxes (display only in v1)
- ✅ Pending operations show split between transactions & requisitions
- ✅ Stock availability status shown

**Validation:**
```javascript
// Check task priorities:
const tasks = document.querySelectorAll('[data-priority]');
tasks.forEach(task => console.log(task.dataset.priority));
```

---

### Scenario 4: Role-Based Access Control

**Steps:**
1. Login as clerk
2. Try to manually navigate to `/admin-dashboard`
3. Observe behavior
4. Then login as admin
5. Navigate to `/clerk-dashboard`

**Expected Results (Clerk → Admin):**
- ✅ Either redirects to clerk dashboard
- ✅ Or shows access denied message
- ✅ Console shows 403 error in network tab

**Expected Results (Admin → Clerk):**
- ✅ Admin dashboard loads (no restrictions on viewing lower roles)
- ✅ But API returns 403 if calling /clerk-dashboard endpoint

**Validation:**
```bash
# Test API access control:
curl -X GET http://localhost:8000/api/admin-dashboard \
  -H "Authorization: Bearer {clerk_token}"
# Expected: 403 Forbidden
```

---

### Scenario 5: Responsive Design Testing

**Devices:**
- Desktop (1920x1080)
- Tablet (768x1024)
- Mobile (375x667)

**Per Device, Check:**
- [ ] Layout adapts correctly (2 cols mobile, 4 cols desktop)
- [ ] Text readable without zooming
- [ ] Tabs still clickable
- [ ] Charts/metrics visible
- [ ] No horizontal scrolling
- [ ] Navigation accessible

**Test Command:**
```bash
# Firefox/Chrome DevTools Device Emulation:
F12 → Ctrl+Shift+M → Select device
```

---

### Scenario 6: Alert Display & Severity

**Admin Dashboard - Alerts Tab:**

**Critical Alert (Red):**
```
Product: Widget-001
Status: OUT OF STOCK
Severity: CRITICAL (red badge)
Expected: High prominence, red styling
```

**Warning Alert (Amber):**
```
Product: Gadget-002
Status: LOW STOCK
Severity: WARNING (amber badge)
Expected: Medium prominence, amber styling
```

**Expected Results:**
- ✅ Critical alerts appear before warnings
- ✅ Color coding matches severity
- ✅ Product name and stock level visible
- ✅ Timestamp shown

---

### Scenario 7: Data Accuracy

**Admin Dashboard:**
- Total Products: Match count in products table
- Low Stock Count: Match products with `current_quantity < reorder_level`
- Out of Stock: Match products with `current_quantity = 0`
- Pending POs: Match POs with `status = pending_approval`

**Manager Dashboard:**
- Budget %: Should calculate as `spend / budget * 100`
- MoM Growth: Should show % increase/decrease
- Top Suppliers: Ranked by total order value DESC

**Clerk Dashboard:**
- Today's Transactions: Count since 00:00 today
- Pending Tasks: Should sum approved POs + requisitions
- Critical Items: Should highlight outOfStock products

**Validation Query:**
```bash
# Check actual DB values:
php artisan tinker
> Product::active()->lowStock()->count()
> PurchaseOrder::where('status', 'pending_approval')->count()
> StockTransaction::whereDate('transaction_date', today())->count()
```

---

### Scenario 8: Error Handling

**Test API Error:**
1. Logout (clear token)
2. Manually call API: `fetch('/api/admin-dashboard')`
3. Observe error handling

**Expected Results:**
- ✅ Frontend catches 401 error
- ✅ Redirects to login page
- ✅ Shows error message

**Test 403 Forbidden:**
1. Login as clerk
2. Try `/api/admin-dashboard` with clerk token (using Postman)
3. Should return 403

**Expected Response:**
```json
{
  "message": "Forbidden: You do not have the required role (admin)."
}
```

---

## 📊 Sample Data for Testing

### If You Need to Create Test Data:

```bash
php artisan tinker

# Create test users
App\Models\User::create([
  'name' => 'Test Admin',
  'email' => 'test.admin@example.com',
  'password' => bcrypt('password'),
  'role' => 'admin',
  'is_active' => true,
]);

# Create products with low stock
App\Models\Product::whereRaw('current_quantity < reorder_level')->count()

# Create approved POs
App\Models\PurchaseOrder::where('status', 'approved')->count()

# Create stock alerts
App\Models\StockAlert::unresolved()->count()
```

---

## 🐛 Troubleshooting Tests

### Dashboard Not Loading
**Check:**
1. Network tab for API errors
2. Console for JavaScript errors
3. Token validity: `localStorage.getItem('token')`
4. Route exists: `php artisan route:list | grep dashboard`

**Solution:**
```bash
# Clear cache and rebuild
rm -rf node_modules/.cache
npm run build
php artisan cache:clear
```

### Data Not Displaying
**Check:**
1. API response in Network tab
2. Service returns data: `php artisan tinker`
3. Database has actual records
4. Role middleware not blocking request

**Debug:**
```php
// In AdminDashboardService.php
public function getDashboardData(User $user): array {
    \Log::info('Admin dashboard requested by:', ['user' => $user->id]);
    $data = [/* ... */];
    \Log::info('Returning data:', ['count' => count($data)]);
    return $data;
}
```

### Styling Issues
**Check:**
1. Tailwind CSS compiled: Run `npm run build`
2. IBM Plex font loaded: Check Network tab
3. Browser cache cleared: Ctrl+Shift+Delete
4. Correct viewport: Check mobile detection

**Clear Cache:**
```bash
# Frontend
rm -rf dist/
npm run build

# Browser
Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
```

---

## ✅ Acceptance Criteria

All scenarios must pass for production readiness:

- [ ] All 3 roles can login and see correct dashboard
- [ ] Role-specific data displays correctly
- [ ] Styling consistent across all dashboards
- [ ] Responsive design works on all devices
- [ ] No console errors or warnings
- [ ] API calls include authentication token
- [ ] 403 errors trigger redirect to login
- [ ] Tabs switch without page reload
- [ ] Data updates on page refresh
- [ ] Color severity coding is consistent
- [ ] Sorting/filtering works as specified
- [ ] Performance: Dashboard loads in < 2 seconds

---

## 📋 Test Report Template

```
Test Date: __________
Tester: __________
Environment: Development / Staging / Production

Scenario: [Scenario Name]
Preconditions: [Any setup needed]
Steps Performed: [1. 2. 3. ...]
Expected Results: [What should happen]
Actual Results: [What actually happened]
Pass/Fail: ✅ PASS / ❌ FAIL

Issues Found:
- [Issue 1]
- [Issue 2]

Notes:
[Any additional observations]

Signed: __________ Date: __________
```

---

## 🔍 Performance Testing

### Load Testing - Dashboard Rendering
```bash
# Monitor performance
npm run build
# Open DevTools Performance tab
# Record while loading dashboard
# Check:
# - FCP (First Contentful Paint) < 1s
# - LCP (Largest Contentful Paint) < 2.5s
# - CLS (Cumulative Layout Shift) < 0.1
```

### API Response Time
```bash
# Test API endpoint response:
time curl http://localhost:8000/api/admin-dashboard \
  -H "Authorization: Bearer {token}"

# Expected: < 500ms for local dev
```

---

## 📞 Common Test Failures

| Issue | Cause | Solution |
|-------|-------|----------|
| 401 Unauthorized | Invalid/expired token | Re-login |
| 403 Forbidden | Wrong role | Login with correct role |
| 404 Not Found | Endpoint doesn't exist | Check route name spelling |
| 500 Server Error | Backend exception | Check Laravel logs: `storage/logs/` |
| Data blank | API returns null | Check database has records |
| Styling broken | Tailwind not compiled | Run `npm run build` |
| Tab doesn't work | State not updating | Check browser DevTools |

---

**Last Updated:** 2024
**Version:** 1.0
**Status:** Ready for Testing
