'use client';
import { useEffect, useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import { PageSpinner, Spinner } from '@/components/ui/Spinner';
import api from '@/lib/api';
import toast from 'react-hot-toast';

interface Settings {
  id: number;
  shop_name: string;
  shop_address: string | null;
  shop_phone: string | null;
  shop_email: string | null;
  currency_symbol: string | null;
  default_vat_rate: number;
  invoice_prefix: string | null;
  purchase_prefix: string | null;
  shop_logo: string | null;
}

export default function SettingsPage() {
  const [settings,      setSettings]      = useState<Settings | null>(null);
  const [loading,       setLoading]       = useState(true);
  const [saving,        setSaving]        = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [logoPreview,   setLogoPreview]   = useState<string | null>(null);
  const [form, setForm] = useState({
    shop_name: '', shop_address: '', shop_phone: '', shop_email: '',
    currency_symbol: '', default_vat_rate: '13', invoice_prefix: 'INV-', purchase_prefix: 'PO-',
  });

  useEffect(() => {
    api.get('/settings').then((res: unknown) => {
      const s = res as Settings;
      setSettings(s);
      setForm({
        shop_name:        s.shop_name        || '',
        shop_address:     s.shop_address     || '',
        shop_phone:       s.shop_phone       || '',
        shop_email:       s.shop_email       || '',
        currency_symbol:  s.currency_symbol  || 'Rs.',
        default_vat_rate: s.default_vat_rate?.toString() || '13',
        invoice_prefix:   s.invoice_prefix   || 'INV-',
        purchase_prefix:  s.purchase_prefix  || 'PO-',
      });
    }).catch(() => toast.error('Failed to load settings'))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put('/settings', { ...form, default_vat_rate: Number.parseFloat(form.default_vat_rate) });
      toast.success('Settings updated successfully');
    } catch {
      toast.error('Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async (file: File) => {
    setUploadingLogo(true);
    try {
      const reader = new FileReader();
      reader.onload = () => setLogoPreview(reader.result as string);
      reader.readAsDataURL(file);

      const fd = new FormData();
      fd.append('logo', file);
      const res = await fetch('http://localhost:8000/api/settings/logo', {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        body: fd,
      });
      const data = await res.json();
      if (res.ok) {
        toast.success('Logo uploaded successfully');
        setLogoPreview(null);
        const updated = await api.get('/settings') as unknown as Settings;
        setSettings(updated);
      } else {
        toast.error(data.message || 'Upload failed');
      }
    } catch {
      toast.error('Failed to upload logo');
    } finally {
      setUploadingLogo(false);
    }
  };

  if (loading) return <AppLayout title="Settings"><PageSpinner /></AppLayout>;

  const currentLogo = logoPreview ?? settings?.shop_logo ?? null;

  return (
    <AppLayout title="Settings">
      <Card>
        <CardHeader>
          <CardTitle>Shop Settings</CardTitle>
        </CardHeader>

        {/* Logo section */}
        <div className="flex items-center gap-5 mb-6 pb-6 border-b border-gray-100">
          <div className="w-20 h-20 rounded-xl bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center text-3xl overflow-hidden flex-shrink-0">
            {currentLogo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={currentLogo} alt="Logo" className="object-cover w-full h-full" />
            ) : '🏪'}
          </div>
          <div>
            <p className="font-semibold text-gray-900 mb-1">Shop Logo</p>
            <p className="text-xs text-gray-500 mb-3">Upload a PNG or JPG logo for your shop</p>
            <label className="inline-flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg bg-white text-gray-600 text-xs font-medium cursor-pointer hover:border-primary-400 hover:text-primary-600 transition-colors">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => { const file = e.target.files?.[0]; if (file) handleLogoUpload(file); }}
              />
              {uploadingLogo ? <Spinner size={14} /> : '📷'}
              {uploadingLogo ? 'Uploading…' : 'Choose Logo'}
            </label>
          </div>
        </div>

        {/* Form */}
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Shop Name *" value={form.shop_name} onChange={(e) => setForm({ ...form, shop_name: e.target.value })} placeholder="My Inventory Shop" />
            <Input label="Phone" value={form.shop_phone} onChange={(e) => setForm({ ...form, shop_phone: e.target.value })} placeholder="9800000000" />
          </div>
          <Input label="Email" type="email" value={form.shop_email} onChange={(e) => setForm({ ...form, shop_email: e.target.value })} placeholder="shop@example.com" />
          <Textarea label="Address" value={form.shop_address} onChange={(e) => setForm({ ...form, shop_address: e.target.value })} placeholder="Kathmandu, Nepal" />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Currency Symbol" value={form.currency_symbol} onChange={(e) => setForm({ ...form, currency_symbol: e.target.value })} placeholder="Rs." />
            <Input label="VAT Percentage (%)" type="number" value={form.default_vat_rate} onChange={(e) => setForm({ ...form, default_vat_rate: e.target.value })} placeholder="13" min="0" max="100" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Invoice Prefix *" value={form.invoice_prefix} onChange={(e) => setForm({ ...form, invoice_prefix: e.target.value })} placeholder="INV-" />
            <Input label="Purchase Prefix *" value={form.purchase_prefix} onChange={(e) => setForm({ ...form, purchase_prefix: e.target.value })} placeholder="PO-" />
          </div>
        </div>

        <div className="flex justify-end mt-6 pt-6 border-t border-gray-100">
          <Button onClick={handleSave} loading={saving} size="lg">
            {saving ? 'Saving…' : '💾 Save Settings'}
          </Button>
        </div>
      </Card>
    </AppLayout>
  );
}
