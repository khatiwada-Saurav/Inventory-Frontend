'use client';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const email = searchParams.get('email') ?? '';

  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const isValidLink = token && email;

  useEffect(() => { if (!isValidLink) return; }, [isValidLink]);

  const handleSubmit = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);
    try {
      await api.post('/reset-password', { token, email, password, password_confirmation: passwordConfirmation });
      toast.success('Password reset! Please sign in with your new password.');
      router.push('/login');
    } catch (err: unknown) {
      const e = err as { errors?: Record<string, string[]>; message?: string };
      if (e?.errors) {
        const fieldErrors: Record<string, string> = {};
        Object.entries(e.errors).forEach(([k, v]) => { fieldErrors[k] = Array.isArray(v) ? v[0] : String(v); });
        setErrors(fieldErrors);
      } else {
        setErrors({ general: e?.message || 'This reset link is invalid or has expired.' });
      }
    } finally {
      setLoading(false);
    }
  };

  const cardClass = "bg-white rounded-2xl p-10 w-full max-w-[420px] shadow-[0_25px_50px_rgba(0,0,0,0.3)]";
  const logoEl = (
    <div className="w-14 h-14 rounded-[14px] bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-2xl mx-auto mb-4 shadow-[0_8px_20px_rgba(79,70,229,0.35)]">
      📦
    </div>
  );

  if (!isValidLink) {
    return (
      <div className={cardClass}>
        <div className="text-center mb-5">{logoEl}<h1 className="text-[22px] font-bold text-gray-900">Invalid Link</h1></div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-600 leading-relaxed text-center">
          This password reset link is invalid or has expired.<br /><br />Please request a new one.
        </div>
        <Link href="/forgot-password" className="block text-center text-sm text-indigo-600 font-medium hover:underline mt-4">
          Request a new reset link
        </Link>
      </div>
    );
  }

  return (
    <div className={cardClass}>
      <div className="text-center mb-7">
        {logoEl}
        <h1 className="text-[22px] font-bold text-gray-900 mb-1.5">Set new password</h1>
        <p className="text-sm text-gray-500">Choose a strong password for <strong>{email}</strong></p>
      </div>

      {errors.general && (
        <div className="mb-4 px-4 py-2.5 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
          {errors.general}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input label="New Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" error={errors.password} required />
        <Input label="Confirm New Password" type="password" value={passwordConfirmation} onChange={(e) => setPasswordConfirmation(e.target.value)} placeholder="••••••••" error={errors.password_confirmation} required />
        <Button type="submit" fullWidth loading={loading} size="lg">
          {loading ? 'Resetting…' : 'Reset Password'}
        </Button>
      </form>
      <Link href="/login" className="block text-center text-sm text-indigo-600 font-medium hover:underline mt-4">
        ← Back to Sign In
      </Link>
    </div>
  );
}

export default function ResetPasswordPage() {
  const cardClass = "bg-white rounded-2xl p-10 w-full max-w-[420px] shadow-[0_25px_50px_rgba(0,0,0,0.3)]";
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1E1B4B] via-[#312E81] to-[#4338CA] flex items-center justify-center p-4">
      <Suspense fallback={
        <div className={cardClass}>
          <div className="text-center">
            <div className="w-14 h-14 rounded-[14px] bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-2xl mx-auto mb-4">📦</div>
            <h1 className="text-[22px] font-bold text-gray-900">Loading…</h1>
          </div>
        </div>
      }>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
