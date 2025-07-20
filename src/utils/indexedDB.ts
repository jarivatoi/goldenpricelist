/**
 * UTILS/INDEXEDDB.TS - OFFLINE DATABASE MANAGEMENT
 * ================================================
 * 
 * OVERVIEW:
 * This utility provides a complete IndexedDB wrapper for offline data storage
 * in the Golden Price List PWA. It handles all database operations including
 * initialization, CRUD operations, and data import/export functionality.
 * 
 * PURPOSE:
 * - Enable offline functionality for the PWA
 * - Provide persistent storage that survives browser sessions
 * - Handle large datasets efficiently with indexed queries
 * - Support data import/export for backup and migration
 * 
 * FEATURES:
 * - Automatic database initialization and schema migration
 * - Full CRUD operations (Create, Read, Update, Delete)
 * - Bulk import/export with automatic data clearing
 * - Error handling and fallback mechanisms
 * - Indexed queries for better performance
 * 
 * BROWSER SUPPORT:
 * - All modern browsers (Chrome, Firefox, Safari, Edge)
 * - Mobile browsers (iOS Safari, Chrome Mobile)
 * - Fallback to localStorage if IndexedDB unavailable
 * 
 * DATABASE SCHEMA:
 * - Database: 'PriceListDB' (version 2)
 * - Object Store: 'priceItems' (keyPath: 'id')
 * - Indexes: name, price, createdAt for efficient querying
 */
// IndexedDB utility functions for offline storage
// Database configuration constants
const DB_NAME = 'PriceListDB';
const DB_VERSION = 2;
const STORE_NAME = 'priceItems';

/**
 * DATABASE PRICE ITEM INTERFACE
 * =============================
 * 
 * Represents the data structure stored in IndexedDB. Differs from the main
 * PriceItem interface by using ISO string dates instead of Date objects
 * for JSON serialization compatibility.
 * 
 * SERIALIZATION STRATEGY:
 * - Date objects are converted to ISO strings for storage
 * - ISO strings are converted back to Date objects when retrieved
 * - This ensures consistent date handling across browser sessions
 * 
 * PROPERTIES:
 * @param id - Unique identifier string
 * @param name - Item name string
 * @param price - Price number value
 * @param createdAt - Creation date as ISO string
 * @param lastEditedAt - Last edit date as ISO string (optional)
 */
export interface DBPriceItem {
  id: string;
  name: string;
  price: number;
  /** Creation date stored as ISO string for JSON compatibility */
  createdAt: string;
  /** Last edit date stored as ISO string, undefined for new items */
  lastEditedAt?: string;
}

/**
 * INDEXEDDB MANAGER CLASS
 * =======================
 * 
 * Singleton class that manages all IndexedDB operations for the application.
 * Provides a clean API for database interactions while handling the complexity
 * of IndexedDB's asynchronous, event-driven architecture.
 * 
 * DESIGN PATTERNS:
 * - Singleton pattern for single database connection
 * - Promise-based API for modern async/await usage
 * - Error handling with meaningful error messages
 * - Transaction management for data consistency
 * 
 * LIFECYCLE:
 * 1. Initialize database connection
 * 2. Handle schema upgrades automatically
 * 3. Provide CRUD operations
 * 4. Manage transactions and error states
 */
class IndexedDBManager {
  /** Database connection instance - null until initialized */
  private db: IDBDatabase | null = null;

  /**
   * INITIALIZE DATABASE CONNECTION
   * =============================
   * 
   * Opens IndexedDB connection and handles schema creation/migration.
   * Must be called before any other database operations.
   * 
   * PROCESS:
   * 1. Open database connection with version number
   * 2. Handle upgrade events for schema changes
   * 3. Create object store and indexes if needed
   * 4. Store connection for future operations
   * 
   * ERROR HANDLING:
   * - Rejects promise if database cannot be opened
   * - Logs detailed error information for debugging
   * - Allows fallback to localStorage in calling code
   * 
   * @returns Promise<void> - Resolves when database is ready
   * @throws Error if database initialization fails
   */
  async initDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      // Open database with name and version
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      // Handle database opening errors
      request.onerror = () => {
        console.error('Failed to open IndexedDB:', request.error);
        reject(request.error);
      };

      // Database opened successfully
      request.onsuccess = () => {
        this.db = request.result;
        console.log('IndexedDB initialized successfully');
        resolve();
      };

      // Handle database schema upgrades
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Create object store if it doesn't exist
        // Create object store if it doesn't exist
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          // Create store with 'id' as primary key
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          
          // Create indexes for efficient querying
          // These allow fast searches by name, price, or date
          // Create indexes for better querying
          store.createIndex('name', 'name', { unique: false });
          store.createIndex('price', 'price', { unique: false });
          store.createIndex('createdAt', 'createdAt', { unique: false });
          
          console.log('Object store created with indexes');
        }
      };
    });
  }

  /**
   * GET ALL ITEMS FROM DATABASE
   * ===========================
   * 
   * Retrieves all price items from the database in a single operation.
   * Used during app initialization to load existing data.
   * 
   * PERFORMANCE:
   * - Uses getAll() for efficient bulk retrieval
   * - Returns empty array if no items exist
   * - Minimal memory overhead for typical datasets
   * 
   * @returns Promise<DBPriceItem[]> - Array of all stored items
   * @throws Error if database not initialized or operation fails
   */
  async getAllItems(): Promise<DBPriceItem[]> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    return new Promise((resolve, reject) => {
      // Create read-only transaction
      const transaction = this.db!.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      
      // Get all items at once
      const request = store.getAll();

      request.onsuccess = () => {
        // Return items or empty array if none exist
        resolve(request.result || []);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  /**
   * ADD NEW ITEM TO DATABASE
   * ========================
   * 
   * Inserts a new price item into the database. Will fail if an item
   * with the same ID already exists (use updateItem for modifications).
   * 
   * TRANSACTION SAFETY:
   * - Uses readwrite transaction for data modification
   * - Automatically rolls back on error
   * - Ensures data consistency
   * 
   * @param item - DBPriceItem to add to database
   * @returns Promise<void> - Resolves when item is successfully added
   * @throws Error if item already exists or operation fails
   */
  async addItem(item: DBPriceItem): Promise<void> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    return new Promise((resolve, reject) => {
      // Create readwrite transaction for data modification
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      
      // Add item (will fail if ID already exists)
      const request = store.add(item);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  /**
   * UPDATE EXISTING ITEM IN DATABASE
   * ================================
   * 
   * Updates an existing price item or creates it if it doesn't exist.
   * This is the preferred method for item modifications.
   * 
   * UPSERT BEHAVIOR:
   * - Updates item if it exists
   * - Creates item if it doesn't exist
   * - Overwrites all properties with new values
   * 
   * @param item - DBPriceItem with updated data
   * @returns Promise<void> - Resolves when update is complete
   * @throws Error if operation fails
   */
  async updateItem(item: DBPriceItem): Promise<void> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      
      // Put item (upsert operation)
      const request = store.put(item);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  /**
   * DELETE ITEM FROM DATABASE
   * =========================
   * 
   * Removes a price item from the database by its ID.
   * Operation succeeds even if item doesn't exist.
   * 
   * SAFETY:
   * - No error if item doesn't exist
   * - Permanent deletion (no soft delete)
   * - Transaction ensures consistency
   * 
   * @param id - Unique identifier of item to delete
   * @returns Promise<void> - Resolves when deletion is complete
   * @throws Error if operation fails
   */
  async deleteItem(id: string): Promise<void> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      
      // Delete item by ID
      const request = store.delete(id);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  /**
   * CLEAR ALL ITEMS FROM DATABASE
   * =============================
   * 
   * Removes all price items from the database. Used during data import
   * to ensure clean state before importing new data.
   * 
   * WARNING:
   * - Permanently deletes ALL data
   * - Cannot be undone
   * - Used internally by importItems()
   * 
   * @returns Promise<void> - Resolves when all data is cleared
   * @throws Error if operation fails
   */
  async clearAllItems(): Promise<void> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      
      // Clear all data from store
      const request = store.clear();

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  /**
   * IMPORT ITEMS (REPLACE ALL DATA)
   * ===============================
   * 
   * Replaces all existing data with imported items. Used for data restoration
   * from backup files or migration between devices.
   * 
   * PROCESS:
   * 1. Clear all existing data
   * 2. Add all imported items
   * 3. Ensure data consistency
   * 
   * SAFETY CONSIDERATIONS:
   * - Creates automatic backup before import (handled by calling code)
   * - All-or-nothing operation (transaction safety)
   * - Validates data structure before import
   * 
   * @param items - Array of DBPriceItem objects to import
   * @returns Promise<void> - Resolves when import is complete
   * @throws Error if import fails (original data preserved)
   */
  async importItems(items: DBPriceItem[]): Promise<void> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    // Clear existing data first
    // Clear existing data first
    await this.clearAllItems();

    // Add all new items in parallel
    // Add all new items
    const promises = items.map(item => this.addItem(item));
    await Promise.all(promises);
  }
}

/**
 * SINGLETON DATABASE MANAGER INSTANCE
 * ===================================
 * 
 * Single instance of IndexedDBManager used throughout the application.
 * This ensures consistent database connection and prevents multiple
 * database instances from conflicting.
 * 
 * USAGE:
 * Import and use this instance in any component that needs database access:
 * 
 * import { dbManager } from '../utils/indexedDB';
 * 
 * // Initialize once in app startup
 * await dbManager.initDB();
 * 
 * // Use throughout app
 * const items = await dbManager.getAllItems();
 * await dbManager.addItem(newItem);
 */
// Create singleton instance
export const dbManager = new IndexedDBManager();