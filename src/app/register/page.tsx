'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { setAuth } from '@/lib/auth';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

type ApiUser = {
  id: number; name: string; email: string;
  role: 'super_admin' | 'admin' | 'staff';
  tenant_id: number | null;
  tenant_name: string | null;
  tenant_slug: string | null;
};

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    shop_name: '', name: '', email: '', password: '', password_confirmation: '',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);
    try {
      const data = await api.post('/register', form) as { token: string; user: ApiUser };
      setAuth(data.token, data.user);
      toast.success(`Welcome to InventoryPro, ${data.user.name}! Your shop is ready.`);
      router.push('/dashboard');
    } catch (err: unknown) {
      const error = err as { message?: string; errors?: Record<string, string[]> };
      if (error?.errors) {
        const fieldErrors: Record<string, string> = {};
        Object.entries(error.errors).forEach(([k, v]) => {
          fieldErrors[k] = Array.isArray(v) ? v[0] : String(v);
        });
        setErrors(fieldErrors);
      } else {
        setErrors({ general: error?.message || 'Registration failed. Please try again.' });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1E1B4B] via-[#312E81] to-[#4338CA] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-10 w-full max-w-[460px] shadow-[0_25px_50px_rgba(0,0,0,0.3)]">
        {/* Header */}
        <div className="text-center mb-7">
          <div className="w-14 h-14 rounded-[14px] bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-2xl mx-auto mb-4 shadow-[0_8px_20px_rgba(79,70,229,0.35)]">
            📦
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1.5">Create your shop</h1>
          <p className="text-sm text-gray-500">Set up your inventory in under a minute</p>
        </div>

        {errors.general && (
          <div className="mb-4 px-4 py-2.5 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
            {errors.general}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 mt-2">Your Shop</p>
          <Input label="Shop Name" value={form.shop_name} onChange={set('shop_name')} placeholder="e.g. Ramesh General Store" error={errors.shop_name} required />

          <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 mt-2">Your Account</p>
          <Input label="Your Name" value={form.name} onChange={set('name')} placeholder="Full name" error={errors.name} required />
          <Input label="Email Address" type="email" value={form.email} onChange={set('email')} placeholder="you@example.com" error={errors.email} required />
          <Input label="Password" type="password" value={form.password} onChange={set('password')} placeholder="Min 8 characters" error={errors.password} required />
          <Input label="Confirm Password" type="password" value={form.password_confirmation} onChange={set('password_confirmation')} placeholder="Repeat password" error={errors.password_confirmation} required />

          <Button type="submit" fullWidth loading={loading} size="lg" className="mt-1">
            {loading ? 'Creating your shop…' : 'Create Shop & Sign In'}
          </Button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-5">
          Already have an account?{' '}
          <Link href="/login" className="text-indigo-600 font-medium hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
