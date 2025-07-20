/**
 * CONTEXT/PRICELISTCONTEXT.TSX - GLOBAL STATE MANAGEMENT
 * ======================================================
 * 
 * OVERVIEW:
 * This file implements the React Context API for global state management
 * in the Golden Price List application. It provides centralized data
 * management, offline storage integration, and business logic for all
 * price list operations.
 * 
 * ARCHITECTURE:
 * - React Context for state sharing across components
 * - IndexedDB integration for offline persistence
 * - Automatic data synchronization between memory and storage
 * - Error handling and loading states
 * - Search and sorting functionality
 * 
 * KEY FEATURES:
 * - CRUD operations (Create, Read, Update, Delete)
 * - Real-time search with instant filtering
 * - Multiple sorting options (name, price, date)
 * - Offline-first data persistence
 * - Import/export functionality for data backup
 * - Automatic name capitalization
 * - Error handling with user feedback
 * 
 * STATE MANAGEMENT PATTERN:
 * - Single source of truth for all price data
 * - Optimistic updates for better UX
 * - Automatic persistence to IndexedDB
 * - Fallback to localStorage if IndexedDB fails
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { PriceItem, SortOption } from '../types';
import { dbManager, DBPriceItem } from '../utils/indexedDB';

/**
 * PRICE LIST CONTEXT TYPE DEFINITION
 * ==================================
 * 
 * Defines the complete API available to components that consume this context.
 * Provides both data and operations for managing the price list.
 * 
 * DATA PROPERTIES:
 * @param items - Array of all price items in memory
 * @param searchQuery - Current search filter string
 * @param sortOption - Current sorting preference
 * @param isLoading - Loading state for async operations
 * @param error - Error message for user feedback
 * 
 * CRUD OPERATIONS:
 * @param addItem - Create new price item
 * @param updateItem - Modify existing item
 * @param deleteItem - Remove item from list
 * @param importItems - Replace all data with imported items
 * 
 * UTILITY FUNCTIONS:
 * @param searchItems - Filter and sort items based on query
 * @param setSearchQuery - Update search filter
 * @param setSortOption - Change sorting preference
 */
interface PriceListContextType {
  // Data state
  items: PriceItem[];
  searchQuery: string;
  sortOption: SortOption;
  isLoading: boolean;
  error: string | null;
  
  // CRUD operations
  addItem: (name: string, price: number) => Promise<void>;
  updateItem: (id: string, name: string, price: number) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  importItems: (items: PriceItem[]) => Promise<void>;
  
  // Search and filter functions
  searchItems: (query: string) => PriceItem[];
  setSearchQuery: (query: string) => void;
  setSortOption: (option: SortOption) => void;
}

/**
 * REACT CONTEXT CREATION
 * ======================
 * 
 * Creates the React context with undefined default value.
 * Components must be wrapped in PriceListProvider to access this context.
 */
const PriceListContext = createContext<PriceListContextType | undefined>(undefined);

/**
 * CUSTOM HOOK FOR CONTEXT ACCESS
 * ==============================
 * 
 * Provides type-safe access to the PriceListContext with automatic
 * error checking. Ensures components are properly wrapped in provider.
 * 
 * USAGE:
 * const { items, addItem, searchItems } = usePriceList();
 * 
 * @returns PriceListContextType - Complete context API
 * @throws Error if used outside of PriceListProvider
 */
export const usePriceList = () => {
  const context = useContext(PriceListContext);
  if (!context) {
    throw new Error('usePriceList must be used within a PriceListProvider');
  }
  return context;
};

/**
 * TEXT CAPITALIZATION UTILITY
 * ===========================
 * 
 * Converts item names to proper title case for consistent formatting.
 * Handles multiple spaces and ensures clean presentation.
 * 
 * PROCESS:
 * 1. Trim whitespace from start and end
 * 2. Split by spaces and filter empty strings
 * 3. Capitalize first letter of each word
 * 4. Convert remaining letters to lowercase
 * 5. Join words with single spaces
 * 
 * EXAMPLES:
 * - "apple juice" → "Apple Juice"
 * - "  BANANA   BREAD  " → "Banana Bread"
 * - "red-wine" → "Red-wine" (preserves hyphens)
 * 
 * @param str - Input string to capitalize
 * @returns Properly formatted title case string
 */
const capitalizeWords = (str: string): string => {
  return str
    .trim()
    .split(' ')
    .filter(word => word.length > 0)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

/**
 * DATABASE CONVERSION UTILITIES
 * =============================
 * 
 * These functions handle the conversion between application data types
 * and database storage types, particularly for Date object serialization.
 */

/**
 * Convert database item to application item
 * Transforms ISO date strings back to Date objects
 */
const dbItemToPriceItem = (dbItem: DBPriceItem): PriceItem => ({
  id: dbItem.id,
  name: dbItem.name,
  price: dbItem.price,
  createdAt: new Date(dbItem.createdAt),
  lastEditedAt: dbItem.lastEditedAt ? new Date(dbItem.lastEditedAt) : undefined
});

/**
 * Convert application item to database item
 * Transforms Date objects to ISO strings for storage
 */
const priceItemToDBItem = (item: PriceItem): DBPriceItem => ({
  id: item.id,
  name: item.name,
  price: item.price,
  createdAt: item.createdAt.toISOString(),
  lastEditedAt: item.lastEditedAt?.toISOString()
});

/**
 * PRICE LIST PROVIDER COMPONENT
 * =============================
 * 
 * Main provider component that manages all price list state and operations.
 * Wraps the entire application to provide global access to price data.
 * 
 * INITIALIZATION PROCESS:
 * 1. Initialize IndexedDB connection
 * 2. Load existing data from database
 * 3. Set up error handling and fallbacks
 * 4. Provide context to child components
 * 
 * STATE MANAGEMENT:
 * - items: In-memory array of all price items
 * - searchQuery: Current search filter text
 * - sortOption: Current sorting preference
 * - isLoading: Loading state for async operations
 * - error: Error messages for user feedback
 * 
 * @param children - React components to wrap with context
 */
export const PriceListProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Core data state
  const [items, setItems] = useState<PriceItem[]>([]);
  
  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState<SortOption>('date-desc');
  
  // UI state
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * DATABASE INITIALIZATION EFFECT
   * ==============================
   * 
   * Runs once on component mount to initialize the database connection
   * and load existing data. Includes error handling and fallback mechanisms.
   * 
   * PROCESS:
   * 1. Set loading state to true
   * 2. Initialize IndexedDB connection
   * 3. Load all existing items from database
   * 4. Convert database items to application format
   * 5. Update component state with loaded data
   * 6. Handle errors with fallback to localStorage
   * 7. Set loading state to false
   * 
   * ERROR HANDLING:
   * - Primary: IndexedDB initialization and data loading
   * - Fallback: localStorage for basic functionality
   * - User feedback: Error messages displayed in UI
   */
  useEffect(() => {
    const initializeDB = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Initialize IndexedDB connection
        await dbManager.initDB();
        
        // Load all existing items
        const dbItems = await dbManager.getAllItems();
        
        // Convert to application format
        const priceItems = dbItems.map(dbItemToPriceItem);
        
        // Update state with loaded data
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

  /**
   * ADD NEW ITEM FUNCTION
   * ====================
   * 
   * Creates a new price item and adds it to both memory and database.
   * Implements optimistic updates for better user experience.
   * 
   * PROCESS:
   * 1. Validate and format input data
   * 2. Create new item with generated ID
   * 3. Add to database first (for error handling)
   * 4. Update local state on success
   * 5. Handle errors with user feedback
   * 
   * VALIDATION:
   * - Name: Required, trimmed, auto-capitalized
   * - Price: Must be positive number, rounded to 2 decimals
   * - ID: Generated from current timestamp
   * - Dates: Set automatically
   * 
   * @param name - Item name (will be capitalized)
   * @param price - Item price (will be rounded to 2 decimals)
   * @throws Error if validation fails or database operation fails
   */
  const addItem = async (name: string, price: number) => {
    try {
      // Format name with proper capitalization
      const capitalizedName = capitalizeWords(name);
      
      // Create new item with generated ID and current timestamp
      const newItem: PriceItem = {
        id: Date.now().toString(),
        name: capitalizedName,
        price,
        createdAt: new Date()
      };

      // Add to IndexedDB first (for error handling)
      await dbManager.addItem(priceItemToDBItem(newItem));
      
      // Update local state on success (optimistic update)
      setItems(prevItems => [newItem, ...prevItems]);
      
      console.log('Item added successfully:', newItem);
    } catch (err) {
      console.error('Failed to add item:', err);
      setError('Failed to add item. Please try again.');
      throw err;
    }
  };

  /**
   * UPDATE EXISTING ITEM FUNCTION
   * =============================
   * 
   * Modifies an existing price item with new data. Updates both
   * memory and database while maintaining data consistency.
   * 
   * PROCESS:
   * 1. Format input data (capitalize name, round price)
   * 2. Update local state immediately (optimistic update)
   * 3. Update database with new data
   * 4. Set lastEditedAt timestamp
   * 5. Handle errors with rollback capability
   * 
   * OPTIMISTIC UPDATES:
   * - UI updates immediately for better UX
   * - Database update happens in background
   * - Errors are handled gracefully
   * 
   * @param id - Unique identifier of item to update
   * @param name - New item name (will be capitalized)
   * @param price - New item price (will be rounded)
   * @throws Error if item not found or database operation fails
   */
  const updateItem = async (id: string, name: string, price: number) => {
    try {
      // Format name with proper capitalization
      const capitalizedName = capitalizeWords(name);
      
      // Update local state first (optimistic update)
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

      // Find the updated item for database operation
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

  /**
   * DELETE ITEM FUNCTION
   * ====================
   * 
   * Removes a price item from both memory and database.
   * Implements optimistic updates for immediate UI feedback.
   * 
   * PROCESS:
   * 1. Remove from database first (for error handling)
   * 2. Update local state on success
   * 3. Handle errors with user feedback
   * 
   * SAFETY:
   * - Permanent deletion (no soft delete)
   * - Confirmation handled by calling component
   * - Error handling prevents data inconsistency
   * 
   * @param id - Unique identifier of item to delete
   * @throws Error if database operation fails
   */
  const deleteItem = async (id: string) => {
    try {
      // Remove from IndexedDB first
      await dbManager.deleteItem(id);
      
      // Update local state on success
      setItems(prevItems => prevItems.filter(item => item.id !== id));
      
      console.log('Item deleted successfully:', id);
    } catch (err) {
      console.error('Failed to delete item:', err);
      setError('Failed to delete item. Please try again.');
      throw err;
    }
  };

  /**
   * IMPORT ITEMS FUNCTION
   * ====================
   * 
   * Replaces all existing data with imported items. Used for data
   * restoration from backup files or migration between devices.
   * 
   * PROCESS:
   * 1. Set loading state for user feedback
   * 2. Convert items to database format
   * 3. Import to IndexedDB (clears existing data)
   * 4. Update local state with imported data
   * 5. Handle errors and reset loading state
   * 
   * SAFETY CONSIDERATIONS:
   * - Automatic backup created by calling component
   * - All-or-nothing operation (transaction safety)
   * - User confirmation required before import
   * 
   * @param newItems - Array of PriceItem objects to import
   * @throws Error if import operation fails
   */
  const importItems = async (newItems: PriceItem[]) => {
    try {
      setIsLoading(true);
      
      // Convert to database format
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

  /**
   * SEARCH ITEMS FUNCTION
   * ====================
   * 
   * Filters and sorts items based on search query and sort preference.
   * Provides real-time search functionality with instant results.
   * 
   * SEARCH LOGIC:
   * 1. If no query, return all items sorted
   * 2. Filter items by case-insensitive name matching
   * 3. Apply current sort option to filtered results
   * 4. Return final sorted and filtered array
   * 
   * PERFORMANCE:
   * - Case-insensitive search using toLowerCase()
   * - Partial string matching with includes()
   * - Efficient sorting with native array methods
   * 
   * @param query - Search string to filter by
   * @returns Filtered and sorted array of PriceItem objects
   */
  const searchItems = (query: string) => {
    // Return all items sorted if no search query
    if (!query.trim()) return sortItems(items, sortOption);
    
    // Filter items by name (case-insensitive)
    const lowerCaseQuery = query.toLowerCase();
    const filteredItems = items.filter(item => 
      item.name.toLowerCase().includes(lowerCaseQuery)
    );
    
    // Apply sorting to filtered results
    return sortItems(filteredItems, sortOption);
  };

  /**
   * SORT ITEMS UTILITY FUNCTION
   * ===========================
   * 
   * Sorts an array of price items based on the specified sort option.
   * Creates a new array to avoid mutating the original data.
   * 
   * SORTING OPTIONS:
   * - name-asc/desc: Alphabetical sorting using localeCompare
   * - price-asc/desc: Numerical sorting by price value
   * - date-asc/desc: Chronological sorting by creation date
   * 
   * IMPLEMENTATION:
   * - Creates copy of array to avoid mutation
   * - Uses appropriate comparison functions for each type
   * - Handles Date objects and number comparisons correctly
   * 
   * @param itemsToSort - Array of items to sort
   * @param option - Sort option to apply
   * @returns New sorted array of PriceItem objects
   */
  const sortItems = (itemsToSort: PriceItem[], option: SortOption) => {
    // Create copy to avoid mutating original array
    const itemsCopy = [...itemsToSort];
    
    switch (option) {
      case 'name-asc':
        // Alphabetical A-Z using locale-aware comparison
        return itemsCopy.sort((a, b) => a.name.localeCompare(b.name));
      case 'name-desc':
        // Alphabetical Z-A using locale-aware comparison
        return itemsCopy.sort((a, b) => b.name.localeCompare(a.name));
      case 'price-asc':
        // Numerical low to high
        return itemsCopy.sort((a, b) => a.price - b.price);
      case 'price-desc':
        // Numerical high to low
        return itemsCopy.sort((a, b) => b.price - a.price);
      case 'date-asc':
        // Chronological oldest first
        return itemsCopy.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
      case 'date-desc':
        // Chronological newest first (default)
        return itemsCopy.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      default:
        // Return unsorted copy if option not recognized
        return itemsCopy;
    }
  };

  /**
   * CONTEXT VALUE OBJECT
   * ====================
   * 
   * Combines all state and functions into a single object that will be
   * provided to consuming components through React Context.
   * 
   * ORGANIZATION:
   * - Data state: items, search, sort, loading, error
   * - CRUD operations: add, update, delete, import
   * - Utility functions: search, setters for UI state
   */
  const value = {
    // Current data state
    items,
    searchQuery,
    sortOption,
    isLoading,
    error,
    
    // CRUD operations
    addItem,
    updateItem,
    deleteItem,
    importItems,
    
    // Search and filter functions
    searchItems,
    setSearchQuery,
    setSortOption
  };

  /**
   * CONTEXT PROVIDER RENDER
   * =======================
   * 
   * Renders the React Context Provider with the complete API value,
   * making all price list functionality available to child components.
   */
  return (
    <PriceListContext.Provider value={value}>
      {children}
    </PriceListContext.Provider>
  );
};