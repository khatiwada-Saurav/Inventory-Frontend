'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { setAuth } from '@/lib/auth';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Package, Lock } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [loading,  setLoading]  = useState(false);
  const [errors,   setErrors]   = useState<{ email?: string; password?: string; general?: string }>({});

  const handleSubmit = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);
    try {
      const data = await api.post('/login', { email, password }) as {
        token: string;
        user: {
          id: number; name: string; email: string;
          role: 'super_admin' | 'admin' | 'staff';
          tenant_id: number | null;
          tenant_name: string | null;
          tenant_slug: string | null;
        };
      };
      setAuth(data.token, data.user);
      toast.success(`Welcome back, ${data.user.name}!`);
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
        setErrors({ general: error?.message || 'Invalid credentials. Please try again.' });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1E1B4B] via-[#312E81] to-[#4338CA] flex items-center justify-center p-4">
      <div className="w-full max-w-[420px]">
        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Package size={26} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">InventoryPro</h1>
            <p className="text-sm text-gray-500 mt-1">Sign in to your account</p>
          </div>

          {/* General error */}
          {errors.general && (
            <div className="mb-5 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
              {errors.general}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@inventory.com"
              error={errors.email}
              required
            />
            <div>
              <Input
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                error={errors.password}
                required
              />
              <div className="text-right mt-1.5">
                <Link href="/forgot-password" className="text-xs text-primary-600 font-medium hover:underline">
                  Forgot password?
                </Link>
              </div>
            </div>

            <Button type="submit" fullWidth loading={loading} size="lg" className="mt-1">
              <Lock size={14} />
              {loading ? 'Signing in…' : 'Sign In'}
            </Button>
          </form>

          <p className="text-center text-xs text-gray-500 mt-6">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="text-primary-600 font-semibold hover:underline">
              Create your shop
            </Link>
          </p>

          <hr className="my-5 border-gray-100" />

          {/* Demo credentials */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-xs text-emerald-800 leading-relaxed">
            <p className="font-bold mb-1">Demo Credentials</p>
            <p><span className="font-semibold">Super Admin:</span> superadmin@inventory.com / superpassword123</p>
            <p><span className="font-semibold">Shop Admin 1:</span> admin@ramesh.com / password123</p>
            <p><span className="font-semibold">Shop Admin 2:</span> admin@sita.com / password123</p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-indigo-300 mt-5">
          &copy; {new Date().getFullYear()} InventoryPro. All rights reserved.
        </p>
      </div>
    </div>
  );
}
