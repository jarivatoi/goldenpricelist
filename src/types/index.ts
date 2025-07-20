export interface PriceItem {
  id: string;
  name: string;
  price: number;
  createdAt: Date;
  lastEditedAt?: Date;
}
/**
 * TYPES/INDEX.TS - TYPE DEFINITIONS
 * =================================
 * 
 * OVERVIEW:
 * Central type definitions for the Golden Price List application.
 * Defines the core data structures and enums used throughout the app.
 * 
 * PURPOSE:
 * - Ensures type safety across all components
 * - Provides clear contracts for data structures
 * - Enables better IDE support and error catching
 * - Documents expected data shapes
 * 
 * USAGE:
 * Import these types in any component that needs them:
 * import { PriceItem, SortOption } from '../types';
 */

/**
 * PRICE ITEM INTERFACE
 * ===================
 * 
 * DESCRIPTION:
 * Core data structure representing a single item in the price list.
 * Used throughout the application for CRUD operations and display.
 * 
 * PROPERTIES:
 * @param id - Unique identifier (string timestamp)
 * @param name - Display name of the item (capitalized)
 * @param price - Price value in currency units (number with 2 decimals)
 * @param createdAt - Timestamp when item was first created
 * @param lastEditedAt - Optional timestamp of last modification
 * 
 * VALIDATION RULES:
 * - id: Must be unique, generated from Date.now().toString()
 * - name: Trimmed and capitalized, minimum 1 character
 * - price: Positive number, rounded to 2 decimal places
 * - createdAt: Set automatically on creation
 * - lastEditedAt: Set automatically on updates
 * 
 * STORAGE:
 * - Stored in IndexedDB for offline access
 * - Synchronized between memory and database
 * - Exported/imported as JSON with ISO date strings
 */
/**
 * SORT OPTION TYPE
 * ================
 * 
 * DESCRIPTION:
 * Union type defining all available sorting options for the price list.
 * Used by the search/filter component and context state management.
 * 
 * AVAILABLE OPTIONS:
 * - 'name-asc': Sort by name A to Z (alphabetical ascending)
 * - 'name-desc': Sort by name Z to A (alphabetical descending)
 * - 'price-asc': Sort by price low to high (numerical ascending)
 * - 'price-desc': Sort by price high to low (numerical descending)
 * - 'date-asc': Sort by creation date oldest first (chronological ascending)
 * - 'date-desc': Sort by creation date newest first (chronological descending)
 * 
 * DEFAULT:
 * The application defaults to 'date-desc' to show newest items first.
 * 
 * IMPLEMENTATION:
 * Used in PriceListContext.sortItems() method for array sorting logic.
 * Stored in component state and persisted during session.
 */
export type SortOption = 'name-asc' | 'name-desc' | 'price-asc' | 'price-desc' | 'date-asc' | 'date-desc';