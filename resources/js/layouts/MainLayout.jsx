import Sidebar from '../components/sidebar';
import Topbar from '../components/topbar';
import { useAuthStore } from '../stores/authStore';

export default function Layout({ children }) {
  const { token } = useAuthStore();

  if (!token) {
    return <>{children}</>;
  }

  return (
    <div
      className="flex h-screen bg-gray-50"
      style={{ fontFamily: "'IBM Plex Sans', sans-serif" }}
    >
      <style>{`@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@300;400;500&display=swap');`}</style>

      {/* Sidebar */}
      <Sidebar />

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        <Topbar />

        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>

      </div>

    </div>
  );
}