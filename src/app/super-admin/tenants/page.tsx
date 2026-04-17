'use client';
import { useEffect, useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import api from '@/lib/api';
import toast from 'react-hot-toast';

interface Tenant {
  id: number;
  name: string;
  slug: string;
  is_active: boolean;
  users_count: number;
  created_at: string;
}

const inputCls = 'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-indigo-500';

export default function TenantsPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ tenant_name: '', admin_name: '', admin_email: '', admin_password: '' });

  const loadTenants = async () => {
    try {
      const data = await api.get('/super/tenants') as Tenant[];
      setTenants(data);
    } catch {
      toast.error('Failed to load tenants');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadTenants(); }, []);

  const handleCreate = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/super/tenants', form);
      toast.success('Tenant created successfully');
      setShowModal(false);
      setForm({ tenant_name: '', admin_name: '', admin_email: '', admin_password: '' });
      loadTenants();
    } catch (err: unknown) {
      toast.error((err as { message?: string })?.message || 'Failed to create tenant');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (tenant: Tenant) => {
    try {
      await api.patch(`/super/tenants/${tenant.id}/toggle`);
      toast.success(`Tenant ${tenant.is_active ? 'deactivated' : 'activated'}`);
      loadTenants();
    } catch {
      toast.error('Failed to update tenant status');
    }
  };

  const handleDelete = async (tenant: Tenant) => {
    if (!confirm(`Delete "${tenant.name}" and ALL their data? This cannot be undone.`)) return;
    try {
      await api.delete(`/super/tenants/${tenant.id}`);
      toast.success('Tenant deleted');
      loadTenants();
    } catch {
      toast.error('Failed to delete tenant');
    }
  };

  return (
    <AppLayout title="Manage Tenants">
      {/* Top bar */}
      <div className="flex justify-between items-center mb-5">
        <p className="text-sm text-gray-500">{tenants.length} tenant{tenants.length === 1 ? '' : 's'} registered</p>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
        >
          + New Tenant
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
                {['Shop Name', 'Slug', 'Users', 'Status', 'Created', 'Actions'].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tenants.map((t) => (
                <tr key={t.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                  <td className="px-4 py-3.5 text-sm font-semibold text-gray-900">{t.name}</td>
                  <td className="px-4 py-3.5 text-sm text-gray-500 font-mono">{t.slug}</td>
                  <td className="px-4 py-3.5 text-sm text-gray-700">{t.users_count}</td>
                  <td className="px-4 py-3.5">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${t.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {t.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-sm text-gray-400">{new Date(t.created_at).toLocaleDateString()}</td>
                  <td className="px-4 py-3.5 flex gap-1.5">
                    <button onClick={() => handleToggle(t)} className="px-3 py-1 text-xs font-medium border border-gray-200 bg-white text-gray-600 rounded-lg hover:bg-gray-50 transition-colors">
                      {t.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                    <button onClick={() => handleDelete(t)} className="px-3 py-1 text-xs font-medium border border-red-300 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors">
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {tenants.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-sm text-gray-400">No tenants yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <dialog open aria-labelledby="create-tenant-title" className="bg-white rounded-xl p-7 w-full max-w-[420px] m-0 border-0 shadow-xl">
            <h3 id="create-tenant-title" className="text-base font-bold text-gray-900 mb-5">Create New Tenant</h3>
            <form onSubmit={handleCreate} className="flex flex-col gap-3.5">
              <div>
                <label htmlFor="t-name" className="block text-sm font-medium text-gray-700 mb-1">Shop Name</label>
                <input id="t-name" className={inputCls} value={form.tenant_name} onChange={(e) => setForm({ ...form, tenant_name: e.target.value })} placeholder="e.g. Ramesh General Store" required />
              </div>
              <div>
                <label htmlFor="t-admin-name" className="block text-sm font-medium text-gray-700 mb-1">Admin Name</label>
                <input id="t-admin-name" className={inputCls} value={form.admin_name} onChange={(e) => setForm({ ...form, admin_name: e.target.value })} placeholder="Shop owner's name" required />
              </div>
              <div>
                <label htmlFor="t-admin-email" className="block text-sm font-medium text-gray-700 mb-1">Admin Email</label>
                <input id="t-admin-email" type="email" className={inputCls} value={form.admin_email} onChange={(e) => setForm({ ...form, admin_email: e.target.value })} placeholder="admin@shopname.com" required />
              </div>
              <div>
                <label htmlFor="t-admin-password" className="block text-sm font-medium text-gray-700 mb-1">Admin Password</label>
                <input id="t-admin-password" type="password" className={inputCls} value={form.admin_password} onChange={(e) => setForm({ ...form, admin_password: e.target.value })} placeholder="Min 8 characters" required />
              </div>
              <div className="flex justify-end gap-2.5 mt-2">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border border-gray-200 rounded-lg text-sm bg-white hover:bg-gray-50 transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors">
                  {saving ? 'Creating...' : 'Create Tenant'}
                </button>
              </div>
            </form>
          </dialog>
        </div>
      )}
    </AppLayout>
  );
}
