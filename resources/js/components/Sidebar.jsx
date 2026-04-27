import { NavLink } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

const NAV_ITEMS = [
  // These roles now match your PHP Enum values exactly
  { to: '/dashboard',      label: 'Dashboard',       roles: ['admin', 'manager', 'store_clerk'] },
  { to: '/products',       label: 'Products',        roles: ['admin', 'manager', 'store_clerk'] },
  { to: '/requisitions',   label: 'Requisitions',    roles: ['manager', 'store_clerk']          },
  
  { to: '/categories',     label: 'Categories',      roles: ['admin', 'manager']                },
  { to: '/suppliers',      label: 'Suppliers',       roles: ['admin', 'manager']                },
  { to: '/purchase-orders',label: 'Purchase Orders', roles: ['admin', 'manager', 'store_clerk'] },
  { to: '/reports',        label: 'Reports',         roles: ['admin', 'manager', 'store_clerk'] },
];

export default function Sidebar() {
  const { user } = useAuthStore();

  if (!user || !user.role) {
    return <aside className="w-56 bg-white border-r border-gray-200 min-h-screen p-4 font-mono text-[10px]">Loading Profile...</aside>;
  }

  // FORCE LOWERCASE: This handles "STORE_CLERK" vs "store_clerk"
  const userRole = user.role.toLowerCase(); 

  const allowedItems = NAV_ITEMS.filter(item => 
    item.roles.includes(userRole)
  );

  return (
    <aside className="w-56 flex flex-col bg-white border-r border-gray-200 min-h-screen">
      <div className="px-5 py-6 border-b border-gray-100">
        <h1 className="font-mono text-lg font-bold text-gray-900 tracking-tighter">IMS</h1>
        <div className="mt-2">
          <span className="bg-indigo-600 text-white text-[10px] px-2 py-0.5 rounded font-mono uppercase tracking-widest shadow-sm">
            {userRole.replace('_', ' ')} {/* Displays "store clerk" nicely */}
          </span>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {allowedItems.length > 0 ? (
          allowedItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center px-4 py-2 rounded text-xs font-mono transition-all ${
                  isActive 
                    ? 'bg-gray-900 text-white shadow-md' 
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))
        ) : (
          <div className="p-4 bg-red-50 rounded border border-red-100 mt-4">
             <p className="text-[10px] text-red-600 font-mono leading-tight">
               ACCESS DENIED<br/>
               Role: {userRole}
             </p>
          </div>
        )}
      </nav>
    </aside>
  );
}