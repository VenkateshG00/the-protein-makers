'use client';

import { useState, useEffect } from 'react';
import Badge from '@/components/ui/Badge';
import { PageLoader } from '@/components/ui/LoadingSpinner';
import { formatCurrency } from '@/lib/utils/format';
import { ChefHat } from 'lucide-react';
import type { Meal, Category } from '@/types/database';

export default function CustomerMealsPage() {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedDietary, setSelectedDietary] = useState('');

  useEffect(() => {
    Promise.all([
      fetch('/api/meals').then(r => r.json()),
      fetch('/api/categories').then(r => r.json()),
    ]).then(([mealsData, catsData]) => {
      setMeals(mealsData);
      setCategories(catsData);
      setLoading(false);
    });
  }, []);

  const filtered = meals.filter(m => {
    if (selectedCategory && m.category_id !== selectedCategory) return false;
    if (selectedDietary && m.dietary_tag !== selectedDietary) return false;
    return true;
  });

  if (loading) return <PageLoader />;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Our Menu</h1>
        <p className="text-gray-600 mt-1">Browse our protein-packed meals</p>
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        <button
          onClick={() => setSelectedCategory('')}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${!selectedCategory ? 'bg-brand-green text-white' : 'bg-white border text-gray-600 hover:bg-gray-50'}`}
        >
          All
        </button>
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id === selectedCategory ? '' : cat.id)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${selectedCategory === cat.id ? 'bg-brand-green text-white' : 'bg-white border text-gray-600 hover:bg-gray-50'}`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      <div className="flex gap-2 mb-6">
        {['veg', 'non_veg', 'egg'].map(tag => (
          <button
            key={tag}
            onClick={() => setSelectedDietary(tag === selectedDietary ? '' : tag)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${selectedDietary === tag ? 'bg-brand-green text-white border-brand-green' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
          >
            {tag.replace('_', '-').toUpperCase()}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filtered.map(meal => (
          <div key={meal.id} className="bg-white rounded-xl border overflow-hidden hover:shadow-md transition-shadow">
            <div className="h-40 bg-gradient-to-br from-brand-green/10 to-brand-gold/30 flex items-center justify-center">
              {meal.photo_url ? (
                <img src={meal.photo_url} alt={meal.name} className="w-full h-full object-cover" />
              ) : (
                <ChefHat className="w-12 h-12 text-brand-green/30" />
              )}
            </div>
            <div className="p-4">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold text-gray-900 text-sm">{meal.name}</h3>
                <Badge status={meal.dietary_tag} />
              </div>
              {meal.description && (
                <p className="text-xs text-gray-500 mb-3 line-clamp-2">{meal.description}</p>
              )}
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold text-brand-green">{formatCurrency(meal.price)}</span>
                <div className="text-xs text-gray-500">
                  <span className="font-medium text-brand-green">{meal.protein_grams}g</span> protein | {meal.calories} kcal
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          No meals found for the selected filters.
        </div>
      )}
    </div>
  );
}
