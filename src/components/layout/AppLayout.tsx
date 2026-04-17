'use client';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

// Auth checks and role-based redirects are handled by src/middleware.ts,
// which runs on the server before this component ever mounts.
// AppLayout is a pure layout wrapper with no auth logic needed.

interface AppLayoutProps {
  readonly children: React.ReactNode;
  readonly title?: string;
}

export function AppLayout({ children, title }: AppLayoutProps) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 ml-60 flex flex-col min-h-screen">
        <Topbar title={title} />
        <main className="flex-1 p-6 bg-gray-50">{children}</main>
      </div>
    </div>
  );
}
