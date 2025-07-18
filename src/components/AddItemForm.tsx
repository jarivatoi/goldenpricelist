import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { usePriceList } from '../context/PriceListContext';

const AddItemForm: React.FC = () => {
  const { addItem } = usePriceList();
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [error, setError] = useState('');
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      setError('Please enter an item name');
      return;
    }
    
    const priceValue = parseFloat(price);
    if (isNaN(priceValue) || priceValue <= 0) {
      setError('Please enter a valid price');
      return;
    }
    
    try {
      setIsSubmitting(true);
      setError('');
      
      // Add the item with price rounded to 2 decimal places
      await addItem(name.trim(), Math.round(priceValue * 100) / 100);
      
      // Reset form
      setName('');
      setPrice('');
      setIsFormVisible(false);
    } catch (err) {
      setError('Failed to add item. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white border-b border-gray-200 shadow-sm sticky top-[60px] z-10">
      <div className="max-w-md mx-auto w-full px-4 py-3">
        {!isFormVisible ? (
          <button
            onClick={() => setIsFormVisible(true)}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 px-4 rounded-lg flex items-center justify-center transition-colors duration-200 shadow-sm"
          >
            <Plus size={20} className="mr-2" />
            <span>Add New Item</span>
          </button>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm p-4 border border-gray-200 w-full">
            <div className="mb-3">
              <label htmlFor="itemName" className="block text-sm font-medium text-gray-700 mb-1">
                Item Name
              </label>
              <input
                id="itemName"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isSubmitting}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
                placeholder="Enter item name"
              />
            </div>
            
            <div className="mb-3">
              <label htmlFor="itemPrice" className="block text-sm font-medium text-gray-700 mb-1">
                Price (Rs)
              </label>
              <input
                id="itemPrice"
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                step="0.01"
                min="0.01"
                disabled={isSubmitting}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
                placeholder="0.00"
              />
            </div>
            
            {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
            
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-md transition-colors duration-200 disabled:bg-blue-300 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Adding...' : 'Add Item'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsFormVisible(false);
                  setName('');
                  setPrice('');
                  setError('');
                }}
                disabled={isSubmitting}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-4 rounded-md transition-colors duration-200 disabled:bg-gray-100 disabled:cursor-not-allowed"
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

export default AddItemForm;