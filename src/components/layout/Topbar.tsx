'use client';
import { useRouter } from 'next/navigation';
import { clearAuth, getUser } from '@/lib/auth';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { LogOut, Bell } from 'lucide-react';

const roleBadgeClass: Record<string, string> = {
  super_admin: 'bg-amber-100 text-amber-800',
  admin:       'bg-violet-100 text-violet-800',
  staff:       'bg-emerald-100 text-emerald-800',
};

interface TopbarProps {
  readonly title?: string;
}

export function Topbar({ title }: TopbarProps) {
  const router = useRouter();
  const user   = getUser();

  const handleLogout = async () => {
    try {
      await api.post('/logout');
    } catch {
      // ignore — still log out locally
    }
    clearAuth();
    toast.success('Logged out successfully');
    router.push('/login');
  };

  return (
    <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-6 sticky top-0 z-50 shadow-sm">
      <div className="flex items-center gap-3">
        <h2 className="text-base font-semibold text-gray-900">{title || 'Dashboard'}</h2>
      </div>

      <div className="flex items-center gap-3">
        {/* Bell icon (decorative) */}
        <button className="w-9 h-9 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
          <Bell size={16} />
        </button>

        {/* User info */}
        {user && (
          <div className="flex items-center gap-3 pl-3 border-l border-gray-100">
            <div className="flex flex-col items-end">
              <span className="text-xs font-semibold text-gray-800">{user.name}</span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[10px] text-gray-400">{user.email}</span>
                {user.role && (
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${roleBadgeClass[user.role] ?? 'bg-gray-100 text-gray-600'}`}>
                    {user.role.replace('_', ' ').toUpperCase()}
                  </span>
                )}
              </div>
            </div>

            {/* Avatar */}
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
              {user.name?.charAt(0).toUpperCase() || 'U'}
            </div>
          </div>
        )}

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-gray-500 border border-gray-200 hover:border-red-300 hover:text-red-600 hover:bg-red-50 transition-all duration-150"
        >
          <LogOut size={13} />
          Logout
        </button>
      </div>
    </header>
  );
}
