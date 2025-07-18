import React, { useState } from 'react';
import { usePriceList } from '../context/PriceListContext';
import SwipeableItem from './SwipeableItem';
import EditItemModal from './EditItemModal';
import ConfirmationModal from './ConfirmationModal';
import EmptyState from './EmptyState';
import LoadingSpinner from './LoadingSpinner';
import ErrorMessage from './ErrorMessage';
import { PriceItem } from '../types';

const PriceList: React.FC = () => {
  const { items, categories, selectedCategoryId, updateItem, deleteItem, searchItems, searchQuery, sortOption, isLoading, error } = usePriceList();
  const [editingItem, setEditingItem] = useState<PriceItem | null>(null);
  const [deletingItem, setDeletingItem] = useState<PriceItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Get filtered and sorted items
  const getFilteredItems = () => {
    let filtered = items;
    
    // Filter by selected category first
    if (selectedCategoryId) {
      filtered = filtered.filter(item => item.categoryId === selectedCategoryId);
    }
    
    // Apply search if there's a query
    if (searchQuery.trim()) {
      const lowerCaseQuery = searchQuery.toLowerCase();
      filtered = filtered.filter(item => 
        item.name.toLowerCase().includes(lowerCaseQuery)
      );
    }
    
    // Apply sorting
    return sortItems(filtered, sortOption);
  };
  
  // Sort items function
  const sortItems = (itemsToSort: PriceItem[], option: typeof sortOption) => {
    const itemsCopy = [...itemsToSort];
    
    switch (option) {
      case 'name-asc':
        return itemsCopy.sort((a, b) => a.name.localeCompare(b.name));
      case 'name-desc':
        return itemsCopy.sort((a, b) => b.name.localeCompare(a.name));
      case 'price-asc':
        return itemsCopy.sort((a, b) => a.price - b.price);
      case 'price-desc':
        return itemsCopy.sort((a, b) => b.price - a.price);
      case 'date-asc':
        return itemsCopy.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
      case 'date-desc':
        return itemsCopy.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      default:
        return itemsCopy;
    }
  };
  
  const filteredItems = getFilteredItems();
  const selectedCategory = selectedCategoryId ? categories.find(cat => cat.id === selectedCategoryId) : null;
  
  const handleEdit = (item: PriceItem) => {
    setEditingItem(item);
  };
  
  const handleSave = async (id: string, name: string, price: number, categoryId?: string) => {
    try {
      await updateItem(id, name, price, categoryId);
      setEditingItem(null);
    } catch (err) {
      // Error is handled in context
    }
  };
  
  const handleDeleteRequest = (id: string) => {
    const item = items.find(item => item.id === id);
    if (item) {
      setDeletingItem(item);
    }
  };

  const handleConfirmDelete = async () => {
    if (deletingItem) {
      try {
        setIsDeleting(true);
        await deleteItem(deletingItem.id);
        setDeletingItem(null);
      } catch (err) {
        // Error is handled in context
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const handleCancelDelete = () => {
    setDeletingItem(null);
  };

  const handleRetry = () => {
    window.location.reload();
  };

  if (isLoading) {
    return (
      <div 
        className="overflow-y-auto"
        style={{ 
          height: 'calc(100vh - 60px - 84px - 64px)',
          minHeight: '200px'
        }}
      >
        <LoadingSpinner message="Loading your price list..." />
      </div>
    );
  }

  if (error) {
    return (
      <div 
        className="overflow-y-auto"
        style={{ 
          height: 'calc(100vh - 60px - 84px - 64px)',
          minHeight: '200px'
        }}
      >
        <ErrorMessage message={error} onRetry={handleRetry} />
      </div>
    );
  }

  return (
    <div 
      className="overflow-y-auto"
      style={{ 
        height: 'calc(100vh - 60px - 84px - 64px)',
        minHeight: '200px'
      }}
    >
      <div className="max-w-md mx-auto px-4 pb-4">
        <div style={{ height: '20px' }} />
        
        {filteredItems.length === 0 && (
          searchQuery ? (
            <div className="text-center py-8">
              <p className="text-gray-500">
                No items found matching "{searchQuery}"
                {selectedCategory && ` in ${selectedCategory.name}`}
              </p>
            </div>
          ) : selectedCategory ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No items in {selectedCategory.name} category</p>
              <p className="text-gray-400 text-sm mt-1">Add items to this category to see them here</p>
            </div>
          ) : (
            <EmptyState />
          )
        )}
        
        {/* Show category header if filtering by category */}
        {selectedCategory && filteredItems.length > 0 && (
          <div className="mb-4 p-3 rounded-lg" style={{ backgroundColor: `${selectedCategory.color}10` }}>
            <div className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: selectedCategory.color }}
              />
              <span className="font-medium text-gray-800">
                {selectedCategory.name} ({filteredItems.length} items)
              </span>
            </div>
          </div>
        )}
        
        {filteredItems.map((item) => (
          <SwipeableItem
            key={item.id}
            item={item}
            onEdit={handleEdit}
            onDelete={handleDeleteRequest}
          />
        ))}
      </div>
        
      {/* Edit Modal */}
      {editingItem && (
        <EditItemModal
          item={editingItem}
          onClose={() => setEditingItem(null)}
          onSave={handleSave}
        />
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={!!deletingItem}
        title="Delete Item"
        message={`Are you sure you want to delete "${deletingItem?.name}"? This action cannot be undone.`}
        confirmText={isDeleting ? "Deleting..." : "Delete"}
        cancelText="Cancel"
        type="danger"
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />
    </div>
  );
};

export default PriceList;