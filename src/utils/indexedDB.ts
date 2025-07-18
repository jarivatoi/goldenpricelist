// IndexedDB utility functions for offline storage
const DB_NAME = 'PriceListDB';
const DB_VERSION = 2;
const STORE_NAME = 'priceItems';
const CATEGORY_STORE_NAME = 'categories';

export interface DBPriceItem {
  id: string;
  name: string;
  price: number;
  categoryId?: string;
  createdAt: string;
  lastEditedAt?: string;
}

export interface DBCategory {
  id: string;
  name: string;
  color: string;
  createdAt: string;
}

class IndexedDBManager {
  private db: IDBDatabase | null = null;

  async initDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error('Failed to open IndexedDB:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('IndexedDB initialized successfully');
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Create object store if it doesn't exist
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          
          // Create indexes for better querying
          store.createIndex('name', 'name', { unique: false });
          store.createIndex('price', 'price', { unique: false });
          store.createIndex('createdAt', 'createdAt', { unique: false });
          store.createIndex('categoryId', 'categoryId', { unique: false });
          
          console.log('Object store created with indexes');
        }
        
        // Create categories object store if it doesn't exist
        if (!db.objectStoreNames.contains(CATEGORY_STORE_NAME)) {
          const categoryStore = db.createObjectStore(CATEGORY_STORE_NAME, { keyPath: 'id' });
          
          // Create indexes for better querying
          categoryStore.createIndex('name', 'name', { unique: false });
          categoryStore.createIndex('createdAt', 'createdAt', { unique: false });
          
          console.log('Categories object store created with indexes');
        }
      };
    });
  }

  async getAllItems(): Promise<DBPriceItem[]> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        resolve(request.result || []);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  async getAllCategories(): Promise<DBCategory[]> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([CATEGORY_STORE_NAME], 'readonly');
      const store = transaction.objectStore(CATEGORY_STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        resolve(request.result || []);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  async addItem(item: DBPriceItem): Promise<void> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.add(item);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  async addCategory(category: DBCategory): Promise<void> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([CATEGORY_STORE_NAME], 'readwrite');
      const store = transaction.objectStore(CATEGORY_STORE_NAME);
      const request = store.add(category);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  async updateItem(item: DBPriceItem): Promise<void> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(item);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  async updateCategory(category: DBCategory): Promise<void> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([CATEGORY_STORE_NAME], 'readwrite');
      const store = transaction.objectStore(CATEGORY_STORE_NAME);
      const request = store.put(category);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  async deleteItem(id: string): Promise<void> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(id);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  async deleteCategory(id: string): Promise<void> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([CATEGORY_STORE_NAME], 'readwrite');
      const store = transaction.objectStore(CATEGORY_STORE_NAME);
      const request = store.delete(id);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  async clearAllItems(): Promise<void> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.clear();

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  async clearAllCategories(): Promise<void> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([CATEGORY_STORE_NAME], 'readwrite');
      const store = transaction.objectStore(CATEGORY_STORE_NAME);
      const request = store.clear();

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  async importItems(items: DBPriceItem[]): Promise<void> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    // Clear existing data first
    await this.clearAllItems();

    // Add all new items
    const promises = items.map(item => this.addItem(item));
    await Promise.all(promises);
  }

  async importCategories(categories: DBCategory[]): Promise<void> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    // Clear existing data first
    await this.clearAllCategories();

    // Add all new categories
    const promises = categories.map(category => this.addCategory(category));
    await Promise.all(promises);
  }
}

// Create singleton instance
export const dbManager = new IndexedDBManager();