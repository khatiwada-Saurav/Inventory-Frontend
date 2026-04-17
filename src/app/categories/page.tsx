"use client";
import { useEffect, useState, useCallback } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Table, Thead, Tbody, Tr, Th, Td, TableWrapper } from "@/components/ui/Table";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { PageSpinner } from "@/components/ui/Spinner";
import api from "@/lib/api";
import toast from "react-hot-toast";
import { isAdmin } from "@/lib/auth";

interface Category {
  id: number;
  name: string;
  description: string | null;
  created_at: string;
}

export default function CategoriesPage() {
  const admin = isAdmin();
  const [categories, setCategories] = useState<Category[]>([]);
  const [filtered,   setFiltered]   = useState<Category[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState("");
  const [modalOpen,  setModalOpen]  = useState(false);
  const [deleteId,   setDeleteId]   = useState<number | null>(null);
  const [editItem,   setEditItem]   = useState<Category | null>(null);
  const [form,       setForm]       = useState({ name: "", description: "" });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [saving,     setSaving]     = useState(false);

  const load = useCallback(async () => {
    try {
      const res = (await api.get("/categories")) as { data: Category[] };
      const data = res.data ?? [];
      setCategories(data);
      setFiltered(data);
    } catch {
      toast.error("Failed to load categories");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(
      categories.filter(
        (c) => c.name.toLowerCase().includes(q) || (c.description || "").toLowerCase().includes(q),
      ),
    );
  }, [search, categories]);

  const openCreate = () => {
    setEditItem(null);
    setForm({ name: "", description: "" });
    setFormErrors({});
    setModalOpen(true);
  };

  const openEdit = (cat: Category) => {
    setEditItem(cat);
    setForm({ name: cat.name, description: cat.description || "" });
    setFormErrors({});
    setModalOpen(true);
  };

  const handleSave = async () => {
    setFormErrors({});
    setSaving(true);
    try {
      if (editItem) {
        await api.put(`/categories/${editItem.id}`, form);
        toast.success("Category updated");
      } else {
        await api.post("/categories", form);
        toast.success("Category created");
      }
      setModalOpen(false);
      load();
    } catch (err: unknown) {
      const e = err as { errors?: Record<string, string[]> };
      if (e?.errors) {
        const fe: Record<string, string> = {};
        Object.entries(e.errors).forEach(([k, v]) => { fe[k] = v[0]; });
        setFormErrors(fe);
      } else {
        toast.error("Failed to save category");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/categories/${id}`);
      toast.success("Category deleted");
      setDeleteId(null);
      load();
    } catch {
      toast.error("Failed to delete category");
    }
  };

  if (loading) return <AppLayout title="Categories"><PageSpinner /></AppLayout>;

  return (
    <AppLayout title="Categories">
      <Card>
        <CardHeader>
          <CardTitle>Categories ({categories.length})</CardTitle>
          {admin && <Button onClick={openCreate}>+ Add Category</Button>}
        </CardHeader>

        <div className="flex gap-2 mb-4">
          <Input
            placeholder="Search categories…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-xs"
          />
        </div>

        <TableWrapper>
          <Table>
            <Thead>
              <Tr>
                <Th>#</Th>
                <Th>Name</Th>
                <Th>Description</Th>
                <Th>Created</Th>
                {admin && <Th>Actions</Th>}
              </Tr>
            </Thead>
            <Tbody>
              {filtered.length ? (
                filtered.map((cat, i) => (
                  <Tr key={cat.id}>
                    <Td className="text-gray-400 w-10">{i + 1}</Td>
                    <Td className="font-semibold">{cat.name}</Td>
                    <Td className="text-gray-500">{cat.description || "—"}</Td>
                    <Td className="text-gray-400 text-xs">
                      {new Date(cat.created_at).toLocaleDateString()}
                    </Td>
                    {admin && (
                      <Td>
                        <div className="flex gap-2">
                          <Button size="sm" variant="ghost" onClick={() => openEdit(cat)}>✏️ Edit</Button>
                          <Button size="sm" variant="danger" onClick={() => setDeleteId(cat.id)}>🗑️ Delete</Button>
                        </div>
                      </Td>
                    )}
                  </Tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-sm text-gray-400">No categories found</td>
                </tr>
              )}
            </Tbody>
          </Table>
        </TableWrapper>
      </Card>

      {/* Create / Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editItem ? "Edit Category" : "Add Category"}
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} loading={saving}>{saving ? "Saving…" : "Save"}</Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <Input
            label="Category Name *"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="e.g. Electronics"
            error={formErrors.name}
          />
          <Textarea
            label="Description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Optional description…"
            error={formErrors.description}
          />
        </div>
      </Modal>

      {/* Delete Confirm Modal */}
      <Modal
        open={deleteId !== null}
        onClose={() => setDeleteId(null)}
        title="Delete Category"
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button variant="danger" onClick={() => handleDelete(deleteId!)}>Delete</Button>
          </>
        }
      >
        <p className="text-gray-600 text-sm">
          Are you sure you want to delete this category? This action cannot be undone.
        </p>
      </Modal>
    </AppLayout>
  );
}
