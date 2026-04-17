"use client";
import { useEffect, useState, useCallback, useRef } from "react";

const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);
import QRCode from "react-qr-code";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Table, Thead, Tbody, Tr, Th, Td, TableWrapper, Badge } from "@/components/ui/Table";
import { Button } from "@/components/ui/Button";
import { Input, Select, Textarea } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { PageSpinner, Spinner } from "@/components/ui/Spinner";
import api from "@/lib/api";
import { getToken, isAdmin } from "@/lib/auth";
import toast from "react-hot-toast";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Product { id: string; name: string; sku: string | null; selling_price: number; stock_quantity: number; }
interface SaleItem { id: string; product_name: string; quantity: number; unit_price: number; total_price: number; }
interface Sale {
  id: string; invoice_number: string; customer_name: string | null;
  subtotal: number; discount_amount: number; vat_amount: number; total_amount: number;
  payment_method: string; payment_status: string | null; sale_date: string; notes: string | null; items: SaleItem[];
}
interface CartItem { uid: string; product_id: string; quantity: string; unit_price: string; }

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatCurrency(n: number) {
  return `Rs. ${n?.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;
}
function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

const paymentColors: Record<string, "success" | "info" | "warning" | "default"> = {
  cash: "success", online: "info", esewa: "warning", khalti: "warning",
};
const paymentStatusColors: Record<string, "success" | "info" | "warning" | "default"> = {
  paid: "success", pending: "warning", failed: "default",
};

// ── Reusable: Order Summary Box ───────────────────────────────────────────────

interface SummaryBoxProps {
  readonly subtotal: number;
  readonly discount: number;
  readonly vatAmount: number;
  readonly total: number;
  readonly applyVat: boolean;
}
function SummaryBox({ subtotal, discount, vatAmount, total, applyVat }: SummaryBoxProps) {
  return (
    <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex flex-col gap-2">
      {[
        { label: "Subtotal:",                     value: formatCurrency(subtotal),  bold: false },
        { label: "Discount:",                     value: `-${formatCurrency(discount)}`, bold: false },
        { label: `VAT ${applyVat ? "(13%)" : "(0%)"}:`, value: `+${formatCurrency(vatAmount)}`, bold: false },
      ].map(({ label, value }) => (
        <div key={label} className="flex justify-between text-sm text-gray-500">
          <span>{label}</span><span>{value}</span>
        </div>
      ))}
      <div className="flex justify-between text-base font-bold text-gray-900 pt-2 border-t border-gray-200">
        <span>Grand Total:</span><span>{formatCurrency(total)}</span>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function SalesPage() {
  const admin = isAdmin();
  const [sales,      setSales]      = useState<Sale[]>([]);
  const [products,   setProducts]   = useState<Product[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState("");
  const [modalOpen,  setModalOpen]  = useState(false);
  const [detailItem, setDetailItem] = useState<Sale | null>(null);
  const [deleteId,   setDeleteId]   = useState<string | null>(null);
  const [saving,     setSaving]     = useState(false);

  const [qrModal, setQrModal] = useState<{
    saleId: string; qrValue: string; qrImage?: string; totalAmount: number; gateway: "esewa" | "khalti" | "fonepay";
  } | null>(null);
  const [qrStatus, setQrStatus] = useState<"pending" | "paid">("pending");
  const qrPollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopQrPolling = useCallback(() => {
    if (qrPollRef.current) { clearInterval(qrPollRef.current); qrPollRef.current = null; }
  }, []);

  const startQrPolling = useCallback((saleId: string, gateway: "esewa" | "khalti" | "fonepay") => {
    stopQrPolling();
    qrPollRef.current = setInterval(async () => {
      try {
        const res = (await api.get(`/${gateway}/status/${saleId}`)) as { status: string };
        if (res.status === "paid") { setQrStatus("paid"); stopQrPolling(); }
      } catch { /* ignore */ }
    }, 3000);
  }, [stopQrPolling]);

  useEffect(() => () => stopQrPolling(), [stopQrPolling]);

  const [form, setForm] = useState({
    customer_name: "", discount_amount: "0", apply_vat: true,
    payment_method: "cash", notes: "", sale_date: new Date().toISOString().split("T")[0],
  });
  const [cartItems,  setCartItems]  = useState<CartItem[]>([{ uid: uid(), product_id: "", quantity: "1", unit_price: "" }]);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = (await api.get("/sales")) as { data: Sale[] };
      setSales(res.data ?? []);
    } catch {
      toast.error("Failed to load sales");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    api.get("/products?per_page=1000").then((r: unknown) => setProducts((r as { data: Product[] }).data ?? []));
  }, [load]);

  const filtered = sales.filter(
    (s) => !search || s.invoice_number.toLowerCase().includes(search.toLowerCase()) || (s.customer_name || "").toLowerCase().includes(search.toLowerCase()),
  );

  const openCreate = () => {
    setForm({ customer_name: "", discount_amount: "0", apply_vat: true, payment_method: "cash", notes: "", sale_date: new Date().toISOString().split("T")[0] });
    setCartItems([{ uid: uid(), product_id: "", quantity: "1", unit_price: "" }]);
    setFormErrors({});
    setModalOpen(true);
  };

  const addCartItem    = () => setCartItems([...cartItems, { uid: uid(), product_id: "", quantity: "1", unit_price: "" }]);
  const removeCartItem = (i: number) => setCartItems(cartItems.filter((_, idx) => idx !== i));
  const updateCartItem = (i: number, field: keyof CartItem, val: string) => {
    const updated = [...cartItems];
    updated[i] = { ...updated[i], [field]: val };
    if (field === "product_id" && val) {
      const prod = products.find((p) => p.id === val);
      if (prod) updated[i].unit_price = prod.selling_price.toString();
    }
    setCartItems(updated);
  };

  const subtotal  = cartItems.reduce((sum, it) => sum + Number.parseFloat(it.quantity || "0") * Number.parseFloat(it.unit_price || "0"), 0);
  const discount  = Number.parseFloat(form.discount_amount || "0");
  const vatRate   = form.apply_vat ? 0.13 : 0;
  const vatAmount = (subtotal - discount) * vatRate;
  const total     = subtotal - discount + vatAmount;

  const closeQrModal = () => { stopQrPolling(); setQrModal(null); setQrStatus("pending"); };

  const handleSave = async () => {
    setFormErrors({});
    setSaving(true);
    const payload = {
      customer_name:   form.customer_name || undefined,
      discount_amount: Number.parseFloat(form.discount_amount) || 0,
      apply_vat:       form.apply_vat,
      payment_method:  form.payment_method,
      notes:           form.notes || undefined,
      sale_date:       form.sale_date,
      items: cartItems.map((it) => ({
        product_id: it.product_id,
        quantity:   Number.parseInt(it.quantity),
        unit_price: Number.parseFloat(it.unit_price),
      })),
    };
    try {
      if (form.payment_method === "esewa") {
        const res = (await api.post("/esewa/initiate", payload)) as { sale_id: string; payment_url: string; esewa_params: Record<string, string>; };
        const relayBase = window.location.origin + `/payment/qr/${res.sale_id}`;
        const qrValue   = relayBase + "?" + new URLSearchParams({ payment_url: res.payment_url, ...res.esewa_params }).toString();
        setModalOpen(false);
        setQrModal({ saleId: res.sale_id, qrValue, totalAmount: total, gateway: "esewa" });
        setQrStatus("pending");
        startQrPolling(res.sale_id, "esewa");
        return;
      }
      if (form.payment_method === "khalti") {
        const res = (await api.post("/khalti/initiate", payload)) as { sale_id: string; payment_url: string; };
        setModalOpen(false);
        setQrModal({ saleId: res.sale_id, qrValue: res.payment_url, totalAmount: total, gateway: "khalti" });
        setQrStatus("pending");
        startQrPolling(res.sale_id, "khalti");
        return;
      }
      if (form.payment_method === "fonepay") {
        const res = (await api.post("/fonepay/initiate", payload)) as { sale_id: string; payment_url: string; qr_image: string | null; };
        setModalOpen(false);
        setQrModal({ saleId: res.sale_id, qrValue: res.payment_url, qrImage: res.qr_image ?? undefined, totalAmount: total, gateway: "fonepay" });
        setQrStatus("pending");
        startQrPolling(res.sale_id, "fonepay");
        return;
      }
      await api.post("/sales", payload);
      toast.success("Sale created — invoice generated!");
      setModalOpen(false);
      load();
    } catch (err: unknown) {
      const e = err as { errors?: Record<string, string[]>; message?: string };
      if (e?.errors) {
        const fe: Record<string, string> = {};
        Object.entries(e.errors).forEach(([k, v]) => { fe[k] = Array.isArray(v) ? v[0] : String(v); });
        setFormErrors(fe);
        toast.error("Please fix the errors");
      } else {
        toast.error(e?.message || "Failed to create sale");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/sales/${id}`);
      toast.success("Sale deleted — stock restored");
      setDeleteId(null);
      load();
    } catch {
      toast.error("Failed to delete sale");
    }
  };

  const downloadInvoice = (id: string) => {
    const token = getToken();
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/sales/${id}/invoice/download`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.blob())
      .then((blob) => {
        const url = URL.createObjectURL(blob);
        const a   = document.createElement("a");
        a.href = url; a.download = `invoice-${id}.pdf`; a.click();
        URL.revokeObjectURL(url);
      })
      .catch(() => toast.error("Failed to download invoice"));
  };

  if (loading) return <AppLayout title="Sales"><PageSpinner /></AppLayout>;

  const isEsewa   = form.payment_method === "esewa";
  const isKhalti  = form.payment_method === "khalti";
  const isFonepay = form.payment_method === "fonepay";

  return (
    <AppLayout title="Sales / Billing">
      <Card>
        <CardHeader>
          <CardTitle>Sales ({sales.length})</CardTitle>
          <Button onClick={openCreate}>+ New Sale</Button>
        </CardHeader>

        <div className="flex gap-2 mb-4 flex-wrap items-end">
          <Input placeholder="Search by invoice or customer…" value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xs" />
        </div>

        <TableWrapper>
          <Table>
            <Thead>
              <Tr>
                <Th>Invoice</Th><Th>Customer</Th><Th>Subtotal</Th><Th>Discount</Th>
                <Th>VAT</Th><Th>Total</Th><Th>Payment</Th><Th>Date</Th><Th>Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {filtered.length ? filtered.map((s) => (
                <Tr key={s.id}>
                  <Td className="font-semibold text-primary-600">{s.invoice_number}</Td>
                  <Td>{s.customer_name || <span className="text-gray-400">Walk-in</span>}</Td>
                  <Td className="text-gray-500">{formatCurrency(s.subtotal)}</Td>
                  <Td className="text-red-500">-{formatCurrency(s.discount_amount)}</Td>
                  <Td className="text-gray-500">{formatCurrency(s.vat_amount)}</Td>
                  <Td className="font-bold">{formatCurrency(s.total_amount)}</Td>
                  <Td>
                    <div className="flex flex-col gap-1">
                      <Badge variant={paymentColors[s.payment_method] || "default"}>{s.payment_method.toUpperCase()}</Badge>
                      {s.payment_status && <Badge variant={paymentStatusColors[s.payment_status] || "default"}>{s.payment_status.toUpperCase()}</Badge>}
                    </div>
                  </Td>
                  <Td className="text-gray-400 text-xs">{formatDate(s.sale_date)}</Td>
                  <Td>
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" onClick={() => setDetailItem(s)}>👁️</Button>
                      <Button size="sm" variant="outline" onClick={() => downloadInvoice(s.id)}>📄 PDF</Button>
                      {admin && <Button size="sm" variant="danger" onClick={() => setDeleteId(s.id)}>🗑️</Button>}
                    </div>
                  </Td>
                </Tr>
              )) : (
                <tr><td colSpan={9} className="px-4 py-10 text-center text-sm text-gray-400">No sales found</td></tr>
              )}
            </Tbody>
          </Table>
        </TableWrapper>
      </Card>

      {/* Create Sale Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="New Sale" size="xl"
        footer={
          <>
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} loading={saving}
              className={isEsewa ? "!bg-green-600 hover:!bg-green-700" : isKhalti ? "!bg-[#5C2D8F] hover:!bg-[#4a2473]" : isFonepay ? "!bg-[#1a56db] hover:!bg-[#1447c0]" : ""}
            >
              {saving ? "Processing…" : isEsewa ? "Pay with eSewa →" : isKhalti ? "Pay with Khalti →" : isFonepay ? "Pay with Fonepay →" : "Complete Sale"}
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <Input label="Customer Name" value={form.customer_name} onChange={(e) => setForm({ ...form, customer_name: e.target.value })} placeholder="Walk-in customer" />

          <div>
            <span className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Items *</span>
            <div className="flex flex-col gap-2">
              {cartItems.map((it, i) => (
                <div key={it.uid} className="grid grid-cols-[1fr_90px_120px_auto] gap-2 items-end">
                  <Select value={it.product_id} onChange={(e) => updateCartItem(i, "product_id", e.target.value)} error={formErrors[`items.${i}.product_id`]}>
                    <option value="">Select product…</option>
                    {products.map((p) => <option key={p.id} value={p.id}>{p.name} — Stock: {p.stock_quantity}</option>)}
                  </Select>
                  <Input type="number" placeholder="Qty" value={it.quantity} onChange={(e) => updateCartItem(i, "quantity", e.target.value)} error={formErrors[`items.${i}.quantity`]} min="1" />
                  <Input type="number" placeholder="Unit Price" value={it.unit_price} onChange={(e) => updateCartItem(i, "unit_price", e.target.value)} error={formErrors[`items.${i}.unit_price`]} />
                  <button onClick={() => removeCartItem(i)} disabled={cartItems.length === 1}
                    className="p-2 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 disabled:opacity-40 disabled:cursor-not-allowed text-sm transition-colors"
                  >✕</button>
                </div>
              ))}
            </div>
            <button type="button" onClick={addCartItem}
              className="mt-2 w-full flex items-center justify-center gap-2 px-4 py-2 border border-dashed border-gray-300 rounded-lg bg-gray-50 text-gray-500 text-sm hover:border-emerald-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
            >+ Add Item</button>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <Input label="Discount (Rs.)" type="number" value={form.discount_amount} onChange={(e) => setForm({ ...form, discount_amount: e.target.value })} min="0" />
            <div className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Apply VAT (13%)</span>
              <label htmlFor="apply_vat_checkbox" className="flex items-center gap-2 pt-2 cursor-pointer">
                <input id="apply_vat_checkbox" type="checkbox" checked={form.apply_vat} onChange={(e) => setForm({ ...form, apply_vat: e.target.checked })} className="w-4 h-4 accent-primary-600" />
                <span className="text-sm text-gray-700">{form.apply_vat ? "VAT included" : "No VAT"}</span>
              </label>
            </div>
            <Select label="Payment Method" value={form.payment_method} onChange={(e) => setForm({ ...form, payment_method: e.target.value })}>
              <option value="cash">Cash</option>
              <option value="online">Online / Card</option>
              <option value="esewa">eSewa</option>
              <option value="khalti">Khalti</option>
              <option value="fonepay">Fonepay</option>
            </Select>
          </div>

          {(isEsewa || isKhalti || isFonepay) && (
            <div className={`flex items-start gap-3 rounded-xl p-3 border text-sm ${isKhalti ? "bg-purple-50 border-purple-200 text-purple-900" : isFonepay ? "bg-blue-50 border-blue-200 text-blue-900" : "bg-amber-50 border-amber-200 text-amber-900"}`}>
              <span className="text-xl">{isKhalti ? "💜" : isFonepay ? "🔵" : "📱"}</span>
              <div className="leading-relaxed">
                <strong>A QR code will appear on screen.</strong><br />
                The sale and stock are reserved immediately. The customer scans the QR with their {isKhalti ? "Khalti" : isFonepay ? "Fonepay" : "eSewa"} app — this screen updates automatically once payment is confirmed.
              </div>
            </div>
          )}

          <SummaryBox subtotal={subtotal} discount={discount} vatAmount={vatAmount} total={total} applyVat={form.apply_vat} />

          <div className="grid grid-cols-2 gap-4">
            <Input label="Sale Date" type="date" value={form.sale_date} onChange={(e) => setForm({ ...form, sale_date: e.target.value })} />
            <Textarea label="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Optional notes…" className="min-h-[60px]" />
          </div>
        </div>
      </Modal>

      {/* Detail Modal */}
      <Modal open={detailItem !== null} onClose={() => setDetailItem(null)} title={`Invoice: ${detailItem?.invoice_number}`} size="md"
        footer={
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => setDetailItem(null)}>Close</Button>
            <Button variant="outline" onClick={() => detailItem && downloadInvoice(detailItem.id)}>📄 Download PDF</Button>
          </div>
        }
      >
        {detailItem && (
          <div className="flex flex-col gap-3">
            {[
              { label: "Invoice",  value: detailItem.invoice_number },
              { label: "Customer", value: detailItem.customer_name || "Walk-in" },
              { label: "Date",     value: formatDate(detailItem.sale_date) },
            ].map(({ label, value }) => (
              <div key={label} className="flex gap-2 text-sm text-gray-700">
                <strong className="text-gray-900 min-w-[100px]">{label}:</strong>{value}
              </div>
            ))}
            <div className="flex gap-2 text-sm text-gray-700 items-center">
              <strong className="text-gray-900 min-w-[100px]">Payment:</strong>
              <div className="flex gap-1.5">
                <Badge variant={paymentColors[detailItem.payment_method] || "default"}>{detailItem.payment_method.toUpperCase()}</Badge>
                {detailItem.payment_status && <Badge variant={paymentStatusColors[detailItem.payment_status] || "default"}>{detailItem.payment_status.toUpperCase()}</Badge>}
              </div>
            </div>
            <TableWrapper>
              <Table>
                <Thead><Tr><Th>Product</Th><Th>Qty</Th><Th>Unit Price</Th><Th>Total</Th></Tr></Thead>
                <Tbody>
                  {detailItem.items?.map((item) => (
                    <Tr key={item.id}>
                      <Td>{item.product_name}</Td>
                      <Td>{item.quantity}</Td>
                      <Td>{formatCurrency(item.unit_price)}</Td>
                      <Td className="font-semibold">{formatCurrency(item.total_price)}</Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </TableWrapper>
            <SummaryBox subtotal={detailItem.subtotal} discount={detailItem.discount_amount} vatAmount={detailItem.vat_amount} total={detailItem.total_amount} applyVat={detailItem.vat_amount > 0} />
          </div>
        )}
      </Modal>

      {/* QR Modal */}
      <Modal open={qrModal !== null} onClose={closeQrModal} title={qrModal?.gateway === "khalti" ? "Khalti Payment" : qrModal?.gateway === "fonepay" ? "Fonepay Payment" : "eSewa Payment"} size="sm"
        footer={
          qrStatus === "paid" ? (
            <Button onClick={() => { closeQrModal(); load(); }}>Done</Button>
          ) : (
            <>
              <Button variant="ghost" onClick={closeQrModal}>Cancel</Button>
              <Button variant="danger" onClick={async () => {
                if (qrModal) { try { await api.delete(`/sales/${qrModal.saleId}`); } catch { /* ignore */ } }
                closeQrModal(); load();
              }}>Cancel &amp; Restore Stock</Button>
            </>
          )
        }
      >
        {qrModal && (
          qrStatus === "paid" ? (
            <div className="text-center py-6">
              <div className="text-5xl mb-3">✅</div>
              <div className="text-lg font-bold text-gray-900 mb-1">Payment Successful!</div>
              <div className="text-sm text-gray-500">{formatCurrency(qrModal.totalAmount)} received</div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4 py-2">
              <div className="bg-white p-3 rounded-xl border border-gray-200">
                {qrModal.qrImage
                  ? <img src={qrModal.qrImage} alt="Fonepay QR" width={220} height={220} style={{ display: "block" }} />
                  : <QRCode value={qrModal.qrValue} size={220} />
                }
              </div>
              <div className="text-2xl font-bold text-gray-900">{formatCurrency(qrModal.totalAmount)}</div>
              <div className="flex items-center gap-2 text-gray-500 text-sm">
                <Spinner size={14} />
                <span>Scan with {qrModal.gateway === "khalti" ? "Khalti" : qrModal.gateway === "fonepay" ? "Fonepay" : "eSewa"} app · Waiting for payment…</span>
              </div>
              <a href={qrModal.qrValue} target="_blank" rel="noopener noreferrer" className="text-xs text-primary-600 underline">
                Open in browser instead ↗
              </a>
            </div>
          )
        )}
      </Modal>

      {/* Delete Modal */}
      <Modal open={deleteId !== null} onClose={() => setDeleteId(null)} title="Delete Sale" size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button variant="danger" onClick={() => deleteId && handleDelete(deleteId)}>Delete &amp; Restore Stock</Button>
          </>
        }
      >
        <p className="text-gray-600 text-sm">Deleting this sale will <strong>restore the stock</strong>. Are you sure?</p>
      </Modal>
    </AppLayout>
  );
}
