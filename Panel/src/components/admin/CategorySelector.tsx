'use client';

import { useState } from 'react';
import { useCategories } from '@/hooks/useImages';
import type { Category } from '@/lib/types';

interface CategorySelectorProps {
  selectedCategoryId: string | null;
  onSelect: (category: Category | null) => void;
  showAll?: boolean;
}

export default function CategorySelector({
  selectedCategoryId,
  onSelect,
  showAll = true,
}: CategorySelectorProps) {
  const { categories, loading, error, createCategory, deleteCategory } = useCategories();
  const [isCreating, setIsCreating] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;

    try {
      const slug = newCategoryName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

      await createCategory(newCategoryName, slug);
      setNewCategoryName('');
      setIsCreating(false);
    } catch (err) {
      console.error('Error creating category:', err);
    }
  };

  const handleDeleteCategory = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('¿Eliminar esta categoría? Las imágenes asociadas también se eliminarán.')) {
      return;
    }
    
    try {
      await deleteCategory(id);
      if (selectedCategoryId === id) {
        onSelect(null);
      }
    } catch (err) {
      console.error('Error deleting category:', err);
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-10 bg-gray-200 rounded" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500 p-4 bg-red-50 rounded">
        Error cargando categorías: {error.message}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-700">Categorías</h3>
        <button
          onClick={() => setIsCreating(!isCreating)}
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          {isCreating ? 'Cancelar' : '+ Nueva'}
        </button>
      </div>

      {isCreating && (
        <form onSubmit={handleCreateCategory} className="flex gap-2">
          <input
            type="text"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            placeholder="Nombre de categoría"
            className="flex-1 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
          />
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
          >
            Crear
          </button>
        </form>
      )}

      <div className="space-y-1">
        {showAll && (
          <button
            onClick={() => onSelect(null)}
            className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
              selectedCategoryId === null
                ? 'bg-blue-100 text-blue-800 font-medium'
                : 'hover:bg-gray-100 text-gray-700'
            }`}
          >
            Todas las imágenes
          </button>
        )}

        {categories.map((category) => (
          <div
            key={category.id}
            className={`group flex items-center justify-between px-4 py-2 rounded-lg cursor-pointer transition-colors ${
              selectedCategoryId === category.id
                ? 'bg-blue-100 text-blue-800'
                : 'hover:bg-gray-100 text-gray-700'
            }`}
            onClick={() => onSelect(category)}
          >
            <span className={selectedCategoryId === category.id ? 'font-medium' : ''}>
              {category.name}
            </span>
            <button
              onClick={(e) => handleDeleteCategory(category.id, e)}
              className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 p-1"
              title="Eliminar categoría"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        ))}

        {categories.length === 0 && (
          <p className="text-gray-500 text-sm text-center py-4">
            No hay categorías. Crea una para empezar.
          </p>
        )}
      </div>
    </div>
  );
}
