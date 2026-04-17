'use client';
import { useEffect, useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { PageSpinner } from '@/components/ui/Spinner';
import api from '@/lib/api';
import toast from 'react-hot-toast';

interface User {
  id: number;
  name: string;
  email: string;
  created_at: string;
}

export default function ProfilePage() {
  const [user,    setUser]    = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [pwForm,  setPwForm]  = useState({
    current_password: '', new_password: '', new_password_confirmation: '',
  });
  const [pwErrors,  setPwErrors]  = useState<Record<string, string>>({});
  const [pwSuccess, setPwSuccess] = useState('');

  useEffect(() => {
    api.get('/me').then((res: unknown) => {
      setUser(res as User);
    }).catch(() => toast.error('Failed to load profile'))
      .finally(() => setLoading(false));
  }, []);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwErrors({});
    setPwSuccess('');
    setSaving(true);
    try {
      await api.post('/change-password', pwForm);
      setPwSuccess('Password changed successfully!');
      setPwForm({ current_password: '', new_password: '', new_password_confirmation: '' });
    } catch (err: unknown) {
      const error = err as { errors?: Record<string, string[]>; message?: string };
      if (error?.errors) {
        const fe: Record<string, string> = {};
        Object.entries(error.errors).forEach(([k, v]) => { fe[k] = v[0]; });
        setPwErrors(fe);
      } else {
        setPwErrors({ general: error?.message || 'Failed to change password' });
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <AppLayout title="Profile"><PageSpinner /></AppLayout>;

  return (
    <AppLayout title="Profile">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Profile Info */}
        <Card>
          <CardHeader>
            <CardTitle>My Profile</CardTitle>
          </CardHeader>

          {/* Avatar section */}
          <div className="flex flex-col items-center gap-3 py-8 px-6 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl mb-5">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary-500 to-purple-600 text-white flex items-center justify-center text-3xl font-bold shadow-lg">
              {user?.name.charAt(0).toUpperCase()}
            </div>
            <div className="text-center">
              <h3 className="text-lg font-bold text-gray-900">{user?.name}</h3>
              <p className="text-sm text-gray-500">{user?.email}</p>
              <p className="text-xs text-gray-400 mt-1">
                Member since{' '}
                {user?.created_at
                  ? new Date(user.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
                  : '—'}
              </p>
            </div>
          </div>

          {/* Details */}
          <div className="flex flex-col gap-4">
            {[
              { label: 'Full Name',      value: user?.name },
              { label: 'Email Address',  value: user?.email },
              { label: 'User ID',        value: `#${user?.id}` },
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">{label}</p>
                <p className="text-sm font-medium text-gray-900 mt-1">{value}</p>
              </div>
            ))}
          </div>
        </Card>

        {/* Change Password */}
        <Card>
          <CardHeader>
            <CardTitle>Change Password</CardTitle>
          </CardHeader>

          {pwSuccess && (
            <div className="mb-4 px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-700">
              {pwSuccess}
            </div>
          )}
          {pwErrors.general && (
            <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
              {pwErrors.general}
            </div>
          )}

          <form onSubmit={handleChangePassword} className="flex flex-col gap-4">
            <Input
              label="Current Password"
              type="password"
              value={pwForm.current_password}
              onChange={(e) => setPwForm({ ...pwForm, current_password: e.target.value })}
              placeholder="Enter current password"
              error={pwErrors.current_password}
              required
            />
            <Input
              label="New Password"
              type="password"
              value={pwForm.new_password}
              onChange={(e) => setPwForm({ ...pwForm, new_password: e.target.value })}
              placeholder="Enter new password"
              error={pwErrors.new_password}
              required
            />
            <Input
              label="Confirm New Password"
              type="password"
              value={pwForm.new_password_confirmation}
              onChange={(e) => setPwForm({ ...pwForm, new_password_confirmation: e.target.value })}
              placeholder="Confirm new password"
              error={pwErrors.new_password_confirmation}
              required
            />
            <div className="flex justify-end mt-2">
              <Button type="submit" loading={saving}>
                {saving ? 'Updating…' : '🔒 Update Password'}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </AppLayout>
  );
}
