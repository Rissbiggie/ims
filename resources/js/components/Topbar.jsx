import { useAuthStore } from '../stores/authStore';
import { useNavigate } from 'react-router-dom';

export default function Topbar() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const initials = (name = '') => name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2) || '??';

  return (
    <div className="bg-white border-b border-gray-200 h-14 flex items-center justify-between px-6 sticky top-0 z-10">
      <div className="flex flex-col">
        <span className="font-mono text-[10px] text-gray-400 uppercase tracking-widest leading-none mb-1">
          Internal System
        </span>
        <h2 className="font-mono text-xs font-semibold text-gray-800 uppercase tracking-tight">Management Portal</h2>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 pr-4 border-r border-gray-100">
          <div className="w-6 h-6 rounded bg-gray-900 flex items-center justify-center font-mono text-[9px] font-medium text-white">
            {initials(user?.name)}
          </div>
          <span className="font-mono text-xs text-gray-600 truncate hidden sm:block">{user?.name || 'Loading...'}</span>
        </div>

        <button
          onClick={handleLogout}
          className="font-mono text-[11px] font-medium text-red-500 hover:text-red-700 transition-colors uppercase tracking-wider"
        >
          Sign out
        </button>
      </div>
    </div>
  );
}