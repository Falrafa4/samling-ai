import { Navigate, Outlet } from 'react-router';
import { useLocalStorage } from 'react-use';
import Sidebar from './Sidebar';

// Fungsi utilitas untuk memeriksa kedaluwarsa JWT secara lokal
function isTokenExpired(token) {
  if (!token) return true;
  try {
    let cleanToken = token;
    if (cleanToken.startsWith('"') && cleanToken.endsWith('"')) {
      cleanToken = JSON.parse(cleanToken);
    }
    
    const parts = cleanToken.split('.');
    if (parts.length !== 3) return true;
    
    const payload = JSON.parse(atob(parts[1]));
    const now = Math.floor(Date.now() / 1000);
    return payload.exp < now;
  } catch (e) {
    return true;
  }
}

export default function AdminLayout() {
  const [adminToken] = useLocalStorage('admin_token', null);

  // Jika token admin tidak ada di localStorage atau telah kedaluwarsa, bersihkan dan redirect
  if (!adminToken || isTokenExpired(adminToken)) {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
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
