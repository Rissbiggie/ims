import { NavLink } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', roles: ['admin', 'manager', 'clerk'] },
  { to: '/products', label: 'Products', roles: ['admin', 'manager', 'clerk'] },
  { to: '/categories', label: 'Categories', roles: ['admin', 'manager'] },
  { to: '/suppliers', label: 'Suppliers', roles: ['admin', 'manager'] },
  { to: '/purchase-orders', label: 'Purchase Orders', roles: ['admin', 'manager'] },
  { to: '/requisitions', label: 'Requisitions', roles: ['admin', 'manager', 'clerk'] },
  { to: '/reports', label: 'Reports', roles: ['admin'] },
];

export default function Sidebar() {
  const { user } = useAuthStore();
  if (!user) return <aside className="w-56 bg-white border-r border-gray-200" />;

  const allowedItems = NAV_ITEMS.filter((item) => item.roles.includes(user.role));

  return (
    <aside className="w-56 flex flex-col bg-white border-r border-gray-200 min-h-screen">
      <div className="px-5 py-6 border-b border-gray-100">
        <h1 className="font-mono text-lg font-bold text-gray-900">IMS</h1>
        <div className="mt-2">
          <span className="bg-black text-white text-[10px] px-2 py-0.5 rounded font-mono uppercase tracking-widest">
            {user.role}
          </span>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {allowedItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center px-4 py-2 rounded text-xs font-mono transition-all ${
                isActive ? 'bg-gray-900 text-white shadow-sm' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
              }`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-gray-50">
        <p className="text-[10px] font-mono text-gray-300 uppercase tracking-widest text-center">v1.0.0</p>
      </div>
    </aside>
  );
}