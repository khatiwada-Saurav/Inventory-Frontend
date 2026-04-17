"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Table, Thead, Tbody, Tr, Th, Td, TableWrapper, Badge } from "@/components/ui/Table";
import { Button } from "@/components/ui/Button";
import { Input, Textarea, Select } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Pagination } from "@/components/ui/Pagination";
import { PageSpinner } from "@/components/ui/Spinner";
import api from "@/lib/api";
import toast from "react-hot-toast";
import Image from "next/image";
import { isAdmin } from "@/lib/auth";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Category { id: string; name: string; }

interface Product {
  id: string;
  name: string;
  sku: string | null;
  barcode: string | null;
  cost_price: number | null;
  selling_price: number;
  stock_quantity: number;
  min_stock_alert: number;
  image: string | null;
  description: string | null;
  category: Category | null;
  is_low_stock: boolean;
}

interface Meta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatCurrency(n: number | null) {
  if (n === null) return "—";
  return `Rs. ${n.toLocaleString("en-IN")}`;
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ProductsPage() {
  const admin = isAdmin();
  const [products,       setProducts]       = useState<Product[]>([]);
  const [meta,           setMeta]           = useState<Meta>({ current_page: 1, last_page: 1, per_page: 15, total: 0 });
  const [categories,     setCategories]     = useState<Category[]>([]);
  const [loading,        setLoading]        = useState(true);
  const [search,         setSearch]         = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [page,           setPage]           = useState(1);
  const [modalOpen,      setModalOpen]      = useState(false);
  const [deleteId,       setDeleteId]       = useState<string | null>(null);
  const [editItem,       setEditItem]       = useState<Product | null>(null);
  const [imageModalId,   setImageModalId]   = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "", sku: "", barcode: "", category_id: "",
    cost_price: "", selling_price: "",
    stock_quantity: "0", min_stock_alert: "5", description: "",
  });
  const [formErrors,     setFormErrors]     = useState<Record<string, string>>({});
  const [saving,         setSaving]         = useState(false);
  const [imageFile,      setImageFile]      = useState<File | null>(null);
  const [imagePreview,   setImagePreview]   = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // ── Data loading ─────────────────────────────────────────────────────────────

  const load = useCallback(async (p: number, s: string, cat: string) => {
    setLoading(true);
    try {
      let url = `/products?page=${p}`;
      if (s)   url += `&search=${encodeURIComponent(s)}`;
      if (cat) url += `&category_id=${cat}`;
      const res = (await api.get(url)) as {
        data: Product[]; current_page: number; last_page: number; total: number; per_page: number;
      };
      setProducts(res.data ?? []);
      setMeta({ current_page: res.current_page ?? 1, last_page: res.last_page ?? 1, per_page: res.per_page ?? 15, total: res.total ?? 0 });
    } catch {
      toast.error("Failed to load products");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    api.get("/categories").then((res: unknown) => {
      setCategories((res as { data: Category[] }).data ?? []);
    });
  }, []);

  const initialLoadDone = useRef(false);
  useEffect(() => {
    if (initialLoadDone.current) return;
    initialLoadDone.current = true;
    load(1, "", "");
  }, [load]);

  const isFirstFilterRender = useRef(true);
  useEffect(() => {
    if (isFirstFilterRender.current) { isFirstFilterRender.current = false; return; }
    const t = setTimeout(() => { setPage(1); load(1, search, categoryFilter); }, 300);
    return () => clearTimeout(t);
  }, [search, categoryFilter, load]);

  const handlePageChange = (newPage: number) => { setPage(newPage); load(newPage, search, categoryFilter); };

  // ── Modal helpers ─────────────────────────────────────────────────────────────

  const openCreate = () => {
    setEditItem(null);
    setForm({ name: "", sku: "", barcode: "", category_id: "", cost_price: "", selling_price: "", stock_quantity: "0", min_stock_alert: "5", description: "" });
    setFormErrors({});
    setImageFile(null);
    setImagePreview(null);
    setModalOpen(true);
  };

  const openEdit = (p: Product) => {
    setEditItem(p);
    setForm({
      name:            p.name,
      sku:             p.sku        || "",
      barcode:         p.barcode    || "",
      category_id:     p.category?.id || "",
      cost_price:      p.cost_price?.toString()  || "",
      selling_price:   p.selling_price.toString(),
      stock_quantity:  p.stock_quantity.toString(),
      min_stock_alert: p.min_stock_alert.toString(),
      description:     p.description || "",
    });
    setFormErrors({});
    setImageFile(null);
    setImagePreview(null);
    setModalOpen(true);
  };

  // ── Save ──────────────────────────────────────────────────────────────────────

  const handleSave = async () => {
    setFormErrors({});
    setSaving(true);
    let productSaved = false;
    let savedId = "";
    try {
      const payload = {
        name:            form.name,
        sku:             form.sku        || undefined,
        barcode:         form.barcode    || undefined,
        category_id:     form.category_id || undefined,
        cost_price:      form.cost_price  ? Number.parseFloat(form.cost_price)  : undefined,
        selling_price:   Number.parseFloat(form.selling_price),
        stock_quantity:  Number.parseInt(form.stock_quantity),
        min_stock_alert: Number.parseInt(form.min_stock_alert),
        description:     form.description || undefined,
      };
      if (editItem) {
        await api.put(`/products/${editItem.id}`, payload);
        savedId = editItem.id;
        toast.success("Product updated");
      } else {
        const res = (await api.post("/products", payload)) as { id: string };
        savedId = res.id;
        toast.success("Product created");
      }
      productSaved = true;
      if (imageFile && savedId) {
        const fd = new FormData();
        fd.append("image", imageFile);
        await api.post(`/products/${savedId}/image`, fd, { headers: { "Content-Type": undefined } } as Record<string, unknown>);
      }
      setModalOpen(false);
    } catch (err: unknown) {
      const e = err as { errors?: Record<string, string[]>; message?: string };
      if (e?.errors) {
        const fe: Record<string, string> = {};
        Object.entries(e.errors).forEach(([k, v]) => { fe[k] = v[0]; });
        setFormErrors(fe);
      } else if (productSaved) {
        toast.error("Product saved, but image upload failed");
        setModalOpen(false);
      } else {
        toast.error(e?.message || "Failed to save product");
      }
    } finally {
      setSaving(false);
      if (productSaved) load(page, search, categoryFilter);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/products/${id}`);
      toast.success("Product deleted");
      setDeleteId(null);
      load(page, search, categoryFilter);
    } catch {
      toast.error("Failed to delete product");
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleUploadImage = async (productId: string) => {
    if (!imageFile) return;
    setUploadingImage(true);
    try {
      const fd = new FormData();
      fd.append("image", imageFile);
      await api.post(`/products/${productId}/image`, fd, { headers: { "Content-Type": undefined } } as Record<string, unknown>);
      toast.success("Image uploaded");
      setImageModalId(null);
      setImageFile(null);
      setImagePreview(null);
      load(page, search, categoryFilter);
    } catch {
      toast.error("Failed to upload image");
    } finally {
      setUploadingImage(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <AppLayout title="Products">
      <Card>
        <CardHeader>
          <CardTitle>Products ({meta.total})</CardTitle>
          {admin && <Button onClick={openCreate}>+ Add Product</Button>}
        </CardHeader>

        <div className="flex gap-2 mb-4 flex-wrap items-end">
          <Input
            placeholder="Search products…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-[260px]"
          />
          <Select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-[200px]"
          >
            <option value="">All Categories</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
        </div>

        {loading ? (
          <PageSpinner />
        ) : (
          <>
            <TableWrapper>
              <Table>
                <Thead>
                  <Tr>
                    <Th>Product</Th>
                    <Th>SKU</Th>
                    <Th>Category</Th>
                    <Th>Cost</Th>
                    <Th>Price</Th>
                    <Th>Stock</Th>
                    {admin && <Th>Actions</Th>}
                  </Tr>
                </Thead>
                <Tbody>
                  {products.length ? products.map((p) => (
                    <Tr key={p.id}>
                      <Td>
                        <div className="flex items-center gap-2.5">
                          <div className="w-10 h-10 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0 flex items-center justify-center text-lg">
                            {p.image ? (
                              <Image src={p.image} alt={p.name} width={40} height={40} className="object-cover w-full h-full" />
                            ) : "📦"}
                          </div>
                          <div>
                            <div className="font-semibold text-sm">{p.name}</div>
                            {p.barcode && <div className="text-[11px] text-gray-400">#{p.barcode}</div>}
                          </div>
                        </div>
                      </Td>
                      <Td className="text-gray-500 font-mono text-xs">{p.sku || "—"}</Td>
                      <Td>{p.category ? <Badge variant="info">{p.category.name}</Badge> : "—"}</Td>
                      <Td className="text-gray-500">{formatCurrency(p.cost_price)}</Td>
                      <Td className="font-semibold">{formatCurrency(p.selling_price)}</Td>
                      <Td>
                        <Badge variant={p.is_low_stock ? "danger" : p.stock_quantity > 10 ? "success" : "warning"}>
                          {p.stock_quantity} units
                        </Badge>
                      </Td>
                      {admin && (
                        <Td>
                          <div className="flex gap-1">
                            <Button size="sm" variant="ghost" onClick={() => openEdit(p)}>✏️</Button>
                            <Button size="sm" variant="ghost" onClick={() => { setImageModalId(p.id); setImageFile(null); setImagePreview(null); }}>🖼️</Button>
                            <Button size="sm" variant="danger" onClick={() => setDeleteId(p.id)}>🗑️</Button>
                          </div>
                        </Td>
                      )}
                    </Tr>
                  )) : (
                    <tr><td colSpan={7} className="px-4 py-10 text-center text-sm text-gray-400">No products found</td></tr>
                  )}
                </Tbody>
              </Table>
            </TableWrapper>
            {meta.last_page > 1 && <Pagination meta={meta} onPageChange={handlePageChange} />}
          </>
        )}
      </Card>

      {/* Create / Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editItem ? "Edit Product" : "Add Product"}
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} loading={saving}>{saving ? "Saving…" : "Save Product"}</Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Product Name *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. HP Laptop 15" error={formErrors.name} />
            <Select label="Category" value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })} error={formErrors.category_id}>
              <option value="">Select category</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="SKU" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} placeholder="e.g. HP-LAP-001" error={formErrors.sku} />
            <Input label="Barcode" value={form.barcode} onChange={(e) => setForm({ ...form, barcode: e.target.value })} placeholder="e.g. 1234567890" error={formErrors.barcode} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Cost Price (Rs.)" type="number" value={form.cost_price} onChange={(e) => setForm({ ...form, cost_price: e.target.value })} placeholder="70000" error={formErrors.cost_price} />
            <Input label="Selling Price (Rs.) *" type="number" value={form.selling_price} onChange={(e) => setForm({ ...form, selling_price: e.target.value })} placeholder="85000" error={formErrors.selling_price} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Stock Quantity" type="number" value={form.stock_quantity} onChange={(e) => setForm({ ...form, stock_quantity: e.target.value })} error={formErrors.stock_quantity} />
            <Input label="Min Stock Alert" type="number" value={form.min_stock_alert} onChange={(e) => setForm({ ...form, min_stock_alert: e.target.value })} error={formErrors.min_stock_alert} />
          </div>
          <Textarea label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Optional product description…" error={formErrors.description} />
          {!editItem && (
            <div>
              <span className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Product Image (optional)</span>
              <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-xl p-6 cursor-pointer gap-2 text-gray-500 text-sm hover:border-primary-400 hover:text-primary-600 transition-colors">
                <input type="file" accept="image/*" ref={imageInputRef} onChange={handleImageChange} className="hidden" />
                {imagePreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={imagePreview} alt="Preview" className="w-20 h-20 rounded-lg object-cover" />
                ) : (
                  <><span className="text-3xl">🖼️</span><span>Click to upload image</span></>
                )}
              </label>
            </div>
          )}
        </div>
      </Modal>

      {/* Image Upload Modal */}
      <Modal
        open={imageModalId !== null}
        onClose={() => setImageModalId(null)}
        title="Upload Product Image"
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setImageModalId(null)}>Cancel</Button>
            <Button onClick={() => imageModalId && handleUploadImage(imageModalId)} loading={uploadingImage} disabled={!imageFile}>Upload</Button>
          </>
        }
      >
        <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-xl p-6 cursor-pointer gap-2 text-gray-500 text-sm hover:border-primary-400 hover:text-primary-600 transition-colors">
          <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
          {imagePreview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imagePreview} alt="Preview" className="w-28 h-28 rounded-lg object-cover" />
          ) : (
            <><span className="text-4xl">🖼️</span><span>Click to select an image</span></>
          )}
        </label>
      </Modal>

      {/* Delete Modal */}
      <Modal
        open={deleteId !== null}
        onClose={() => setDeleteId(null)}
        title="Delete Product"
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button variant="danger" onClick={() => deleteId && handleDelete(deleteId)}>Delete</Button>
          </>
        }
      >
        <p className="text-gray-600 text-sm">Are you sure you want to delete this product? This cannot be undone.</p>
      </Modal>
    </AppLayout>
  );
}
