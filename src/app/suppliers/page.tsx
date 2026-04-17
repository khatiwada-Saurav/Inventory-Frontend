'use client';
import { useEffect, useState, useCallback } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Table, Thead, Tbody, Tr, Th, Td, TableWrapper } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { PageSpinner } from '@/components/ui/Spinner';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { isAdmin } from '@/lib/auth';

interface Supplier {
  id: number;
  name: string;
  contact_person: string | null;
  contact_number: string | null;
  email: string | null;
  address: string | null;
}

export default function SuppliersPage() {
  const admin = isAdmin();
  const [suppliers,  setSuppliers]  = useState<Supplier[]>([]);
  const [filtered,   setFiltered]   = useState<Supplier[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState('');
  const [modalOpen,  setModalOpen]  = useState(false);
  const [deleteId,   setDeleteId]   = useState<number | null>(null);
  const [editItem,   setEditItem]   = useState<Supplier | null>(null);
  const [form,       setForm]       = useState({ name: '', contact_person: '', contact_number: '', email: '', address: '' });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [saving,     setSaving]     = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await api.get('/suppliers') as { data: Supplier[] };
      const data = res.data ?? [];
      setSuppliers(data);
      setFiltered(data);
    } catch {
      toast.error('Failed to load suppliers');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(suppliers.filter(s =>
      s.name.toLowerCase().includes(q) ||
      (s.contact_person || '').toLowerCase().includes(q) ||
      (s.contact_number || '').includes(q),
    ));
  }, [search, suppliers]);

  const openCreate = () => {
    setEditItem(null);
    setForm({ name: '', contact_person: '', contact_number: '', email: '', address: '' });
    setFormErrors({});
    setModalOpen(true);
  };

  const openEdit = (s: Supplier) => {
    setEditItem(s);
    setForm({
      name:           s.name,
      contact_person: s.contact_person || '',
      contact_number: s.contact_number || '',
      email:          s.email || '',
      address:        s.address || '',
    });
    setFormErrors({});
    setModalOpen(true);
  };

  const handleSave = async () => {
    setFormErrors({});
    setSaving(true);
    try {
      if (editItem) {
        await api.put(`/suppliers/${editItem.id}`, form);
        toast.success('Supplier updated');
      } else {
        await api.post('/suppliers', form);
        toast.success('Supplier created');
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
        toast.error('Failed to save supplier');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/suppliers/${id}`);
      toast.success('Supplier deleted');
      setDeleteId(null);
      load();
    } catch {
      toast.error('Failed to delete supplier');
    }
  };

  if (loading) return <AppLayout title="Suppliers"><PageSpinner /></AppLayout>;

  return (
    <AppLayout title="Suppliers">
      <Card>
        <CardHeader>
          <CardTitle>Suppliers ({suppliers.length})</CardTitle>
          {admin && <Button onClick={openCreate}>+ Add Supplier</Button>}
        </CardHeader>

        <div className="flex gap-2 mb-4">
          <Input
            placeholder="Search suppliers…"
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
                <Th>Company Name</Th>
                <Th>Contact Person</Th>
                <Th>Phone</Th>
                <Th>Email</Th>
                <Th>Address</Th>
                {admin && <Th>Actions</Th>}
              </Tr>
            </Thead>
            <Tbody>
              {filtered.length ? filtered.map((sup, i) => (
                <Tr key={sup.id}>
                  <Td className="text-gray-400 w-10">{i + 1}</Td>
                  <Td className="font-semibold">{sup.name}</Td>
                  <Td>{sup.contact_person || '—'}</Td>
                  <Td>{sup.contact_number || '—'}</Td>
                  <Td className="text-primary-600">{sup.email || '—'}</Td>
                  <Td className="text-gray-500 max-w-[160px] truncate">{sup.address || '—'}</Td>
                  {admin && (
                    <Td>
                      <div className="flex gap-2">
                        <Button size="sm" variant="ghost" onClick={() => openEdit(sup)}>✏️ Edit</Button>
                        <Button size="sm" variant="danger" onClick={() => setDeleteId(sup.id)}>🗑️</Button>
                      </div>
                    </Td>
                  )}
                </Tr>
              )) : (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-sm text-gray-400">No suppliers found</td>
                </tr>
              )}
            </Tbody>
          </Table>
        </TableWrapper>
      </Card>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editItem ? 'Edit Supplier' : 'Add Supplier'}
        size="md"
        footer={
          <>
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} loading={saving}>{saving ? 'Saving…' : 'Save'}</Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <Input
            label="Company Name *"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="e.g. Tech Distributors Pvt Ltd"
            error={formErrors.name}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Contact Person"
              value={form.contact_person}
              onChange={(e) => setForm({ ...form, contact_person: e.target.value })}
              placeholder="e.g. Ram Bahadur"
              error={formErrors.contact_person}
            />
            <Input
              label="Phone"
              value={form.contact_number}
              onChange={(e) => setForm({ ...form, contact_number: e.target.value })}
              placeholder="9800000000"
              error={formErrors.contact_number}
            />
          </div>
          <Input
            label="Email"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="supplier@example.com"
            error={formErrors.email}
          />
          <Textarea
            label="Address"
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            placeholder="Kathmandu, Nepal"
            error={formErrors.address}
          />
        </div>
      </Modal>

      <Modal
        open={deleteId !== null}
        onClose={() => setDeleteId(null)}
        title="Delete Supplier"
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button variant="danger" onClick={() => handleDelete(deleteId!)}>Delete</Button>
          </>
        }
      >
        <p className="text-gray-600 text-sm">Are you sure you want to delete this supplier? This action cannot be undone.</p>
      </Modal>
    </AppLayout>
  );
}
