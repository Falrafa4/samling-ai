import { Navigate, Outlet } from 'react-router';
import { useLocalStorage } from 'react-use';
import Sidebar from './Sidebar';

export default function AdminLayout() {
  const [adminToken] = useLocalStorage('admin_token', null);

  // Jika token admin tidak ada di localStorage, redirect ke halaman login
  if (!adminToken) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 text-slate-800 font-sans">
      {/* Sidebar Menu */}
      <Sidebar />

      {/* Main Content Area */}
      <main className="flex-1 h-full overflow-y-auto flex flex-col">
        <Outlet />
      </main>
    </div>
  );
}
