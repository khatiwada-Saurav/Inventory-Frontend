"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardHeader, CardTitle, StatCard, StatLabel, StatValue } from "@/components/ui/Card";
import { Table, Thead, Tbody, Tr, Th, Td, TableWrapper, Badge } from "@/components/ui/Table";
import { Select } from "@/components/ui/Input";
import { PageSpinner } from "@/components/ui/Spinner";
import { cn } from "@/lib/utils";
import api from "@/lib/api";
import toast from "react-hot-toast";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Cell, ReferenceLine, Legend, LabelList,
} from "recharts";

// ── Helpers ───────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function unwrapApiData<T = any>(res: any): T {
  if (!res) return res;
  if (res.data && typeof res.data === "object" && "data" in res.data) return res.data.data as T;
  if ("data" in res) return res.data as T;
  return res as T;
}

function formatCurrency(n: number) {
  const safe = Number.isFinite(n) ? n : 0;
  return `Rs. ${safe.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;
}

// ── Types ─────────────────────────────────────────────────────────────────────

type DailyRow   = { date: string; total_revenue: number; transaction_count: number };
type MonthlyRow = { month: string; total_sales: number; transaction_count: number };
type MonthlyDetail = {
  year: string; month: number; total_sales: number; total_revenue: number; total_profit: number;
  daily_breakdown: Record<string, { total_revenue: number; total_sales: number }>;
};
type ProductRow  = { product_name: string; total_quantity_sold: number; total_revenue: number };
type LowStockRow = { id: number; name: string; sku: string; stock_quantity: number; min_stock_alert: number; category: { name: string } };
type ProfitPayload = {
  total_revenue: number; total_cost: number; total_profit: number;
  profit_margin_percent: number; period: { start: string; end: string };
};

// ── Reusable chart tooltip ────────────────────────────────────────────────────

function ChartTooltip({ label, rows }: { readonly label: string; readonly rows: { label: string; value: string }[] }) {
  return (
    <div className="bg-[#1e1b4b] border border-white/10 rounded-xl px-3.5 py-2.5 shadow-lg min-w-[160px]">
      <p className="text-[10px] font-semibold text-indigo-300 uppercase tracking-widest mb-2">{label}</p>
      {rows.map(({ label: l, value }) => (
        <div key={l} className="flex justify-between gap-4 text-xs text-indigo-100 my-0.5">
          <span>{l}</span><span className="font-bold">{value}</span>
        </div>
      ))}
    </div>
  );
}

// ── Constants ─────────────────────────────────────────────────────────────────

const CHART_COLORS = ["#6366F1","#8B5CF6","#EC4899","#F59E0B","#10B981","#3B82F6","#EF4444","#14B8A6","#F97316","#84CC16"];
const PROFIT_COLORS: Record<string, string> = { Revenue: "#6366F1", Cost: "#EF4444", Profit: "#10B981" };

const TABS = [
  { id: "daily",     label: "📅 Daily"      },
  { id: "monthly",   label: "📈 Monthly"    },
  { id: "products",  label: "📦 By Product" },
  { id: "low-stock", label: "⚠️ Low Stock"  },
  { id: "profit",    label: "💰 Profit"     },
];

const emptyCell = (colSpan: number, text: string) => (
  <tr><td colSpan={colSpan} className="px-4 py-10 text-center text-sm text-gray-400">{text}</td></tr>
);

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState("daily");

  const [dailyData,  setDailyData]  = useState<DailyRow[]>([]);
  const [dailyMonth, setDailyMonth] = useState(new Date().getMonth() + 1);
  const [dailyYear,  setDailyYear]  = useState(new Date().getFullYear());
  const [dailyDay,   setDailyDay]   = useState(0);

  const [monthlyData,   setMonthlyData]   = useState<MonthlyRow[]>([]);
  const [monthlyDetail, setMonthlyDetail] = useState<MonthlyDetail | null>(null);
  const [monthlyYear,   setMonthlyYear]   = useState(new Date().getFullYear());
  const [monthlyMonth,  setMonthlyMonth]  = useState(0);

  const [productData,  setProductData]  = useState<ProductRow[]>([]);
  const [lowStockData, setLowStockData] = useState<LowStockRow[]>([]);
  const [profitData,   setProfitData]   = useState<ProfitPayload | null>(null);
  const [startDate,    setStartDate]    = useState("");
  const [endDate,      setEndDate]      = useState("");
  const [loading,      setLoading]      = useState(false);

  const years = useMemo(() => Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i), []);
  const daysInSelectedMonth = useMemo(() => new Date(dailyYear, dailyMonth, 0).getDate(), [dailyYear, dailyMonth]);
  const months = useMemo(() => [
    { value: 1, label: "January" }, { value: 2, label: "February" }, { value: 3, label: "March" },
    { value: 4, label: "April" },   { value: 5, label: "May" },      { value: 6, label: "June" },
    { value: 7, label: "July" },    { value: 8, label: "August" },   { value: 9, label: "September" },
    { value: 10, label: "October" },{ value: 11, label: "November" },{ value: 12, label: "December" },
  ], []);

  const loadDaily = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/reports/monthly?year=${dailyYear}&month=${dailyMonth}`);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const raw = unwrapApiData<any>(res);
      const breakdown = (raw?.daily_breakdown ?? {}) as Record<string, { total_revenue: number; total_sales: number }>;
      const dataMap: Record<string, DailyRow> = {};
      Object.entries(breakdown).forEach(([date, v]) => {
        dataMap[date] = { date, total_revenue: Number(v.total_revenue ?? 0), transaction_count: Number(v.total_sales ?? 0) };
      });
      const daysInMonth = new Date(dailyYear, dailyMonth, 0).getDate();
      const normalized: DailyRow[] = Array.from({ length: daysInMonth }, (_, i) => {
        const day  = String(i + 1).padStart(2, "0");
        const date = `${dailyYear}-${String(dailyMonth).padStart(2, "0")}-${day}`;
        return dataMap[date] ?? { date, total_revenue: 0, transaction_count: 0 };
      });
      setDailyData(normalized);
    } catch {
      toast.error("Failed to load daily report");
      setDailyData([]);
    } finally {
      setLoading(false);
    }
  }, [dailyMonth, dailyYear]);

  const loadMonthly = useCallback(async () => {
    setLoading(true);
    try {
      let url = `/reports/monthly?year=${monthlyYear}`;
      if (monthlyMonth > 0) url += `&month=${monthlyMonth}`;
      const res = await api.get(url);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const raw = unwrapApiData<any>(res);
      if (monthlyMonth > 0) { setMonthlyDetail(raw as MonthlyDetail); setMonthlyData([]); }
      else                  { setMonthlyDetail(null); setMonthlyData(Array.isArray(raw) ? raw : []); }
    } catch {
      toast.error("Failed to load monthly report");
      setMonthlyData([]); setMonthlyDetail(null);
    } finally {
      setLoading(false);
    }
  }, [monthlyYear, monthlyMonth]);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await api.get("/reports/products");
      const data = unwrapApiData<ProductRow[]>(res) ?? [];
      setProductData(Array.isArray(data) ? data : []);
    } catch {
      toast.error("Failed to load product report");
      setProductData([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadLowStock = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await api.get("/reports/low-stock");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const raw  = unwrapApiData<any>(res);
      const list = (raw?.products ?? raw?.data ?? raw) as LowStockRow[];
      setLowStockData(Array.isArray(list) ? list : []);
    } catch {
      toast.error("Failed to load low stock report");
      setLowStockData([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadProfit = useCallback(async () => {
    setLoading(true);
    try {
      let url = "/reports/profit";
      if (startDate) url += `?from=${startDate}`;
      if (endDate)   url += `${startDate ? "&" : "?"}to=${endDate}`;
      const res  = await api.get(url);
      const data = unwrapApiData<ProfitPayload | null>(res);
      setProfitData(data ?? null);
    } catch {
      toast.error("Failed to load profit report");
      setProfitData(null);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    if (activeTab === "daily")     loadDaily();
    else if (activeTab === "monthly")   loadMonthly();
    else if (activeTab === "products")  loadProducts();
    else if (activeTab === "low-stock") loadLowStock();
    else if (activeTab === "profit")    loadProfit();
  }, [activeTab, loadDaily, loadMonthly, loadProducts, loadLowStock, loadProfit]);

  const dailyNonZero = dailyData.filter((d) => {
    if (dailyDay > 0) return Number(d.date.split("-")[2]) === dailyDay;
    return (d.total_revenue ?? 0) > 0;
  });

  // ── Shared axis/line props ────────────────────────────────────────────────

  const axisProps = { tickLine: false, axisLine: false };
  const lineRevenue = {
    yAxisId: "left", type: "linear" as const, dataKey: "total_revenue", stroke: "#6366F1",
    strokeWidth: 2.5,
    dot: { fill: "#6366F1", r: 3, strokeWidth: 2, stroke: "#fff" },
    activeDot: { r: 5, fill: "#6366F1", stroke: "#fff", strokeWidth: 2 },
    name: "Revenue",
  };

  return (
    <AppLayout title="Reports">
      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-xl w-fit">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={cn(
              "px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-150",
              activeTab === t.id
                ? "bg-white text-primary-600 shadow-sm"
                : "text-gray-500 hover:text-gray-700",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <PageSpinner />
      ) : (
        <>
          {/* ── DAILY ─────────────────────────────────────────────────────── */}
          {activeTab === "daily" && (
            <Card>
              <CardHeader>
                <CardTitle>Daily Sales Report</CardTitle>
                <div className="flex gap-2 flex-wrap">
                  <Select value={dailyDay} onChange={(e) => setDailyDay(Number.parseInt(e.target.value))} className="w-[110px]">
                    <option value={0}>All Days</option>
                    {Array.from({ length: daysInSelectedMonth }, (_, i) => i + 1).map((d) => (
                      <option key={d} value={d}>Day {d}</option>
                    ))}
                  </Select>
                  <Select value={dailyMonth} onChange={(e) => { setDailyMonth(Number.parseInt(e.target.value)); setDailyDay(0); }} className="w-[150px]">
                    {months.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
                  </Select>
                  <Select value={dailyYear} onChange={(e) => { setDailyYear(Number.parseInt(e.target.value)); setDailyDay(0); }} className="w-[100px]">
                    {years.map((y) => <option key={y} value={y}>{y}</option>)}
                  </Select>
                </div>
              </CardHeader>

              <div className="h-[300px] mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={dailyData} margin={{ top: 16, right: 48, left: 8, bottom: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#9CA3AF" }} {...axisProps} tickFormatter={(d: string) => d ? d.split("-")[2] : ""} />
                    <YAxis yAxisId="left" tick={{ fontSize: 11, fill: "#9CA3AF" }} {...axisProps} tickFormatter={(v) => `${(Number(v) / 1000).toFixed(0)}K`} />
                    <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: "#10B981" }} {...axisProps} tickFormatter={(v) => `${v}`} width={30} />
                    <Tooltip cursor={{ stroke: "#6366F1", strokeWidth: 1, strokeDasharray: "4 4" }} content={({ active, payload, label }) => {
                      if (!active || !payload?.length) return null;
                      const d = payload[0].payload as DailyRow;
                      return <ChartTooltip label={`📅 ${label}`} rows={[{ label: "Revenue", value: formatCurrency(d.total_revenue) }, { label: "Transactions", value: String(d.transaction_count) }]} />;
                    }} />
                    <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} formatter={(value) => <span style={{ color: "#6B7280" }}>{value}</span>} />
                    {dailyData.length > 1 && (
                      <ReferenceLine yAxisId="left" y={dailyData.reduce((s, d) => s + d.total_revenue, 0) / (dailyData.filter((d) => d.total_revenue > 0).length || 1)} stroke="#F59E0B" strokeDasharray="4 4" label={{ value: "avg", position: "insideTopRight", fontSize: 10, fill: "#F59E0B" }} />
                    )}
                    <Line {...lineRevenue} />
                    <Line yAxisId="right" type="linear" dataKey="transaction_count" stroke="#10B981" strokeWidth={2} strokeDasharray="5 3"
                      dot={{ fill: "#10B981", r: 3, strokeWidth: 2, stroke: "#fff" }} activeDot={{ r: 5, fill: "#10B981", stroke: "#fff", strokeWidth: 2 }} name="Transactions" />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-4">
                <TableWrapper>
                  <Table>
                    <Thead><Tr><Th>Date</Th><Th>Transactions</Th><Th>Total Revenue</Th></Tr></Thead>
                    <Tbody>
                      {dailyNonZero.length ? dailyNonZero.map((d, i) => (
                        <Tr key={i}>
                          <Td>{d.date}</Td>
                          <Td><Badge variant="info">{d.transaction_count}</Badge></Td>
                          <Td className="font-semibold">{formatCurrency(d.total_revenue)}</Td>
                        </Tr>
                      )) : emptyCell(3, "No sales data for this period")}
                    </Tbody>
                  </Table>
                </TableWrapper>
              </div>
            </Card>
          )}

          {/* ── MONTHLY ───────────────────────────────────────────────────── */}
          {activeTab === "monthly" && (
            <>
              <Card className="mb-4">
                <CardHeader>
                  <CardTitle>Monthly Sales Report</CardTitle>
                  <div className="flex gap-2 flex-wrap">
                    <Select value={monthlyMonth} onChange={(e) => setMonthlyMonth(Number.parseInt(e.target.value))} className="w-[150px]">
                      <option value={0}>All Months</option>
                      {months.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
                    </Select>
                    <Select value={monthlyYear} onChange={(e) => setMonthlyYear(Number.parseInt(e.target.value))} className="w-[100px]">
                      {years.map((y) => <option key={y} value={y}>{y}</option>)}
                    </Select>
                  </div>
                </CardHeader>
              </Card>

              {monthlyDetail ? (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                    <StatCard color="#6366F1"><StatLabel>Total Revenue</StatLabel><StatValue className="text-xl">{formatCurrency(monthlyDetail.total_revenue)}</StatValue></StatCard>
                    <StatCard color="#10B981"><StatLabel>Total Profit</StatLabel><StatValue className="text-xl">{formatCurrency(monthlyDetail.total_profit)}</StatValue></StatCard>
                    <StatCard color="#3B82F6"><StatLabel>Total Transactions</StatLabel><StatValue>{monthlyDetail.total_sales}</StatValue></StatCard>
                  </div>
                  <Card>
                    <CardHeader>
                      <CardTitle>Daily Breakdown — {months.find((m) => m.value === monthlyDetail.month)?.label} {monthlyDetail.year}</CardTitle>
                    </CardHeader>
                    {(() => {
                      const breakdown = Object.entries(monthlyDetail.daily_breakdown)
                        .map(([date, v]) => ({ date, total_revenue: v.total_revenue, total_sales: v.total_sales }))
                        .sort((a, b) => a.date.localeCompare(b.date));
                      return (
                        <>
                          <div className="h-[300px] mt-2">
                            <ResponsiveContainer width="100%" height="100%">
                              <LineChart data={breakdown} margin={{ top: 16, right: 48, left: 8, bottom: 4 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                                <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#9CA3AF" }} {...axisProps} tickFormatter={(d: string) => d ? d.split("-")[2] : ""} />
                                <YAxis yAxisId="left" tick={{ fontSize: 11, fill: "#9CA3AF" }} {...axisProps} tickFormatter={(v) => `${(Number(v) / 1000).toFixed(0)}K`} />
                                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: "#10B981" }} {...axisProps} tickFormatter={(v) => `${v}`} width={30} />
                                <Tooltip cursor={{ stroke: "#6366F1", strokeWidth: 1, strokeDasharray: "4 4" }} content={({ active, payload }) => {
                                  if (!active || !payload?.length) return null;
                                  const d = payload[0].payload as { date: string; total_revenue: number; total_sales: number };
                                  return <ChartTooltip label={`📅 ${d.date}`} rows={[{ label: "Revenue", value: formatCurrency(d.total_revenue) }, { label: "Transactions", value: String(d.total_sales) }]} />;
                                }} />
                                <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} formatter={(value) => <span style={{ color: "#6B7280" }}>{value}</span>} />
                                <Line {...lineRevenue} />
                                <Line yAxisId="right" type="linear" dataKey="total_sales" stroke="#10B981" strokeWidth={2} strokeDasharray="5 3"
                                  dot={{ fill: "#10B981", r: 3, strokeWidth: 2, stroke: "#fff" }} activeDot={{ r: 5, fill: "#10B981", stroke: "#fff", strokeWidth: 2 }} name="Transactions" />
                              </LineChart>
                            </ResponsiveContainer>
                          </div>
                          <div className="mt-4">
                            <TableWrapper>
                              <Table>
                                <Thead><Tr><Th>Date</Th><Th>Transactions</Th><Th>Revenue</Th></Tr></Thead>
                                <Tbody>
                                  {breakdown.length ? breakdown.map((d) => (
                                    <Tr key={d.date}>
                                      <Td>{d.date}</Td>
                                      <Td><Badge variant="info">{d.total_sales}</Badge></Td>
                                      <Td className="font-semibold">{formatCurrency(d.total_revenue)}</Td>
                                    </Tr>
                                  )) : emptyCell(3, "No data for this month")}
                                </Tbody>
                              </Table>
                            </TableWrapper>
                          </div>
                        </>
                      );
                    })()}
                  </Card>
                </>
              ) : (
                <Card>
                  <div className="h-[300px] mt-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={monthlyData} margin={{ top: 16, right: 48, left: 8, bottom: 4 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                        <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#9CA3AF" }} {...axisProps} tickFormatter={(m: string) => m ? m.split(" ")[0].substring(0, 3) : ""} />
                        <YAxis yAxisId="left" tick={{ fontSize: 11, fill: "#9CA3AF" }} {...axisProps} tickFormatter={(v) => `${(Number(v) / 1000).toFixed(0)}K`} />
                        <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: "#10B981" }} {...axisProps} tickFormatter={(v) => `${v}`} width={30} />
                        <Tooltip cursor={{ stroke: "#6366F1", strokeWidth: 1, strokeDasharray: "4 4" }} content={({ active, payload }) => {
                          if (!active || !payload?.length) return null;
                          const d = payload[0].payload as MonthlyRow;
                          return <ChartTooltip label={`📈 ${d.month}`} rows={[{ label: "Revenue", value: formatCurrency(d.total_sales) }, { label: "Transactions", value: String(d.transaction_count) }]} />;
                        }} />
                        <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} formatter={(value) => <span style={{ color: "#6B7280" }}>{value}</span>} />
                        <Line yAxisId="left" type="linear" dataKey="total_sales" stroke="#6366F1" strokeWidth={2.5}
                          dot={{ fill: "#6366F1", r: 4, strokeWidth: 2, stroke: "#fff" }} activeDot={{ r: 6, fill: "#6366F1", stroke: "#fff", strokeWidth: 2 }} name="Revenue" />
                        <Line yAxisId="right" type="linear" dataKey="transaction_count" stroke="#10B981" strokeWidth={2} strokeDasharray="5 3"
                          dot={{ fill: "#10B981", r: 3, strokeWidth: 2, stroke: "#fff" }} activeDot={{ r: 5, fill: "#10B981", stroke: "#fff", strokeWidth: 2 }} name="Transactions" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-4">
                    <TableWrapper>
                      <Table>
                        <Thead><Tr><Th>Month</Th><Th>Transactions</Th><Th>Total Revenue</Th></Tr></Thead>
                        <Tbody>
                          {monthlyData.length ? monthlyData.map((d, i) => (
                            <Tr key={i}>
                              <Td className="font-medium">{d.month}</Td>
                              <Td><Badge variant="info">{d.transaction_count}</Badge></Td>
                              <Td className="font-semibold">{formatCurrency(d.total_sales)}</Td>
                            </Tr>
                          )) : emptyCell(3, "No data available")}
                        </Tbody>
                      </Table>
                    </TableWrapper>
                  </div>
                </Card>
              )}
            </>
          )}

          {/* ── PRODUCTS ──────────────────────────────────────────────────── */}
          {activeTab === "products" && (
            <Card>
              <CardHeader><CardTitle>Sales by Product</CardTitle></CardHeader>
              <div className="h-[300px] mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={productData.slice(0, 10)} layout="vertical" margin={{ top: 4, right: 80, left: 120, bottom: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 11, fill: "#9CA3AF" }} {...axisProps} tickFormatter={(v) => `${(Number(v) / 1000).toFixed(0)}K`} />
                    <YAxis type="category" dataKey="product_name" tick={{ fontSize: 11, fill: "#374151" }} {...axisProps} width={120} />
                    <Tooltip cursor={{ fill: "rgba(0,0,0,0.04)" }} content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const d = payload[0].payload as ProductRow;
                      return <ChartTooltip label={`📦 ${d.product_name}`} rows={[{ label: "Revenue", value: formatCurrency(d.total_revenue) }, { label: "Units Sold", value: String(d.total_quantity_sold) }]} />;
                    }} />
                    <Bar dataKey="total_revenue" radius={[0, 6, 6, 0]} name="Revenue" maxBarSize={22}>
                      {productData.slice(0, 10).map((entry, i) => (
                        <Cell key={entry.product_name} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                      ))}
                      <LabelList dataKey="total_revenue" position="right" formatter={(v: number) => `Rs. ${(v / 1000).toFixed(1)}K`} style={{ fontSize: 10, fill: "#6B7280" }} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4">
                <TableWrapper>
                  <Table>
                    <Thead><Tr><Th>Product</Th><Th>Qty Sold</Th><Th>Total Revenue</Th></Tr></Thead>
                    <Tbody>
                      {productData.length ? productData.map((d, i) => (
                        <Tr key={i}>
                          <Td className="font-medium">{d.product_name}</Td>
                          <Td><Badge variant="info">{d.total_quantity_sold} units</Badge></Td>
                          <Td className="font-semibold text-emerald-600">{formatCurrency(d.total_revenue)}</Td>
                        </Tr>
                      )) : emptyCell(3, "No sales data")}
                    </Tbody>
                  </Table>
                </TableWrapper>
              </div>
            </Card>
          )}

          {/* ── LOW STOCK ─────────────────────────────────────────────────── */}
          {activeTab === "low-stock" && (
            <Card>
              <CardHeader><CardTitle>⚠️ Low Stock Alert ({lowStockData.length} items)</CardTitle></CardHeader>
              <TableWrapper>
                <Table>
                  <Thead><Tr><Th>Product</Th><Th>SKU</Th><Th>Category</Th><Th>Stock</Th><Th>Min Alert</Th><Th>Shortage</Th></Tr></Thead>
                  <Tbody>
                    {lowStockData.length ? lowStockData.map((item) => (
                      <Tr key={item.id}>
                        <Td className="font-semibold">{item.name}</Td>
                        <Td className="font-mono text-xs text-gray-500">{item.sku || "—"}</Td>
                        <Td><Badge variant="info">{item.category?.name || "—"}</Badge></Td>
                        <Td><Badge variant="danger">{item.stock_quantity}</Badge></Td>
                        <Td>{item.min_stock_alert}</Td>
                        <Td className="font-semibold text-red-600">{Math.max(0, item.min_stock_alert - item.stock_quantity)} needed</Td>
                      </Tr>
                    )) : emptyCell(6, "✅ All items are well-stocked!")}
                  </Tbody>
                </Table>
              </TableWrapper>
            </Card>
          )}

          {/* ── PROFIT ────────────────────────────────────────────────────── */}
          {activeTab === "profit" && (
            <>
              <Card className="mb-4">
                <CardHeader>
                  <CardTitle>Profit &amp; Revenue Report</CardTitle>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-gray-500">From:</span>
                    <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
                      className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs text-gray-700 outline-none focus:border-primary-500" />
                    <span className="text-xs text-gray-500">To:</span>
                    <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
                      className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs text-gray-700 outline-none focus:border-primary-500" />
                  </div>
                </CardHeader>
              </Card>

              {profitData && (
                <>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                    <StatCard color="#4F46E5"><StatLabel>Total Revenue</StatLabel><StatValue className="text-xl">{formatCurrency(profitData.total_revenue)}</StatValue></StatCard>
                    <StatCard color="#EF4444"><StatLabel>Total Cost</StatLabel><StatValue className="text-xl">{formatCurrency(profitData.total_cost)}</StatValue></StatCard>
                    <StatCard color="#10B981"><StatLabel>Gross Profit</StatLabel><StatValue className="text-xl">{formatCurrency(profitData.total_profit)}</StatValue></StatCard>
                    <StatCard color="#F59E0B"><StatLabel>Profit Margin</StatLabel><StatValue className="text-xl">{Number(profitData?.profit_margin_percent ?? 0).toFixed(2)}%</StatValue></StatCard>
                  </div>
                  <Card>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={[{ name: "Revenue", value: profitData.total_revenue }, { name: "Cost", value: profitData.total_cost }, { name: "Profit", value: profitData.total_profit }]} margin={{ top: 24, right: 16, left: 8, bottom: 4 }}>
                          <defs>
                            {Object.entries(PROFIT_COLORS).map(([name, color]) => (
                              <linearGradient key={name} id={`profitGrad_${name}`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor={color} stopOpacity={1} />
                                <stop offset="100%" stopColor={color} stopOpacity={0.6} />
                              </linearGradient>
                            ))}
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                          <XAxis dataKey="name" tick={{ fontSize: 13, fill: "#374151", fontWeight: 600 }} {...axisProps} />
                          <YAxis tick={{ fontSize: 11, fill: "#9CA3AF" }} {...axisProps} tickFormatter={(v) => `${(Number(v) / 1000).toFixed(0)}K`} />
                          <Tooltip cursor={{ fill: "rgba(0,0,0,0.04)" }} content={({ active, payload }) => {
                            if (!active || !payload?.length) return null;
                            const d = payload[0].payload as { name: string; value: number };
                            return <ChartTooltip label={d.name} rows={[
                              { label: "Amount", value: formatCurrency(d.value) },
                              ...(d.name === "Profit" ? [{ label: "Margin", value: `${Number(profitData?.profit_margin_percent ?? 0).toFixed(2)}%` }] : []),
                            ]} />;
                          }} />
                          <Bar dataKey="value" radius={[8, 8, 0, 0]} maxBarSize={80}>
                            {["Revenue", "Cost", "Profit"].map((name) => (
                              <Cell key={name} fill={`url(#profitGrad_${name})`} />
                            ))}
                            <LabelList dataKey="value" position="top" formatter={(v: number) => `Rs. ${(v / 1000).toFixed(1)}K`} style={{ fontSize: 11, fill: "#374151", fontWeight: 600 }} />
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </Card>
                </>
              )}
            </>
          )}
        </>
      )}
    </AppLayout>
  );
}
