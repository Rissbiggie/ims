import { NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useState } from 'react';

const NAV_ITEMS = [
  { to: '/dashboard',      label: 'Dashboard'       },
  { to: '/products',       label: 'Products'        },
  { to: '/categories',     label: 'Categories'      },
  { to: '/suppliers',      label: 'Suppliers'       },
  { to: '/purchase-orders',label: 'Purchase Orders' },
  { to: '/requisitions',   label: 'Requisitions'    },
  { to: '/reports',        label: 'Reports'         },
];

export default function Navigation() {
  const { user, logout } = useAuthStore();
  const navigate          = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const desktopLink = ({ isActive }) =>
    `font-mono text-xs tracking-wide transition-all px-0.5 pb-0.5 border-b ${
      isActive
        ? 'border-gray-900 text-gray-900 font-medium'
        : 'border-transparent text-gray-400 hover:text-gray-700 hover:border-gray-300'
    }`;

  const mobileLink = ({ isActive }) =>
    `flex items-center px-4 py-2.5 font-mono text-xs tracking-wide border-l-2 transition-all ${
      isActive
        ? 'border-gray-900 text-gray-900 bg-gray-50 font-medium'
        : 'border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-50'
    }`;

  const initials = (name = '') =>
    name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '??';

  return (
    <nav
      className="bg-white border-b border-gray-200 sticky top-0 z-50"
      style={{ fontFamily: "'IBM Plex Sans', sans-serif" }}
    >
      <style>{`@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@300;400;500&display=swap');`}</style>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14">

          {/* Brand */}
          <NavLink to="/dashboard" className="flex items-center gap-2.5 flex-shrink-0">
            <span className="font-mono text-base font-semibold tracking-tight text-gray-900">IMS</span>
            <span className="hidden sm:block w-px h-4 bg-gray-200" />
            <span className="hidden sm:block font-mono text-xs tracking-widest text-gray-400 uppercase">
              Inventory
            </span>
          </NavLink>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-6">
            {NAV_ITEMS.map(({ to, label }) => (
              <NavLink key={to} to={to} className={desktopLink}>
                {label}
              </NavLink>
            ))}
          </div>

          {/* User menu + mobile toggle */}
          <div className="flex items-center gap-3">

            {/* User pill — desktop */}
            <div className="hidden md:block relative">
              <button
                onClick={() => setUserMenuOpen(o => !o)}
                onBlur={() => setTimeout(() => setUserMenuOpen(false), 150)}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded border border-gray-200 hover:border-gray-300 transition-all"
              >
                <div className="w-5 h-5 rounded bg-gray-900 flex items-center justify-center font-mono text-xs font-medium text-white leading-none flex-shrink-0" style={{ fontSize: '9px' }}>
                  {initials(user?.name)}
                </div>
                <span className="font-mono text-xs text-gray-600 max-w-[96px] truncate">
                  {user?.name || 'Account'}
                </span>
                <svg width="10" height="6" viewBox="0 0 10 6" fill="none" className={`text-gray-400 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`}>
                  <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 top-full mt-1.5 w-40 bg-white border border-gray-200 rounded-md shadow-sm overflow-hidden z-50">
                  <div className="px-3 py-2 border-b border-gray-100">
                    <p className="font-mono text-xs text-gray-400 uppercase tracking-widest">Signed in as</p>
                    <p className="text-xs text-gray-700 font-medium mt-0.5 truncate">{user?.name || '—'}</p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-3 py-2 font-mono text-xs text-red-600 hover:bg-red-50 transition-colors"
                  >
                    Sign out
                  </button>
                </div>
              )}
            </div>

            {/* Mobile hamburger */}
            <button
              onClick={() => setIsOpen(o => !o)}
              className="md:hidden w-8 h-8 flex items-center justify-center rounded border border-gray-200 hover:border-gray-300 transition-all text-gray-500"
              aria-label="Toggle menu"
            >
              {isOpen ? (
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M2 4h10M2 7h10M2 10h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              )}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile drawer */}
      {isOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white">
          <div className="py-2">
            {NAV_ITEMS.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                className={mobileLink}
                onClick={() => setIsOpen(false)}
              >
                {label}
              </NavLink>
            ))}
          </div>

          {/* Mobile user row */}
          <div className="border-t border-gray-100 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-gray-900 flex items-center justify-center font-mono font-medium text-white flex-shrink-0" style={{ fontSize: '9px' }}>
                {initials(user?.name)}
              </div>
              <span className="font-mono text-xs text-gray-600 truncate max-w-[160px]">
                {user?.name || 'Account'}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="font-mono text-xs text-red-600 hover:text-red-800 transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}