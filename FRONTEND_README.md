# Inventory Management System React Frontend

A complete React frontend for the Laravel Inventory Management System API.

## Features

- ✅ **Authentication** - Login system with token-based auth
- ✅ **Dashboard** - Overview of key metrics and alerts
- ✅ **Products Management** - Full CRUD operations
- ✅ **Categories** - Product category management
- ✅ **Suppliers** - Supplier management
- ✅ **Purchase Orders** - Create and manage purchase orders
- ✅ **Requisitions** - Internal stock requisitions
- ✅ **Reports** - Stock and audit logging reports
- ✅ **Responsive Design** - Mobile-friendly UI with Tailwind CSS

## Tech Stack

- **React 19** - Modern UI framework
- **React Router** - Client-side routing
- **Zustand** - State management
- **Axios** - HTTP client
- **Tailwind CSS** - Utility-first CSS framework
- **Vite** - Fast development server and build tool

## Project Structure

```
resources/
├── js/
│   ├── components/
│   │   └── Navigation.jsx - Main navigation component
│   ├── pages/
│   │   ├── LoginPage.jsx
│   │   ├── DashboardPage.jsx
│   │   ├── ProductsPage.jsx
│   │   ├── CategoriesPage.jsx
│   │   ├── SuppliersPage.jsx
│   │   ├── PurchaseOrdersPage.jsx
│   │   ├── RequisitionsPage.jsx
│   │   └── ReportsPage.jsx
│   ├── stores/
│   │   └── authStore.js - Zustand auth state
│   ├── api/
│   │   ├── client.js - Axios configuration
│   │   └── index.js - API endpoints
│   ├── App.jsx - Main app component with routing
│   ├── main.jsx - React app entry point
│   └── index.css - Tailwind styles
└── views/
    └── app.blade.php - Blade template mounting React app
```

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

The `.env` file is already set up with:
- `VITE_API_URL=http://localhost:8000/api`

You can customize this if your API runs on a different URL.

### 3. Development

#### Option A: Using Laravel Vite Dev Server

```bash
npm run dev
```

This starts Vite's dev server on `http://localhost:5173`

#### Option B: Using PHP Built-in Server + Vite

In one terminal, start the Laravel server:
```bash
cd /path/to/project
php artisan serve
```

In another terminal, start Vite dev server:
```bash
npm run dev
```

Then access the application at `http://localhost:8000`

### 4. Production Build

```bash
npm run build
```

This creates optimized builds in the `public/build` directory.

## API Integration

All API endpoints are configured in `resources/js/api/index.js`:

- **Auth**: Login, Logout, Get Profile
- **Products**: CRUD, Adjust Stock, Write-off
- **Categories**: CRUD
- **Suppliers**: CRUD
- **Purchase Orders**: CRUD, Submit, Approve, Reject, Receive
- **Requisitions**: CRUD, Submit, Approve, Reject, Issue
- **Dashboard**: Stats and overview data
- **Reports**: Stock report, Audit log, Daily report
- **Alerts**: List, Acknowledge
- **Stock Transactions**: List

## Authentication Flow

1. User logs in with credentials at `/login`
2. API returns JWT token
3. Token is stored in localStorage
4. Token is sent in `Authorization: Bearer <token>` header with all API requests
5. On 401 response, user is redirected to login

## State Management

Using Zustand for authentication state. The `useAuthStore` hook provides:

```javascript
import { useAuthStore } from '@/stores/authStore';

const { user, token, login, logout, fetchProfile } = useAuthStore();
```

## Component Architecture

### Protected Routes

Routes are wrapped in a `<ProtectedRoute>` component that checks for valid token before rendering.

```jsx
<ProtectedRoute>
  <DashboardPage />
</ProtectedRoute>
```

### Navigation

The `<Navigation>` component is conditionally rendered only when user is authenticated (has a token).

### Form Handling

All pages with forms use React hooks for state management and call API endpoints via the centralized API client.

## Troubleshooting

### API Connection Issues

1. Make sure Laravel server is running (`php artisan serve`)
2. Verify `VITE_API_URL` in `.env` matches your API URL
3. Check browser console for CORS errors
4. Ensure Laravel has proper CORS configuration

### Token Issues

1. Clear localStorage: `localStorage.clear()`
2. Log out and log back in
3. Check API token expiration settings

### Build Issues

```bash
# Clear node modules and reinstall
rm -rf node_modules package-lock.json
npm install
npm run build
```

## Default Login Credentials

Use these credentials to test:
- **Email**: admin@example.com
- **Password**: password

(Make sure to seed the database with sample users)

## Demo Users

The system supports three user roles:
- **admin** - Full access to all features
- **manager** - Manage orders and requisitions
- **store_clerk** - View and manage products/stock

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Performance

- Production build uses code splitting for faster loads
- Lazy loading for routes (can be added)
- Optimized bundle size with tree-shaking

## Future Enhancements

- [ ] Add pagination for large datasets
- [ ] Implement data export (CSV/PDF)
- [ ] Add advanced search and filtering
- [ ] Real-time notifications with WebSockets
- [ ] Bulk operations for inventory adjustments
- [ ] Supplier performance metrics
- [ ] Mobile app with React Native

## Support

For issues or questions about the frontend, check:
1. Browser console for error messages
2. Network tab in DevTools to inspect API calls
3. Application tab to check stored tokens/data

## License

This project is part of the Inventory Management System and is proprietary.
