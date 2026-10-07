'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit2, ToggleLeft, ToggleRight } from 'lucide-react';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Badge from '@/components/ui/Badge';
import { useToast } from '@/components/ui/Toast';
import { PageLoader } from '@/components/ui/LoadingSpinner';
import { formatCurrency } from '@/lib/utils/format';
import type { Meal, Category, DietaryTag, MealType } from '@/types/database';

const mealTypes = [
  { value: 'breakfast', label: 'Breakfast' },
  { value: 'lunch', label: 'Lunch' },
  { value: 'dinner', label: 'Dinner' },
  { value: 'snack', label: 'Snack' },
  { value: 'pre_workout', label: 'Pre-Workout' },
  { value: 'add_on', label: 'Add-On' },
];

const dietaryTags = [
  { value: 'veg', label: 'Veg' },
  { value: 'non_veg', label: 'Non-Veg' },
  { value: 'egg', label: 'Egg' },
];

const emptyForm = {
  category_id: '',
  name: '',
  description: '',
  price: 0,
  protein_grams: 0,
  calories: 0,
  ingredients: '',
  dietary_tag: 'non_veg' as DietaryTag,
  meal_type: 'lunch' as MealType,
  preparation_time_minutes: 30,
  is_available: true,
};

export default function MealsPage() {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Meal | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [filterCategory, setFilterCategory] = useState('');
  const [filterDietary, setFilterDietary] = useState('');
  const { showToast } = useToast();

  async function fetchData() {
    const [mealsRes, catsRes] = await Promise.all([
      fetch('/api/meals'),
      fetch('/api/categories'),
    ]);
    setMeals(await mealsRes.json());
    setCategories(await catsRes.json());
    setLoading(false);
  }

  useEffect(() => { fetchData(); }, []);

  function openCreate() {
    setEditing(null);
    setForm({ ...emptyForm, category_id: categories[0]?.id || '' });
    setModalOpen(true);
  }

  function openEdit(meal: Meal) {
    setEditing(meal);
    setForm({
      category_id: meal.category_id,
      name: meal.name,
      description: meal.description || '',
      price: meal.price,
      protein_grams: meal.protein_grams,
      calories: meal.calories,
      ingredients: meal.ingredients || '',
      dietary_tag: meal.dietary_tag,
      meal_type: meal.meal_type,
      preparation_time_minutes: meal.preparation_time_minutes || 30,
      is_available: meal.is_available,
    });
    setModalOpen(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const method = editing ? 'PUT' : 'POST';
    const body = editing ? { id: editing.id, ...form } : form;

    const res = await fetch('/api/meals', {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      showToast(editing ? 'Meal updated' : 'Meal created');
      setModalOpen(false);
      fetchData();
    } else {
      const err = await res.json();
      showToast(err.error || 'Something went wrong', 'error');
    }
    setSaving(false);
  }

  async function toggleActive(meal: Meal) {
    await fetch('/api/meals', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: meal.id, is_active: !meal.is_active }),
    });
    showToast(`Meal ${meal.is_active ? 'deactivated' : 'activated'}`);
    fetchData();
  }

  const filteredMeals = meals.filter(m => {
    if (filterCategory && m.category_id !== filterCategory) return false;
    if (filterDietary && m.dietary_tag !== filterDietary) return false;
    return true;
  });

  if (loading) return <PageLoader />;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Meals</h1>
          <p className="text-sm text-gray-500 mt-1">{meals.length} meals in the menu</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="w-4 h-4 mr-2" /> Add Meal
        </Button>
      </div>

      <div className="flex gap-3 mb-4">
        <select
          value={filterCategory}
          onChange={e => setFilterCategory(e.target.value)}
          className="px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-brand-green outline-none"
        >
          <option value="">All Categories</option>
          {categories.map(cat => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>
        <select
          value={filterDietary}
          onChange={e => setFilterDietary(e.target.value)}
          className="px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-brand-green outline-none"
        >
          <option value="">All Dietary</option>
          {dietaryTags.map(d => (
            <option key={d.value} value={d.value}>{d.label}</option>
          ))}
        </select>
      </div>

      <div className="bg-white rounded-xl border overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Name</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Category</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Price</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Protein</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Calories</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Tag</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Type</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filteredMeals.map(meal => (
              <tr key={meal.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{meal.name}</td>
                <td className="px-4 py-3 text-gray-600">{meal.category?.name}</td>
                <td className="px-4 py-3 text-gray-900">{formatCurrency(meal.price)}</td>
                <td className="px-4 py-3 text-gray-600">{meal.protein_grams}g</td>
                <td className="px-4 py-3 text-gray-600">{meal.calories} kcal</td>
                <td className="px-4 py-3"><Badge status={meal.dietary_tag} /></td>
                <td className="px-4 py-3 text-gray-600 capitalize">{meal.meal_type.replace('_', ' ')}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <button onClick={() => openEdit(meal)} className="p-1.5 hover:bg-gray-100 rounded-lg">
                      <Edit2 className="w-4 h-4 text-gray-500" />
                    </button>
                    <button onClick={() => toggleActive(meal)} className="p-1.5 hover:bg-gray-100 rounded-lg">
                      {meal.is_active ? <ToggleRight className="w-5 h-5 text-green-600" /> : <ToggleLeft className="w-5 h-5 text-gray-400" />}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Meal' : 'Add Meal'} size="xl">
        <form onSubmit={handleSave} className="space-y-4 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Meal Name</label>
              <input
                type="text" required value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-green outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                required value={form.category_id}
                onChange={e => setForm(f => ({ ...f, category_id: e.target.value }))}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-green outline-none"
              >
                <option value="">Select category</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Price (₹)</label>
              <input
                type="number" required min={0} step={0.01} value={form.price}
                onChange={e => setForm(f => ({ ...f, price: parseFloat(e.target.value) || 0 }))}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-green outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Protein (g)</label>
              <input
                type="number" min={0} step={0.1} value={form.protein_grams}
                onChange={e => setForm(f => ({ ...f, protein_grams: parseFloat(e.target.value) || 0 }))}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-green outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Calories</label>
              <input
                type="number" min={0} value={form.calories}
                onChange={e => setForm(f => ({ ...f, calories: parseInt(e.target.value) || 0 }))}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-green outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Dietary Tag</label>
              <select
                value={form.dietary_tag}
                onChange={e => setForm(f => ({ ...f, dietary_tag: e.target.value as typeof form.dietary_tag }))}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-green outline-none"
              >
                {dietaryTags.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Meal Type</label>
              <select
                value={form.meal_type}
                onChange={e => setForm(f => ({ ...f, meal_type: e.target.value as typeof form.meal_type }))}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-green outline-none"
              >
                {mealTypes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Prep Time (min)</label>
              <input
                type="number" min={1} value={form.preparation_time_minutes}
                onChange={e => setForm(f => ({ ...f, preparation_time_minutes: parseInt(e.target.value) || 30 }))}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-green outline-none"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-green outline-none"
                rows={2}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Ingredients</label>
              <textarea
                value={form.ingredients}
                onChange={e => setForm(f => ({ ...f, ingredients: e.target.value }))}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-green outline-none"
                rows={2}
                placeholder="Comma-separated list of ingredients"
              />
            </div>
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
