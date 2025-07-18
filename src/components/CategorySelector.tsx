import React, { useState } from 'react';
import { Plus, Edit, Trash2, Tag } from 'lucide-react';
import { usePriceList } from '../context/PriceListContext';
import { Category } from '../types';

const CategorySelector: React.FC = () => {
  const { 
    categories, 
    selectedCategoryId, 
    setSelectedCategoryId, 
    addCategory, 
    updateCategory, 
    deleteCategory 
  } = usePriceList();
  
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState('#3B82F6');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const predefinedColors = [
    '#3B82F6', // Blue
    '#EF4444', // Red
    '#10B981', // Green
    '#F59E0B', // Yellow
    '#8B5CF6', // Purple
    '#F97316', // Orange
    '#06B6D4', // Cyan
    '#84CC16', // Lime
    '#EC4899', // Pink
    '#6B7280'  // Gray
  ];

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newCategoryName.trim()) return;
    
    try {
      setIsSubmitting(true);
      await addCategory(newCategoryName.trim(), newCategoryColor);
      setNewCategoryName('');
      setNewCategoryColor('#3B82F6');
      setIsAddingCategory(false);
    } catch (err) {
      // Error handled in context
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingCategory || !newCategoryName.trim()) return;
    
    try {
      setIsSubmitting(true);
      await updateCategory(editingCategory.id, newCategoryName.trim(), newCategoryColor);
      setEditingCategory(null);
      setNewCategoryName('');
      setNewCategoryColor('#3B82F6');
    } catch (err) {
      // Error handled in context
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    if (window.confirm('Are you sure you want to delete this category? Items in this category will become uncategorized.')) {
      try {
        await deleteCategory(categoryId);
      } catch (err) {
        // Error handled in context
      }
    }
  };

  const startEditing = (category: Category) => {
    setEditingCategory(category);
    setNewCategoryName(category.name);
    setNewCategoryColor(category.color);
    setIsAddingCategory(false);
  };

  const cancelEditing = () => {
    setEditingCategory(null);
    setIsAddingCategory(false);
    setNewCategoryName('');
    setNewCategoryColor('#3B82F6');
  };

  return (
    <div className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-md mx-auto px-4 py-3">
        {/* Category Pills */}
        <div className="flex flex-wrap gap-2 mb-3">
          {/* All Items */}
          <button
            onClick={() => setSelectedCategoryId(null)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              selectedCategoryId === null
                ? 'bg-gray-800 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All Items
          </button>
          
          {/* Category Pills */}
          {categories.map((category) => (
            <div key={category.id} className="relative group">
              <button
                onClick={() => setSelectedCategoryId(category.id)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  selectedCategoryId === category.id
                    ? 'text-white'
                    : 'text-gray-700 hover:opacity-80'
                }`}
                style={{
                  backgroundColor: selectedCategoryId === category.id ? category.color : `${category.color}20`,
                  borderColor: category.color,
                  borderWidth: selectedCategoryId === category.id ? '0' : '1px'
                }}
              >
                {category.name}
              </button>
              
              {/* Edit/Delete buttons on hover */}
              <div className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    startEditing(category);
                  }}
                  className="w-5 h-5 bg-blue-500 text-white rounded-full flex items-center justify-center hover:bg-blue-600 transition-colors"
                >
                  <Edit size={10} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteCategory(category.id);
                  }}
                  className="w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                >
                  <Trash2 size={10} />
                </button>
              </div>
            </div>
          ))}
          
          {/* Add Category Button */}
          <button
            onClick={() => setIsAddingCategory(true)}
            className="px-3 py-1.5 rounded-full text-sm font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors flex items-center gap-1"
          >
            <Plus size={14} />
            Add Category
          </button>
        </div>

        {/* Add/Edit Category Form */}
        {(isAddingCategory || editingCategory) && (
          <form onSubmit={editingCategory ? handleUpdateCategory : handleAddCategory} className="bg-gray-50 rounded-lg p-3 mb-3">
            <div className="flex items-center gap-2 mb-2">
              <Tag size={16} className="text-gray-500" />
              <span className="text-sm font-medium text-gray-700">
                {editingCategory ? 'Edit Category' : 'New Category'}
              </span>
            </div>
            
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Category name"
                className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                disabled={isSubmitting}
              />
              
              <div className="flex gap-1">
                {predefinedColors.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setNewCategoryColor(color)}
                    className={`w-6 h-6 rounded-full border-2 ${
                      newCategoryColor === color ? 'border-gray-800' : 'border-gray-300'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
            
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={isSubmitting || !newCategoryName.trim()}
                className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-blue-300 transition-colors"
              >
                {isSubmitting ? 'Saving...' : (editingCategory ? 'Update' : 'Add')}
              </button>
              <button
                type="button"
                onClick={cancelEditing}
                disabled={isSubmitting}
                className="px-3 py-1 text-sm bg-gray-300 text-gray-700 rounded hover:bg-gray-400 disabled:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default CategorySelector;