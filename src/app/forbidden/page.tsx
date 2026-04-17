'use client';
import Link from 'next/link';

export default function ForbiddenPage() {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="text-center bg-white px-10 py-12 rounded-xl shadow-md">
        <p className="text-7xl font-extrabold text-red-500 leading-none">403</p>
        <h1 className="text-xl font-bold text-gray-900 mt-3">Access Denied</h1>
        <p className="text-sm text-gray-500 mt-2">You do not have permission to view this page.</p>
        <Link
          href="/dashboard"
          className="inline-block mt-6 px-6 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
        >
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
