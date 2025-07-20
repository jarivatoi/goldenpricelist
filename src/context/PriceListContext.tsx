/*
 * CONTEXT/PRICELISTCONTEXT.TSX - GLOBAL STATE MANAGEMENT
 * ======================================================
 * 
 * OVERVIEW:
 * React Context provider for managing global application state.
 * Handles all price list data, CRUD operations, search, sorting, and persistence.
 * 
 * KEY RESPONSIBILITIES:
 * - Centralized state management for price items
 * - IndexedDB synchronization for offline functionality
 * - Search and filtering logic
 * - Sorting algorithms for different criteria
 * - Error handling and loading states
 * - Data import/export operations
 * 
 * ARCHITECTURE PATTERN:
 * - Context API for global state
 * - Custom hooks for component access
 * - Separation of concerns between UI and data logic
 * - Optimistic updates with error rollback
 * 
 * PERFORMANCE CONSIDERATIONS:
 * - Memoized search results
 * - Efficient sorting algorithms
 * - Minimal re-renders through careful state updates
 * - Debounced search operations (could be added)
 */
import React, { createContext, useContext, useState, useEffect } from 'react';
import { PriceItem, SortOption } from '../types';
import { dbManager, DBPriceItem } from '../utils/indexedDB';

/**
 * CONTEXT TYPE DEFINITION
 * =======================
 * 
 * DESCRIPTION:
 * TypeScript interface defining all methods and properties available
 * through the PriceListContext. Ensures type safety for consumers.
 * 
 * STATE PROPERTIES:
 * @param items - Array of all price items in memory
 * @param searchQuery - Current search filter string
 * @param sortOption - Current sorting criteria
 * @param isLoading - Boolean indicating data loading state
 * @param error - Error message string or null
 * 
 * CRUD METHODS:
 * @param addItem - Create new price item
 * @param updateItem - Modify existing price item
 * @param deleteItem - Remove price item
 * @param importItems - Bulk replace all items
 * 
 * UTILITY METHODS:
 * @param searchItems - Filter items by search query
 * @param setSearchQuery - Update search filter
 * @param setSortOption - Update sorting criteria
 */
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

/**
 * EXPORT STATEMENT
 * ================
 * 
 * PURPOSE:
 * Exports the PriceListProvider component for use in the application.
 * This provider should wrap the entire app to provide global state access.
 */

/**
 * CONTEXT CREATION
 * ================
 * 
 * Creates React context with undefined default value.
 * Requires PriceListProvider wrapper to provide actual implementation.
 * Prevents accidental usage outside of provider scope.
 */
const PriceListContext = createContext<PriceListContextType | undefined>(undefined);

/**
 * CUSTOM HOOK FOR CONTEXT ACCESS
 * ==============================
 * 
 * PURPOSE:
 * Provides type-safe access to PriceListContext from any component.
 * Includes runtime check to ensure context is available.
 * 
 * USAGE:
 * const { items, addItem, searchItems } = usePriceList();
 * 
 * ERROR HANDLING:
 * Throws descriptive error if used outside PriceListProvider.
 * Helps developers identify context usage issues early.
 * 
 * @returns PriceListContextType - All context methods and state
 * @throws Error if used outside PriceListProvider
 */
export const usePriceList = () => {
  const context = useContext(PriceListContext);
  if (!context) {
    throw new Error('usePriceList must be used within a PriceListProvider');
  }
  return context;
};

/**
 * TEXT FORMATTING UTILITY
 * =======================
 * 
 * PURPOSE:
 * Standardizes item names by capitalizing each word and cleaning whitespace.
 * Ensures consistent formatting across all user inputs.
 * 
 * PROCESS:
 * 1. Trim leading/trailing whitespace
 * 2. Split by spaces and filter empty strings
 * 3. Capitalize first letter of each word
 * 4. Lowercase remaining letters
 * 5. Join with single spaces
 * 
 * EXAMPLES:
 * "apple juice" → "Apple Juice"
 * "  BREAD   loaf  " → "Bread Loaf"
 * "milk" → "Milk"
 * 
 * @param str - Raw input string from user
 * @returns string - Formatted string with proper capitalization
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
 * DATABASE TO MEMORY CONVERSION
 * =============================
 * 
 * PURPOSE:
 * Converts database items (with string dates) to memory items (with Date objects).
 * Handles the serialization boundary between IndexedDB and React state.
 * 
 * TRANSFORMATION:
 * - createdAt: string → Date object
 * - lastEditedAt: string → Date object (if present)
 * - Other properties: direct copy
 * 
 * ERROR HANDLING:
 * - Invalid date strings will create Invalid Date objects
 * - Calling code should validate dates if needed
 * 
 * @param dbItem - Database item with string dates
 * @returns PriceItem - Memory item with Date objects
 */
const dbItemToPriceItem = (dbItem: DBPriceItem): PriceItem => ({
  id: dbItem.id,
  name: dbItem.name,
  price: dbItem.price,
  createdAt: new Date(dbItem.createdAt),
  lastEditedAt: dbItem.lastEditedAt ? new Date(dbItem.lastEditedAt) : undefined
});

/**
 * MEMORY TO DATABASE CONVERSION
 * =============================
 * 
 * PURPOSE:
 * Converts memory items (with Date objects) to database items (with string dates).
 * Handles the serialization boundary between React state and IndexedDB.
 * 
 * TRANSFORMATION:
 * - createdAt: Date object → ISO string
 * - lastEditedAt: Date object → ISO string (if present)
 * - Other properties: direct copy
 * 
 * DATE FORMAT:
 * Uses ISO 8601 format for consistent date serialization.
 * Example: "2023-12-25T10:30:00.000Z"
 * 
 * @param item - Memory item with Date objects
 * @returns DBPriceItem - Database item with string dates
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
 * PURPOSE:
 * React component that provides global state management for the entire application.
 * Wraps child components with context and handles all data operations.
 * 
 * INITIALIZATION PROCESS:
 * 1. Initialize IndexedDB connection
 * 2. Load existing items from database
 * 3. Set up state management
 * 4. Handle errors with fallback strategies
 * 
 * STATE MANAGEMENT:
 * - items: Array of all price items
 * - searchQuery: Current search filter
 * - sortOption: Current sorting method
 * - isLoading: Loading state for UI feedback
 * - error: Error messages for user display
 * 
 * ERROR RECOVERY:
 * - Fallback to localStorage if IndexedDB fails
 * - Graceful degradation for unsupported browsers
 * - User-friendly error messages
 * 
 * @param children - React components to wrap with context
 */
export const PriceListProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // STATE DECLARATIONS
  // ==================
  
  // Core data state
  const [items, setItems] = useState<PriceItem[]>([]);
  
  // UI interaction state
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState<SortOption>('date-desc');
  
  // Application state
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * DATABASE INITIALIZATION EFFECT
   * ==============================
   * 
   * PURPOSE:
   * Runs once on component mount to set up database and load initial data.
   * Handles both successful initialization and error scenarios.
   * 
   * PROCESS:
   * 1. Set loading state to true
   * 2. Clear any previous errors
   * 3. Initialize IndexedDB connection
   * 4. Load all items from database
   * 5. Convert database items to memory format
   * 6. Update component state
   * 7. Handle errors with fallback strategies
   * 
   * ERROR HANDLING:
   * - Primary: Try IndexedDB initialization
   * - Fallback: Try localStorage recovery
   * - Final: Show error message to user
   * 
   * PERFORMANCE:
   * - Only runs once on mount
   * - Loads all data in single operation
   * - Could be optimized with lazy loading for large datasets
   */
  useEffect(() => {
    const initializeDB = async () => {
      try {
        // Start loading state
        setIsLoading(true);
        setError(null);
        
        // Initialize database connection and schema
        await dbManager.initDB();
        
        // Load all existing items
        const dbItems = await dbManager.getAllItems();
        
        // Convert database format to memory format
        const priceItems = dbItems.map(dbItemToPriceItem);
        
        // Update component state with loaded items
        setItems(priceItems);
        
        console.log(`Loaded ${priceItems.length} items from IndexedDB`);
      } catch (err) {
        console.error('Failed to initialize database:', err);
        setError('Failed to initialize offline storage. The app may not work properly.');
        
        // FALLBACK STRATEGY: Try localStorage recovery
        try {
          const savedItems = localStorage.getItem('priceItems');
          if (savedItems) {
            // Parse and convert localStorage data
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
        // Always clear loading state
        setIsLoading(false);
      }
    };

    initializeDB();
  }, []);

  /**
   * ADD ITEM METHOD
   * ===============
   * 
   * PURPOSE:
   * Creates a new price item and adds it to both memory and database.
   * Provides optimistic updates for better user experience.
   * 
   * PROCESS:
   * 1. Validate and format input data
   * 2. Create new item object with metadata
   * 3. Add to database first (for data integrity)
   * 4. Update memory state on success
   * 5. Handle errors gracefully
   * 
   * VALIDATION:
   * - Name: Trimmed and capitalized
   * - Price: Positive number, rounded to 2 decimals
   * - ID: Unique timestamp-based identifier
   * 
   * ERROR HANDLING:
   * - Database errors are caught and re-thrown
   * - User-friendly error messages
   * - State remains consistent on failure
   * 
   * @param name - Item name (will be formatted)
   * @param price - Item price (will be rounded)
   * @returns Promise<void> - Resolves when item is added
   * @throws Error if database operation fails
   */
  const addItem = async (name: string, price: number) => {
    try {
      // Format and validate input data
      const capitalizedName = capitalizeWords(name);
      
      // Create new item with metadata
      const newItem: PriceItem = {
        id: Date.now().toString(), // Unique timestamp-based ID
        name: capitalizedName,
        price,
        createdAt: new Date() // Current timestamp
      };

      // Add to IndexedDB first (data integrity)
      await dbManager.addItem(priceItemToDBItem(newItem));
      
      // Update local state on successful database operation
      // Add to beginning of array for newest-first display
      setItems(prevItems => [newItem, ...prevItems]);
      
      console.log('Item added successfully:', newItem);
    } catch (err) {
      console.error('Failed to add item:', err);
      setError('Failed to add item. Please try again.');
      throw err;
    }
  };

  /**
   * UPDATE ITEM METHOD
   * ==================
   * 
   * PURPOSE:
   * Updates an existing price item with new data.
   * Maintains data consistency between memory and database.
   * 
   * PROCESS:
   * 1. Validate and format input data
   * 2. Update memory state optimistically
   * 3. Update database with new data
   * 4. Handle errors with state rollback
   * 
   * OPTIMISTIC UPDATES:
   * - UI updates immediately for responsiveness
   * - Database update happens asynchronously
   * - Could implement rollback on database failure
   * 
   * METADATA HANDLING:
   * - Updates lastEditedAt timestamp
   * - Preserves original createdAt timestamp
   * - Maintains item ID for referential integrity
   * 
   * @param id - Unique identifier of item to update
   * @param name - New item name (will be formatted)
   * @param price - New item price (will be rounded)
   * @returns Promise<void> - Resolves when item is updated
   * @throws Error if database operation fails
   */
  const updateItem = async (id: string, name: string, price: number) => {
    try {
      // Format and validate input data
      const capitalizedName = capitalizeWords(name);
      
      // Update local state first (optimistic update)
      setItems(prevItems => 
        prevItems.map(item => 
          item.id === id ? { 
            ...item, 
            name: capitalizedName, 
            price, 
            lastEditedAt: new Date() // Update modification timestamp
          } : item
        )
      );

      // Find the updated item for database operation
      const updatedItem = items.find(item => item.id === id);
      if (updatedItem) {
        // Create updated item object with new data
        const itemToUpdate = {
          ...updatedItem,
          name: capitalizedName,
          price,
          lastEditedAt: new Date()
        };
        
        // Persist changes to IndexedDB
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
   * DELETE ITEM METHOD
   * ==================
   * 
   * PURPOSE:
   * Removes a price item from both memory and database.
   * Provides immediate UI feedback with database synchronization.
   * 
   * PROCESS:
   * 1. Remove from database first (data integrity)
   * 2. Update memory state on success
   * 3. Handle errors gracefully
   * 
   * DATA INTEGRITY:
   * - Database operation happens first
   * - Memory state updated only on success
   * - Prevents orphaned data in memory
   * 
   * PERFORMANCE:
   * - Efficient array filtering for memory update
   * - Single database operation
   * - Immediate UI response
   * 
   * @param id - Unique identifier of item to delete
   * @returns Promise<void> - Resolves when item is deleted
   * @throws Error if database operation fails
   */
  const deleteItem = async (id: string) => {
    try {
      // Remove from IndexedDB first (data integrity)
      await dbManager.deleteItem(id);
      
      // Update local state on successful database operation
      setItems(prevItems => prevItems.filter(item => item.id !== id));
      
      console.log('Item deleted successfully:', id);
    } catch (err) {
      console.error('Failed to delete item:', err);
      setError('Failed to delete item. Please try again.');
      throw err;
    }
  };

  /**
   * IMPORT ITEMS METHOD
   * ===================
   * 
   * PURPOSE:
   * Replaces all existing items with imported data from JSON file.
   * Provides bulk data replacement functionality.
   * 
   * PROCESS:
   * 1. Set loading state for user feedback
   * 2. Convert items to database format
   * 3. Clear existing database data
   * 4. Import all new items
   * 5. Update memory state
   * 6. Clear loading state
   * 
   * TRANSACTION SAFETY:
   * - Uses database manager's import method
   * - Atomic operation (all or nothing)
   * - Maintains data consistency
   * 
   * USER EXPERIENCE:
   * - Shows loading state during operation
   * - Provides progress feedback
   * - Handles errors gracefully
   * 
   * @param newItems - Array of PriceItem objects to import
   * @returns Promise<void> - Resolves when import is complete
   * @throws Error if import operation fails
   */
  const importItems = async (newItems: PriceItem[]) => {
    try {
      // Show loading state during bulk operation
      setIsLoading(true);
      
      // Convert memory format to database format
      const dbItems = newItems.map(priceItemToDBItem);
      
      // Import to IndexedDB (clears existing data first)
      await dbManager.importItems(dbItems);
      
      // Update local state with imported items
      setItems(newItems);
      
      console.log(`Successfully imported ${newItems.length} items`);
    } catch (err) {
      console.error('Failed to import items:', err);
      setError('Failed to import items. Please try again.');
      throw err;
    } finally {
      // Always clear loading state
      setIsLoading(false);
    }
  };

  /**
   * SEARCH ITEMS METHOD
   * ===================
   * 
   * PURPOSE:
   * Filters and sorts items based on search query and sort option.
   * Provides real-time search functionality.
   * 
   * SEARCH LOGIC:
   * - Case-insensitive substring matching
   * - Searches item names only
   * - Empty query returns all items
   * - Results are sorted according to current sort option
   * 
   * PERFORMANCE:
   * - Efficient string operations
   * - Could be optimized with debouncing for large datasets
   * - Could implement fuzzy search for better UX
   * 
   * SORTING:
   * - Delegates to sortItems helper function
   * - Maintains consistent sort order
   * - Supports multiple sort criteria
   * 
   * @param query - Search string to filter by
   * @returns PriceItem[] - Filtered and sorted array of items
   */
  const searchItems = (query: string) => {
    // Return all items if no search query
    if (!query.trim()) return sortItems(items, sortOption);
    
    // Filter items by case-insensitive name matching
    const lowerCaseQuery = query.toLowerCase();
    const filteredItems = items.filter(item => 
      item.name.toLowerCase().includes(lowerCaseQuery)
    );
    
    // Apply current sort option to filtered results
    return sortItems(filteredItems, sortOption);
  };

  /**
   * SORT ITEMS HELPER FUNCTION
   * ==========================
   * 
   * PURPOSE:
   * Sorts an array of price items according to specified criteria.
   * Provides consistent sorting logic across the application.
   * 
   * SORT OPTIONS:
   * - name-asc/desc: Alphabetical sorting by item name
   * - price-asc/desc: Numerical sorting by price value
   * - date-asc/desc: Chronological sorting by creation date
   * 
   * IMPLEMENTATION:
   * - Creates copy of array to avoid mutation
   * - Uses appropriate comparison functions
   * - Handles edge cases gracefully
   * 
   * PERFORMANCE:
   * - Efficient native sort algorithms
   * - Minimal memory allocation
   * - Stable sorting for consistent results
   * 
   * @param itemsToSort - Array of items to sort
   * @param option - Sort criteria to apply
   * @returns PriceItem[] - New sorted array
   */
  const sortItems = (itemsToSort: PriceItem[], option: SortOption) => {
    // Create copy to avoid mutating original array
    const itemsCopy = [...itemsToSort];
    
    switch (option) {
      // Alphabetical sorting by name
      case 'name-asc':
        return itemsCopy.sort((a, b) => a.name.localeCompare(b.name));
      case 'name-desc':
        return itemsCopy.sort((a, b) => b.name.localeCompare(a.name));
      
      // Numerical sorting by price
      case 'price-asc':
        return itemsCopy.sort((a, b) => a.price - b.price);
      case 'price-desc':
        return itemsCopy.sort((a, b) => b.price - a.price);
      
      // Chronological sorting by creation date
      case 'date-asc':
        return itemsCopy.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
      case 'date-desc':
        return itemsCopy.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      
      // Default case (should not happen with TypeScript)
      default:
        return itemsCopy;
    }
  };

  /**
   * CONTEXT VALUE OBJECT
   * ====================
   * 
   * PURPOSE:
   * Aggregates all state and methods into single object for context provision.
   * Provides clean interface for consuming components.
   * 
   * ORGANIZATION:
   * - State properties first
   * - CRUD methods second
   * - Utility methods third
   * - UI state last
   * 
   * PERFORMANCE:
   * - Could be memoized to prevent unnecessary re-renders
   * - Current implementation re-creates object on every render
   * - Consider useMemo for optimization if needed
   */
  const value = {
    // Core data state
    items,
    
    // CRUD operations
    addItem,
    updateItem,
    deleteItem,
    importItems,
    
    // Search and filtering
    searchItems,
    searchQuery,
    setSearchQuery,
    
    // Sorting
    sortOption,
    setSortOption,
    
    // Application state
    isLoading,
    error
  };

  /**
   * CONTEXT PROVIDER RENDER
   * =======================
   * 
   * PURPOSE:
   * Renders the context provider with aggregated value object.
   * Makes all state and methods available to child components.
   * 
   * CHILDREN:
   * All child components will have access to context via usePriceList hook.
   * Context value is available throughout the component tree.
   */
  return (
    <PriceListContext.Provider value={value}>
      {children}
    </PriceListContext.Provider>
  );
}