import { useAuthStore } from '../stores/authStore';

export default function Topbar() {
  const { user, logout } = useAuthStore();

  const handleLogout = async () => {
    await logout();
    window.location.href = '/login';
  };

  const initials = (name = '') =>
    name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '??';

  return (
    <div
      className="bg-white border-b border-gray-200 h-14 flex items-center justify-between px-6"
      style={{ fontFamily: "'IBM Plex Sans', sans-serif" }}
    >
      <style>{`@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@300;400;500&display=swap');`}</style>

      {/* Title */}
      <div>
        <p className="font-mono text-xs tracking-widest text-gray-400 uppercase leading-none mb-0.5">
          System
        </p>
        <h1 className="font-mono text-sm font-semibold tracking-tight text-gray-900 leading-none">
          Inventory Management
        </h1>
      </div>

      {/* User area */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div
            className="w-6 h-6 rounded bg-gray-900 flex items-center justify-center font-mono font-medium text-white flex-shrink-0"
            style={{ fontSize: '9px' }}
          >
            {initials(user?.name)}
          </div>
          <span className="font-mono text-xs text-gray-600 max-w-[140px] truncate hidden sm:block">
            {user?.name || '—'}
          </span>
        </div>

        <span className="w-px h-4 bg-gray-200 hidden sm:block" />

        <button
          onClick={handleLogout}
          className="font-mono text-xs text-red-600 hover:text-red-800 transition-colors"
        >
          Sign out
        </button>
      </div>
    </div>
  );
}