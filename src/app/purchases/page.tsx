"use client";
import { useEffect, useState, useCallback } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Table, Thead, Tbody, Tr, Th, Td, TableWrapper } from "@/components/ui/Table";
import { Button } from "@/components/ui/Button";
import { Input, Select, Textarea } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { PageSpinner, Spinner } from "@/components/ui/Spinner";
import api from "@/lib/api";
import toast from "react-hot-toast";
import { isAdmin } from "@/lib/auth";

interface Supplier { id: number; name: string; }
interface Product  { id: number; name: string; sku: string | null; cost_price: number | null; }

interface PurchaseItem {
  product: { id: number; name: string };
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface Purchase {
  id: number;
  reference_number: string;
  supplier: { id: number; name: string } | null;
  total_amount: number;
  notes: string | null;
  purchase_date: string;
  items_count: number;
  items?: PurchaseItem[];
}

interface OrderItem { product_id: string; quantity: string; unit_price: string; }

function formatCurrency(n: number | null | undefined) {
  if (n == null) return "—";
  return `Rs. ${n.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;
}
function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

export default function PurchasesPage() {
  const admin = isAdmin();
  const [purchases,    setPurchases]    = useState<Purchase[]>([]);
  const [suppliers,    setSuppliers]    = useState<Supplier[]>([]);
  const [products,     setProducts]     = useState<Product[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [modalOpen,    setModalOpen]    = useState(false);
  const [detailItem,   setDetailItem]   = useState<Purchase | null>(null);
  const [detailLoading,setDetailLoading]= useState(false);
  const [deleteId,     setDeleteId]     = useState<number | null>(null);
  const [saving,       setSaving]       = useState(false);
  const [form, setForm] = useState({ supplier_id: "", notes: "", purchased_at: new Date().toISOString().split("T")[0] });
  const [items,        setItems]        = useState<OrderItem[]>([{ product_id: "", quantity: "1", unit_price: "" }]);
  const [formErrors,   setFormErrors]   = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = (await api.get("/purchases")) as { data: Purchase[] };
      setPurchases(res.data ?? []);
    } catch {
      toast.error("Failed to load purchases");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    api.get("/suppliers").then((r: unknown) => setSuppliers((r as { data: Supplier[] }).data ?? []));
    api.get("/products?per_page=1000").then((r: unknown) => setProducts((r as { data: Product[] }).data ?? []));
  }, [load]);

  const openCreate = () => {
    setForm({ supplier_id: "", notes: "", purchased_at: new Date().toISOString().split("T")[0] });
    setItems([{ product_id: "", quantity: "1", unit_price: "" }]);
    setFormErrors({});
    setModalOpen(true);
  };

  const addItem    = () => setItems([...items, { product_id: "", quantity: "1", unit_price: "" }]);
  const removeItem = (i: number) => setItems(items.filter((_, idx) => idx !== i));
  const updateItem = (i: number, field: keyof OrderItem, val: string) => {
    const updated = [...items];
    updated[i] = { ...updated[i], [field]: val };
    if (field === "product_id" && val) {
      const prod = products.find((p) => p.id.toString() === val);
      if (prod?.cost_price) updated[i].unit_price = prod.cost_price.toString();
    }
    setItems(updated);
  };

  const total = items.reduce((sum, it) => sum + parseFloat(it.quantity || "0") * parseFloat(it.unit_price || "0"), 0);

  const handleSave = async () => {
    setFormErrors({});
    setSaving(true);
    try {
      await api.post("/purchases", {
        supplier_id:   form.supplier_id || undefined,
        notes:         form.notes || undefined,
        purchase_date: form.purchased_at,
        items: items.map((it) => ({
          product_id: it.product_id,
          quantity:   parseInt(it.quantity),
          unit_price: parseFloat(it.unit_price),
        })),
      });
      toast.success("Purchase recorded — stock updated!");
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
        toast.error(e?.message || "Failed to save purchase");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/purchases/${id}`);
      toast.success("Purchase deleted — stock reversed");
      setDeleteId(null);
      load();
    } catch {
      toast.error("Failed to delete purchase");
    }
  };

  if (loading) return <AppLayout title="Purchases"><PageSpinner /></AppLayout>;

  return (
    <AppLayout title="Purchases (Stock In)">
      <Card>
        <CardHeader>
          <CardTitle>Purchase Orders ({purchases.length})</CardTitle>
          {admin && <Button onClick={openCreate}>+ New Purchase</Button>}
        </CardHeader>

        <TableWrapper>
          <Table>
            <Thead>
              <Tr>
                <Th>Reference</Th>
                <Th>Supplier</Th>
                <Th>Items</Th>
                <Th>Total Amount</Th>
                <Th>Date</Th>
                {admin && <Th>Actions</Th>}
              </Tr>
            </Thead>
            <Tbody>
              {purchases.length ? purchases.map((p) => (
                <Tr key={p.id}>
                  <Td className="font-semibold text-primary-600">{p.reference_number}</Td>
                  <Td>{p.supplier?.name || "No supplier"}</Td>
                  <Td className="text-gray-500">{p.items_count ?? 0} items</Td>
                  <Td className="font-semibold">{formatCurrency(p.total_amount)}</Td>
                  <Td className="text-gray-400 text-xs">{formatDate(p.purchase_date)}</Td>
                  <Td>
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" onClick={async () => {
                        setDetailItem(p);
                        setDetailLoading(true);
                        try {
                          const full = await api.get(`/purchases/${p.id}`) as Purchase;
                          setDetailItem(full);
                        } catch {
                          toast.error('Failed to load purchase details');
                        } finally {
                          setDetailLoading(false);
                        }
                      }}>👁️ View</Button>
                      {admin && <Button size="sm" variant="danger" onClick={() => setDeleteId(p.id)}>🗑️</Button>}
                    </div>
                  </Td>
                </Tr>
              )) : (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-sm text-gray-400">No purchases found</td></tr>
              )}
            </Tbody>
          </Table>
        </TableWrapper>
      </Card>

      {/* Create Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="New Purchase Order" size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} loading={saving}>{saving ? "Recording…" : "Record Purchase"}</Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <Select label="Supplier (optional)" value={form.supplier_id} onChange={(e) => setForm({ ...form, supplier_id: e.target.value })}>
              <option value="">No supplier</option>
              {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </Select>
            <Input label="Purchase Date" type="date" value={form.purchased_at} onChange={(e) => setForm({ ...form, purchased_at: e.target.value })} />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Items *</label>
            <div className="flex flex-col gap-2">
              {items.map((it, i) => (
                <div key={i} className="grid grid-cols-[1fr_100px_120px_auto] gap-2 items-end">
                  <Select value={it.product_id} onChange={(e) => updateItem(i, "product_id", e.target.value)} error={formErrors[`items.${i}.product_id`]}>
                    <option value="">Select product…</option>
                    {products.map((p) => <option key={p.id} value={p.id}>{p.name} {p.sku ? `(${p.sku})` : ""}</option>)}
                  </Select>
                  <Input type="number" placeholder="Qty" value={it.quantity} onChange={(e) => updateItem(i, "quantity", e.target.value)} error={formErrors[`items.${i}.quantity`]} min="1" />
                  <Input type="number" placeholder="Unit Price" value={it.unit_price} onChange={(e) => updateItem(i, "unit_price", e.target.value)} error={formErrors[`items.${i}.unit_price`]} />
                  <button
                    onClick={() => removeItem(i)}
                    disabled={items.length === 1}
                    className="p-2 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 disabled:opacity-40 disabled:cursor-not-allowed text-sm transition-colors"
                  >✕</button>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={addItem}
              className="mt-2 w-full flex items-center justify-center gap-2 px-4 py-2 border border-dashed border-gray-300 rounded-lg bg-gray-50 text-gray-500 text-sm hover:border-primary-400 hover:text-primary-600 hover:bg-primary-50 transition-colors"
            >
              + Add Item
            </button>
          </div>

          <div className="flex justify-end items-center gap-2 pt-3 border-t border-gray-100 font-bold text-gray-900">
            <span className="font-normal text-gray-500 text-sm">Total:</span>
            <span>{formatCurrency(total)}</span>
          </div>

          <Textarea label="Notes (optional)" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="e.g. Monthly stock replenishment" />
        </div>
      </Modal>

      {/* Detail Modal */}
      <Modal open={detailItem !== null} onClose={() => setDetailItem(null)} title={`Purchase: ${detailItem?.reference_number}`} size="md"
        footer={<Button variant="ghost" onClick={() => setDetailItem(null)}>Close</Button>}
      >
        {detailItem && (
          <div className="flex flex-col gap-3">
            {detailLoading && <div className="text-center py-4"><Spinner size={24} /></div>}
            {[
              { label: "Reference", value: detailItem.reference_number },
              { label: "Supplier",  value: detailItem.supplier?.name || "N/A" },
              { label: "Date",      value: formatDate(detailItem.purchase_date) },
              { label: "Notes",     value: detailItem.notes || "N/A" },
            ].map(({ label, value }) => (
              <div key={label} className="flex gap-2 text-sm text-gray-700">
                <strong className="text-gray-900 min-w-[120px]">{label}:</strong>
                {value}
              </div>
            ))}
            <TableWrapper>
              <Table>
                <Thead><Tr><Th>Product</Th><Th>Qty</Th><Th>Unit Price</Th><Th>Subtotal</Th></Tr></Thead>
                <Tbody>
                  {detailItem.items?.map((item, i) => (
                    <Tr key={i}>
                      <Td>{item.product.name}</Td>
                      <Td>{item.quantity}</Td>
                      <Td>{formatCurrency(item.unit_price)}</Td>
                      <Td className="font-semibold">{formatCurrency(item.total_price)}</Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </TableWrapper>
            <div className="flex justify-end items-center gap-2 pt-3 border-t border-gray-100 font-bold text-gray-900">
              <span className="font-normal text-gray-500 text-sm">Grand Total:</span>
              <span>{formatCurrency(detailItem.total_amount)}</span>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Modal */}
      <Modal open={deleteId !== null} onClose={() => setDeleteId(null)} title="Delete Purchase" size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button variant="danger" onClick={() => handleDelete(deleteId!)}>Delete &amp; Reverse Stock</Button>
          </>
        }
      >
        <p className="text-gray-600 text-sm">
          Deleting this purchase will <strong>reverse the stock changes</strong>. Are you sure?
        </p>
      </Modal>
    </AppLayout>
  );
}
