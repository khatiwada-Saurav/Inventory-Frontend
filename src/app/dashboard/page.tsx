'use client';
import { useEffect, useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { StatCard, StatLabel, StatValue, Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Table, Thead, Tbody, Tr, Th, Td, TableWrapper } from '@/components/ui/Table';
import { PageSpinner } from '@/components/ui/Spinner';
import api from '@/lib/api';
import Link from 'next/link';

interface DashboardData {
  total_products: number;
  total_categories?: number;
  total_suppliers?: number;
  low_stock_count: number;
  today_sales_count: number;
  today_revenue: number;
  month_sales_count?: number;
  month_revenue: number;
  recent_sales: Array<{
    id: number;
    invoice_number: string;
    total_amount: number;
    sale_date: string;
    created_at: string;
  }>;
}

interface LowStockItem {
  id: number;
  name: string;
  sku: string;
  stock_quantity: number;
  min_stock_alert: number;
  category: { name: string };
}

function formatCurrency(amount: number) {
  return `Rs. ${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function DashboardPage() {
  const [data,             setData]             = useState<DashboardData | null>(null);
  const [lowStock,         setLowStock]         = useState<LowStockItem[]>([]);
  const [totalCategories,  setTotalCategories]  = useState(0);
  const [totalSuppliers,   setTotalSuppliers]   = useState(0);
  const [loading,          setLoading]          = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/dashboard'),
      api.get('/reports/low-stock'),
      api.get('/categories'),
      api.get('/suppliers'),
    ]).then(([dash, ls, cats, sups]) => {
      setData(dash as unknown as DashboardData);
      const lsRes = ls as unknown as { products?: LowStockItem[]; data?: LowStockItem[] };
      setLowStock(lsRes.products ?? lsRes.data ?? []);
      const catsRes = cats as unknown as { data?: unknown[]; total?: number };
      setTotalCategories(catsRes.total ?? (catsRes.data?.length ?? 0));
      const supsRes = sups as unknown as { data?: unknown[]; total?: number };
      setTotalSuppliers(supsRes.total ?? (supsRes.data?.length ?? 0));
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <AppLayout title="Dashboard"><PageSpinner /></AppLayout>;

  const stats = [
    { label: 'Total Products',    value: data?.total_products ?? 0,                  color: '#4F46E5' },
    { label: 'Total Categories',  value: totalCategories,                             color: '#10B981' },
    { label: 'Total Suppliers',   value: totalSuppliers,                              color: '#F59E0B' },
    { label: 'Low Stock Items',   value: data?.low_stock_count ?? 0,                  color: '#EF4444' },
    { label: "Today's Sales",     value: data?.today_sales_count ?? 0,                color: '#3B82F6' },
    { label: "Today's Revenue",   value: formatCurrency(data?.today_revenue ?? 0),    color: '#8B5CF6', small: true },
    { label: 'Monthly Revenue',   value: formatCurrency(data?.month_revenue ?? 0),    color: '#EC4899', small: true },
  ];

  return (
    <AppLayout title="Dashboard">
      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4 mb-6">
        {stats.map((s) => (
          <StatCard key={s.label} color={s.color}>
            <StatLabel>{s.label}</StatLabel>
            <StatValue className={s.small ? 'text-xl' : ''}>{s.value}</StatValue>
          </StatCard>
        ))}
      </div>

      {/* Bottom grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Sales */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Sales</CardTitle>
            <Link href="/sales" className="text-xs text-primary-600 font-semibold hover:underline">
              View All →
            </Link>
          </CardHeader>
          <TableWrapper>
            <Table>
              <Thead>
                <Tr>
                  <Th>Invoice</Th>
                  <Th>Amount</Th>
                  <Th>Date</Th>
                </Tr>
              </Thead>
              <Tbody>
                {data?.recent_sales?.length ? data.recent_sales.map((sale) => (
                  <Tr key={sale.id}>
                    <Td>
                      <Link href="/sales" className="text-primary-600 font-semibold hover:underline text-xs">
                        {sale.invoice_number}
                      </Link>
                    </Td>
                    <Td className="font-semibold">{formatCurrency(sale.total_amount)}</Td>
                    <Td className="text-gray-400 text-xs">{formatDate(sale.created_at)}</Td>
                  </Tr>
                )) : (
                  <tr>
                    <td colSpan={3} className="px-4 py-8 text-center text-sm text-gray-400">No recent sales</td>
                  </tr>
                )}
              </Tbody>
            </Table>
          </TableWrapper>
        </Card>

        {/* Low Stock Alerts */}
        <Card>
          <CardHeader>
            <CardTitle>⚠️ Low Stock Alerts</CardTitle>
            <Link href="/reports?tab=low-stock" className="text-xs text-primary-600 font-semibold hover:underline">
              View All →
            </Link>
          </CardHeader>
          <TableWrapper>
            <Table>
              <Thead>
                <Tr>
                  <Th>Product</Th>
                  <Th>Stock</Th>
                  <Th>Min</Th>
                </Tr>
              </Thead>
              <Tbody>
                {lowStock.length ? lowStock.slice(0, 5).map((item) => (
                  <Tr key={item.id}>
                    <Td>
                      <div className="font-semibold text-sm">{item.name}</div>
                      <div className="text-[11px] text-gray-400">{item.sku}</div>
                    </Td>
                    <Td>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700">
                        {item.stock_quantity}
                      </span>
                    </Td>
                    <Td className="text-gray-500 text-sm">{item.min_stock_alert}</Td>
                  </Tr>
                )) : (
                  <tr>
                    <td colSpan={3} className="px-4 py-8 text-center text-sm text-gray-400">✅ All stock levels are healthy</td>
                  </tr>
                )}
              </Tbody>
            </Table>
          </TableWrapper>
        </Card>
      </div>
    </AppLayout>
  );
}
