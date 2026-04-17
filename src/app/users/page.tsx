'use client';
import { useEffect, useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import api from '@/lib/api';
import toast from 'react-hot-toast';

interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'staff';
  created_at: string;
}

const inputCls = 'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-indigo-500';

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'staff' });

  const loadUsers = async () => {
    try {
      const data = await api.get('/users') as unknown as User[];
      setUsers(data);
    } catch {
      toast.error('Failed to load team members');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadUsers(); }, []);

  const handleCreate = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/users', form);
      toast.success('Team member added');
      setShowModal(false);
      setForm({ name: '', email: '', password: '', role: 'staff' });
      loadUsers();
    } catch (err: unknown) {
      toast.error((err as { message?: string })?.message || 'Failed to add user');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (user: User) => {
    if (!confirm(`Remove ${user.name} from your team?`)) return;
    try {
      await api.delete(`/users/${user.id}`);
      toast.success('User removed');
      loadUsers();
    } catch (err: unknown) {
      toast.error((err as { message?: string })?.message || 'Failed to remove user');
    }
  };

  return (
    <AppLayout title="Team Members">
      {/* Top bar */}
      <div className="flex justify-between items-center mb-5">
        <p className="text-sm text-gray-500">{users.length} member{users.length === 1 ? '' : 's'} in your team</p>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
        >
          + Add Member
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <p className="text-sm text-gray-400">Loading...</p>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                {['Name', 'Email', 'Role', 'Joined', 'Actions'].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                  <td className="px-4 py-3.5 text-sm font-semibold text-gray-900">{u.name}</td>
                  <td className="px-4 py-3.5 text-sm text-gray-500">{u.email}</td>
                  <td className="px-4 py-3.5">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                      u.role === 'admin' ? 'bg-violet-100 text-violet-700' : 'bg-green-100 text-green-700'
                    }`}>{u.role}</span>
                  </td>
                  <td className="px-4 py-3.5 text-sm text-gray-400">{new Date(u.created_at).toLocaleDateString()}</td>
                  <td className="px-4 py-3.5">
                    <button
                      onClick={() => handleDelete(u)}
                      className="px-3 py-1 text-xs font-medium border border-red-300 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-10 text-center text-sm text-gray-400">No team members yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <dialog open aria-labelledby="add-member-title" className="bg-white rounded-xl p-7 w-full max-w-[400px] m-0 border-0 shadow-xl static" onClick={(e) => e.stopPropagation()}>
            <h3 id="add-member-title" className="text-base font-bold text-gray-900 mb-5">Add Team Member</h3>
            <form onSubmit={handleCreate} className="flex flex-col gap-3.5">
              <div>
                <label htmlFor="u-name" className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input id="u-name" className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Full name" required />
              </div>
              <div>
                <label htmlFor="u-email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input id="u-email" type="email" className={inputCls} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="user@example.com" required />
              </div>
              <div>
                <label htmlFor="u-password" className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input id="u-password" type="password" className={inputCls} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Min 8 characters" required />
              </div>
              <div>
                <label htmlFor="u-role" className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select id="u-role" className={inputCls} value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                  <option value="staff">Staff — can view and create sales</option>
                  <option value="admin">Admin — full access to this shop</option>
                </select>
              </div>
              <div className="flex justify-end gap-2.5 mt-2">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border border-gray-200 rounded-lg text-sm bg-white hover:bg-gray-50 transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors">
                  {saving ? 'Adding...' : 'Add Member'}
                </button>
              </div>
            </form>
          </dialog>
        </div>
      )}
    </AppLayout>
  );
}
