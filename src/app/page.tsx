'use client';
import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1E1B4B] via-[#312E81] to-[#4338CA] flex flex-col items-center justify-center px-6 text-center">
      {/* Logo */}
      <div className="w-18 h-18 rounded-[20px] bg-white/15 border-2 border-white/25 flex items-center justify-center text-4xl mb-6" style={{ width: 72, height: 72 }}>
        📦
      </div>

      {/* Heading */}
      <h1 className="text-5xl font-extrabold text-white tracking-tight mb-3">
        InventoryPro
      </h1>
      <p className="text-lg text-indigo-300 max-w-md leading-relaxed mb-12">
        Manage your shop&apos;s products, sales, purchases and reports —
        all in one place. Free to get started.
      </p>

      {/* CTA Buttons */}
      <div className="flex gap-3 flex-wrap justify-center">
        <Link
          href="/register"
          className="px-8 py-3.5 bg-white text-indigo-600 rounded-xl text-sm font-bold shadow-xl hover:-translate-y-0.5 hover:shadow-2xl transition-all duration-150"
        >
          Start for free
        </Link>
        <Link
          href="/login"
          className="px-8 py-3.5 bg-transparent text-white border-2 border-white/40 rounded-xl text-sm font-semibold hover:border-white/80 hover:bg-white/10 transition-all duration-150"
        >
          Sign in
        </Link>
      </div>

      {/* Feature pills */}
      <div className="flex gap-8 mt-16 flex-wrap justify-center">
        {[
          '✓ Products & categories',
          '✓ Sales & invoices',
          '✓ Purchase tracking',
          '✓ Reports & dashboard',
          '✓ VAT & billing',
        ].map((f) => (
          <span key={f} className="text-indigo-200 text-sm flex items-center gap-2">
            {f}
          </span>
        ))}
      </div>
    </div>
  );
}
