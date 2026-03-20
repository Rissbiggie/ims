import { NavLink } from 'react-router-dom';

const NAV_ITEMS = [
  {
    to: '/dashboard',
    label: 'Dashboard',
    icon: (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="1" y="1" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.25"/>
        <rect x="8" y="1" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.25"/>
        <rect x="1" y="8" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.25"/>
        <rect x="8" y="8" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.25"/>
      </svg>
    ),
  },
  {
    to: '/products',
    label: 'Products',
    icon: (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M2 4.5L7 2L12 4.5V9.5L7 12L2 9.5V4.5Z" stroke="currentColor" strokeWidth="1.25" strokeLinejoin="round"/>
        <path d="M7 2V12M2 4.5L12 4.5" stroke="currentColor" strokeWidth="1.25"/>
      </svg>
    ),
  },
  {
    to: '/categories',
    label: 'Categories',
    icon: (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M1 3h4M1 7h6M1 11h9" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round"/>
        <circle cx="11" cy="3" r="1.5" stroke="currentColor" strokeWidth="1.25"/>
        <circle cx="11" cy="7" r="1.5" stroke="currentColor" strokeWidth="1.25"/>
        <circle cx="11" cy="11" r="1.5" stroke="currentColor" strokeWidth="1.25"/>
      </svg>
    ),
  },
  {
    to: '/suppliers',
    label: 'Suppliers',
    icon: (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="7" cy="4.5" r="2.5" stroke="currentColor" strokeWidth="1.25"/>
        <path d="M1.5 12.5C1.5 10.015 4.015 8 7 8s5.5 2.015 5.5 4.5" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    to: '/purchase-orders',
    label: 'Purchase Orders',
    icon: (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="2" y="1.5" width="10" height="11" rx="1" stroke="currentColor" strokeWidth="1.25"/>
        <path d="M4.5 5h5M4.5 7.5h5M4.5 10h3" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    to: '/requisitions',
    label: 'Requisitions',
    icon: (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M7 1.5v11M1.5 7h11" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round"/>
        <rect x="2" y="2" width="10" height="10" rx="1" stroke="currentColor" strokeWidth="1.25"/>
      </svg>
    ),
  },
  {
    to: '/reports',
    label: 'Reports',
    icon: (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M2 11L5 7.5L7.5 9.5L10 6L12 7.5" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/>
        <rect x="1" y="1" width="12" height="12" rx="1" stroke="currentColor" strokeWidth="1.25"/>
      </svg>
    ),
  },
];

export default function Sidebar() {
  return (
    <aside
      className="w-56 flex flex-col bg-white border-r border-gray-200 min-h-screen"
      style={{ fontFamily: "'IBM Plex Sans', sans-serif" }}
    >
      <style>{`@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@300;400;500&display=swap');`}</style>

      {/* Brand */}
      <div className="px-5 py-6 border-b border-gray-100">
        <p className="font-mono text-xs tracking-widest text-gray-400 uppercase mb-0.5">System</p>
        <h1 className="font-mono text-lg font-semibold tracking-tight text-gray-900 leading-none">IMS</h1>
        <p className="text-xs text-gray-400 mt-1">Inventory Management</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {NAV_ITEMS.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-2.5 px-3 py-2 rounded text-xs font-medium transition-all ${
                isActive
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span className={isActive ? 'text-white' : 'text-gray-400'}>
                  {icon}
                </span>
                <span className="font-mono text-xs tracking-wide">{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-gray-100">
        <p className="font-mono text-xs text-gray-300 uppercase tracking-widest">v1.0.0</p>
      </div>
    </aside>
  );
}