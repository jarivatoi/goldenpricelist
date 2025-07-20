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
 * This file contains all TypeScript type definitions used throughout the
 * Golden Price List application. It provides type safety and IntelliSense
 * support for all data structures and operations.
 * 
 * PURPOSE:
 * - Define data models for price items
 * - Specify sorting and filtering options
 * - Ensure type safety across components
 * - Provide clear contracts for data structures
 * 
 * USAGE:
 * Import these types in any component that needs them:
 * import { PriceItem, SortOption } from '../types';
 */

/**
 * PRICE ITEM INTERFACE
 * ====================
 * 
 * Represents a single item in the price list with all its properties.
 * This is the core data structure used throughout the application.
 * 
 * PROPERTIES:
 * @param id - Unique identifier (string timestamp from Date.now())
 * @param name - Display name of the item (auto-capitalized)
 * @param price - Price value in currency units (number with 2 decimal precision)
 * @param createdAt - Date when item was first created (Date object)
 * @param lastEditedAt - Date when item was last modified (optional Date object)
 * 
 * VALIDATION RULES:
 * - id: Must be unique, generated automatically
 * - name: Required, trimmed, auto-capitalized
 * - price: Must be positive number, rounded to 2 decimals
  /** Unique identifier - timestamp string from Date.now() */
 * - createdAt: Set automatically on creation
  
  /** Item display name - automatically capitalized */
 * - lastEditedAt: Set automatically on updates, undefined for new items
  
  /** Price in currency units - rounded to 2 decimal places */
 * 
  
  /** Creation timestamp - set automatically */
 * USAGE EXAMPLES:
  
  /** Last edit timestamp - undefined for new items */
 * - Creating: { id: '1234567890', name: 'Apple', price: 1.50, createdAt: new Date() }
 * - Editing: { ...item, name: 'Green Apple', price: 1.75, lastEditedAt: new Date() }
 */
/**
 * SORT OPTION TYPE
 * ================
 * 
 * Defines all available sorting options for the price list.
 * Used by SearchBar component and PriceListContext for data ordering.
 * 
 * AVAILABLE OPTIONS:
 * - 'name-asc': Sort by name A to Z (alphabetical ascending)
 * - 'name-desc': Sort by name Z to A (alphabetical descending)
 * - 'price-asc': Sort by price low to high (numerical ascending)
 * - 'price-desc': Sort by price high to low (numerical descending)
 * - 'date-asc': Sort by creation date oldest first (chronological ascending)
 * - 'date-desc': Sort by creation date newest first (chronological descending)
 * 
 * DEFAULT BEHAVIOR:
 * - Default sort is 'date-desc' (newest items first)
 * - Sorting is applied after search filtering
 * - Sort preference is maintained in component state
 * 
 * IMPLEMENTATION:
 * Used in PriceListContext.sortItems() function and SearchBar component
 * for consistent sorting behavior across the application.
 */
export type SortOption = 'name-asc' | 'name-desc' | 'price-asc' | 'price-desc' | 'date-asc' | 'date-desc';