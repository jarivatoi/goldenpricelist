import React, { createContext, useContext, useState, useEffect } from 'react';
import { PriceItem, SortOption } from '../types';
import { dbManager, DBPriceItem } from '../utils/indexedDB';

interface PriceListContextType {
  items: PriceItem[];
  addItem: (name: string, price: number) => Promise<void>;
  updateItem: (id: string, name: string, price: number) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  importItems: (items: PriceItem[]) => Promise<void>;
  searchItems: (query: string) => PriceItem[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  sortOption: SortOption;
  setSortOption: (option: SortOption) => void;
  isLoading: boolean;
  error: string | null;
}

const PriceListContext = createContext<PriceListContextType | undefined>(undefined);

export const usePriceList = () => {
  const context = useContext(PriceListContext);
  if (!context) {
    throw new Error('usePriceList must be used within a PriceListProvider');
  }
  return context;
};

// Helper function to capitalize each word
const capitalizeWords = (str: string): string => {
  return str
    .trim()
    .split(' ')
    .filter(word => word.length > 0)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

// Convert DB item to PriceItem
const dbItemToPriceItem = (dbItem: DBPriceItem): PriceItem => ({
  id: dbItem.id,
  name: dbItem.name,
  price: dbItem.price,
  createdAt: new Date(dbItem.createdAt),
  lastEditedAt: dbItem.lastEditedAt ? new Date(dbItem.lastEditedAt) : undefined
});

// Convert PriceItem to DB item
const priceItemToDBItem = (item: PriceItem): DBPriceItem => ({
  id: item.id,
  name: item.name,
  price: item.price,
  createdAt: item.createdAt.toISOString(),
  lastEditedAt: item.lastEditedAt?.toISOString()
});

export const PriceListProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<PriceItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState<SortOption>('date-desc');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize IndexedDB and load items
  useEffect(() => {
    const initializeDB = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        await dbManager.initDB();
        const dbItems = await dbManager.getAllItems();
        const priceItems = dbItems.map(dbItemToPriceItem);
        
        setItems(priceItems);
        
        console.log(`Loaded ${priceItems.length} items from IndexedDB`);
      } catch (err) {
        console.error('Failed to initialize database:', err);
        setError('Failed to initialize offline storage. The app may not work properly.');
        
        // Fallback to localStorage if IndexedDB fails
        try {
          const savedItems = localStorage.getItem('priceItems');
          if (savedItems) {
            const fallbackItems = JSON.parse(savedItems).map((item: any) => ({
              ...item,
              createdAt: new Date(item.createdAt),
              lastEditedAt: item.lastEditedAt ? new Date(item.lastEditedAt) : undefined
            }));
            setItems(fallbackItems);
            console.log('Loaded fallback data from localStorage');
          }
        } catch (fallbackErr) {
          console.error('Fallback to localStorage also failed:', fallbackErr);
        }
      } finally {
        setIsLoading(false);
      }
    };

    initializeDB();
  }, []);

  const addItem = async (name: string, price: number) => {
    try {
      const capitalizedName = capitalizeWords(name);
      const newItem: PriceItem = {
        id: Date.now().toString(),
        name: capitalizedName,
        price,
        createdAt: new Date()
      };

      // Add to IndexedDB
      await dbManager.addItem(priceItemToDBItem(newItem));
      
      // Update local state
      setItems(prevItems => [newItem, ...prevItems]);
      
      console.log('Item added successfully:', newItem);
    } catch (err) {
      console.error('Failed to add item:', err);
      setError('Failed to add item. Please try again.');
      throw err;
    }
  };

  const updateItem = async (id: string, name: string, price: number) => {
    try {
      const capitalizedName = capitalizeWords(name);
      
      // Update local state first
      setItems(prevItems => 
        prevItems.map(item => 
          item.id === id ? { 
            ...item, 
            name: capitalizedName, 
            price, 
            lastEditedAt: new Date() 
          } : item
        )
      );

      // Find the updated item
      const updatedItem = items.find(item => item.id === id);
      if (updatedItem) {
        const itemToUpdate = {
          ...updatedItem,
          name: capitalizedName,
          price,
          lastEditedAt: new Date()
        };
        
        // Update in IndexedDB
        await dbManager.updateItem(priceItemToDBItem(itemToUpdate));
        
        console.log('Item updated successfully:', itemToUpdate);
      }
    } catch (err) {
      console.error('Failed to update item:', err);
      setError('Failed to update item. Please try again.');
      throw err;
    }
  };

  const deleteItem = async (id: string) => {
    try {
      // Remove from IndexedDB
      await dbManager.deleteItem(id);
      
      // Update local state
      setItems(prevItems => prevItems.filter(item => item.id !== id));
      
      console.log('Item deleted successfully:', id);
    } catch (err) {
      console.error('Failed to delete item:', err);
      setError('Failed to delete item. Please try again.');
      throw err;
    }
  };

  const importItems = async (newItems: PriceItem[]) => {
    try {
      setIsLoading(true);
      
      // Convert to DB format
      const dbItems = newItems.map(priceItemToDBItem);
      
      // Import to IndexedDB (this clears existing data)
      await dbManager.importItems(dbItems);
      
      // Update local state
      setItems(newItems);
      
      console.log(`Successfully imported ${newItems.length} items`);
    } catch (err) {
      console.error('Failed to import items:', err);
      setError('Failed to import items. Please try again.');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const searchItems = (query: string) => {
    if (!query.trim()) return sortItems(items, sortOption);
    
    const lowerCaseQuery = query.toLowerCase();
    const filteredItems = items.filter(item => 
      item.name.toLowerCase().includes(lowerCaseQuery)
    );
    
    return sortItems(filteredItems, sortOption);
  };

  const sortItems = (itemsToSort: PriceItem[], option: SortOption) => {
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

  const value = {
    items,
    addItem,
    updateItem,
    deleteItem,
    importItems,
    searchItems,
    searchQuery,
    setSearchQuery,
    sortOption,
    setSortOption,
    isLoading,
    error
  };

  return (
    <PriceListContext.Provider value={value}>
      {children}
    </PriceListContext.Provider>
  );
};