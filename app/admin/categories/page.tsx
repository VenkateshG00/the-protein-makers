'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit2, ToggleLeft, ToggleRight } from 'lucide-react';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { PageLoader } from '@/components/ui/LoadingSpinner';
import type { Category } from '@/types/database';

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [form, setForm] = useState({ name: '', description: '', display_order: 0 });
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();

  async function fetchCategories() {
    const res = await fetch('/api/categories');
    const data = await res.json();
    setCategories(data);
    setLoading(false);
  }

  useEffect(() => { fetchCategories(); }, []);

  function openCreate() {
    setEditing(null);
    setForm({ name: '', description: '', display_order: categories.length });
    setModalOpen(true);
  }

  function openEdit(cat: Category) {
    setEditing(cat);
    setForm({ name: cat.name, description: cat.description || '', display_order: cat.display_order });
    setModalOpen(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const method = editing ? 'PUT' : 'POST';
    const body = editing ? { id: editing.id, ...form } : form;

    const res = await fetch('/api/categories', {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      showToast(editing ? 'Category updated' : 'Category created');
      setModalOpen(false);
      fetchCategories();
    } else {
      const err = await res.json();
      showToast(err.error || 'Something went wrong', 'error');
    }
    setSaving(false);
  }

  async function toggleActive(cat: Category) {
    await fetch('/api/categories', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: cat.id, is_active: !cat.is_active }),
    });
    showToast(`Category ${cat.is_active ? 'deactivated' : 'activated'}`);
    fetchCategories();
  }

  if (loading) return <PageLoader />;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
          <p className="text-sm text-gray-500 mt-1">Manage meal categories and display order</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="w-4 h-4 mr-2" /> Add Category
        </Button>
      </div>

      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Order</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Name</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Description</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Status</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {categories.map(cat => (
              <tr key={cat.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-500">{cat.display_order}</td>
                <td className="px-4 py-3 font-medium text-gray-900">{cat.name}</td>
                <td className="px-4 py-3 text-gray-600 max-w-xs truncate">{cat.description}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${cat.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                    {cat.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <button onClick={() => openEdit(cat)} className="p-1.5 hover:bg-gray-100 rounded-lg" title="Edit">
                      <Edit2 className="w-4 h-4 text-gray-500" />
                    </button>
                    <button onClick={() => toggleActive(cat)} className="p-1.5 hover:bg-gray-100 rounded-lg" title="Toggle">
                      {cat.is_active ? <ToggleRight className="w-5 h-5 text-green-600" /> : <ToggleLeft className="w-5 h-5 text-gray-400" />}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Category' : 'Add Category'}>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              type="text"
              required
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-green outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-green outline-none"
              rows={3}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Display Order</label>
            <input
              type="number"
              min={0}
              value={form.display_order}
              onChange={e => setForm(f => ({ ...f, display_order: parseInt(e.target.value) || 0 }))}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-green outline-none"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" type="button" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
