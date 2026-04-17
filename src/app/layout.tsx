import type { Metadata } from 'next';
import { Toaster } from 'react-hot-toast';
import './globals.css';

export const metadata: Metadata = {
  title: 'InventoryPro — Stock Management',
  description: 'Inventory management system',
};

export default function RootLayout({ children }: { readonly children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              borderRadius: '10px',
              background: '#1E1B4B',
              color: '#fff',
              fontSize: '13px',
              fontWeight: 500,
            },
          }}
        />
      </body>
    </html>
  );
}
