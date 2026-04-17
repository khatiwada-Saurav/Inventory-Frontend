'use client';
import { useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/forgot-password', { email });
      setSent(true);
      toast.success('Reset link sent!');
    } catch (err: unknown) {
      const e = err as { errors?: Record<string, string[]>; message?: string };
      if (e?.errors?.email) {
        setError(e.errors.email[0]);
      } else {
        setError(e?.message || 'Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1E1B4B] via-[#312E81] to-[#4338CA] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-10 w-full max-w-[420px] shadow-[0_25px_50px_rgba(0,0,0,0.3)]">
        {/* Header */}
        <div className="text-center mb-7">
          <div className="w-14 h-14 rounded-[14px] bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-2xl mx-auto mb-4 shadow-[0_8px_20px_rgba(79,70,229,0.35)]">
            📦
          </div>
          <h1 className="text-[22px] font-bold text-gray-900 mb-2">Forgot your password?</h1>
          <p className="text-sm text-gray-500 leading-relaxed">
            Enter your email and we&apos;ll send you a link to reset your password.
          </p>
        </div>

        {sent ? (
          <>
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-sm text-green-700 leading-relaxed text-center mt-2">
              ✅ Check your inbox! We sent a reset link to <strong>{email}</strong>.
              <br /><br />
              The link expires in <strong>60 minutes</strong>.
            </div>
            <Link href="/login" className="block text-center text-sm text-indigo-600 font-medium hover:underline mt-4">
              ← Back to Sign In
            </Link>
          </>
        ) : (
          <>
            {error && (
              <div className="mb-4 px-4 py-2.5 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                {error}
              </div>
            )}
            <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-6">
              <Input
                label="Email Address"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
              <Button type="submit" fullWidth loading={loading} size="lg">
                {loading ? 'Sending…' : 'Send Reset Link'}
              </Button>
            </form>
            <Link href="/login" className="block text-center text-sm text-indigo-600 font-medium hover:underline mt-4">
              ← Back to Sign In
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
