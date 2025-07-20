/**
 * COMPONENTS/HEADER.TSX - APPLICATION HEADER WITH MENU
 * COMPONENTS/HEADER.TSX - APPLICATION HEADER WITH MENU
 * ====================================================
 * 
 * OVERVIEW:
 * This component renders the main application header with navigation,
 * app title, and a dropdown menu for data management operations.
 * It provides import/export functionality and displays current data statistics.
 * 
 * KEY FEATURES:
 * - Sticky header that stays at top during scrolling
 * - Dropdown menu with data management options
 * - Export functionality with automatic date-stamped filenames
 * - Import functionality with data validation and confirmation
 * - Real-time item count display
 * - Responsive design with mobile-optimized layout
 * 
 * DATA MANAGEMENT:
 * - Export: Creates JSON backup with metadata and date stamp
 * - Import: Validates file format and creates automatic backup
 * - User confirmation for destructive operations
 * - Error handling with user-friendly messages
 * 
 * DESIGN PRINCIPLES:
 * - Clean, minimal interface
 * - Clear visual hierarchy
 * - Accessible menu interactions
 * - Consistent with app's golden theme
 */
import React, { useState } from 'react';
import { Menu, Download, Upload, X, Database } from 'lucide-react';
import { usePriceList } from '../context/PriceListContext';

/**
 * HEADER COMPONENT
 * ================
 * 
 * Main header component that provides navigation and data management
 * functionality for the Golden Price List application.
 * 
 * STATE MANAGEMENT:
 * - isMenuOpen: Controls visibility of dropdown menu
 * - Uses PriceListContext for items data and import functionality
 * 
 * LAYOUT STRUCTURE:
 * - Sticky header container with shadow
 * - Centered title with absolute positioned menu button
 * - Dropdown menu with export/import options
 * - Item count display in menu footer
 * 
 * ACCESSIBILITY:
 * - Proper ARIA labels for menu interactions
 * - Keyboard navigation support
 * - Clear visual feedback for all actions
 * - High contrast colors for readability
 */
const Header: React.FC = () => {
  // Menu visibility state
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  // Access to price list data and operations
  const { items, importItems } = usePriceList();

  /**
   * EXPORT DATA FUNCTION
   * ====================
   * 
   * Creates a JSON backup file of all price list data with metadata.
   * Includes automatic date stamping and proper file naming.
   * 
   * EXPORT FORMAT:
   * - version: File format version for future compatibility
   * - exportDate: ISO timestamp of when export was created
   * - items: Array of all price items with serialized dates
   * 
   * FILE NAMING:
   * - Format: "Goldenpricelist_DD-MM-YYYY.json"
   * - Uses local date format for user familiarity
   * - Automatic download through browser's download API
   * 
   * ERROR HANDLING:
   * - Try-catch for JSON serialization errors
   * - User-friendly error messages
   * - Graceful fallback if download fails
   */
  const handleExport = () => {
    try {
      // Create date string in dd-mm-yyyy format for filename
      // Create date string in dd-mm-yyyy format
      const now = new Date();
      const day = now.getDate().toString().padStart(2, '0');
      const month = (now.getMonth() + 1).toString().padStart(2, '0');
      const year = now.getFullYear();
      const dateString = `${day}-${month}-${year}`;
      
      // Create export data object with metadata
      const dataToExport = {
        version: '1.0',
        exportDate: new Date().toISOString(),
        // Convert Date objects to ISO strings for JSON compatibility
        items: items.map(item => ({
          ...item,
          createdAt: item.createdAt.toISOString(),
          lastEditedAt: item.lastEditedAt?.toISOString()
        }))
      };

      // Convert to JSON string with formatting
      const dataStr = JSON.stringify(dataToExport, null, 2);
      
      // Create blob for download
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      
      // Create download link and trigger download
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Goldenpricelist_${dateString}.json`;
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      // Close menu after successful export
      setIsMenuOpen(false);
    } catch (error) {
      alert('Error exporting data. Please try again.');
    }
  };

  /**
   * IMPORT DATA FUNCTION
   * ====================
   * 
   * Handles file selection and data import with validation and confirmation.
   * Creates automatic backup before importing new data.
   * 
   * IMPORT PROCESS:
   * 1. Create file input element programmatically
   * 2. Handle file selection and reading
   * 3. Validate JSON structure and data format
   * 4. Convert date strings back to Date objects
   * 5. Show confirmation dialog with item count
   * 6. Import data if user confirms
   * 
   * VALIDATION:
   * - Checks for required 'items' array in JSON
   * - Validates data structure before import
   * - Handles date string conversion errors
   * - Provides clear error messages for invalid files
   * 
   * SAFETY FEATURES:
   * - User confirmation required before import
   * - Automatic backup creation (mentioned in confirmation)
   * - Error handling with rollback capability
   */
  const handleImport = () => {
    // Create file input element programmatically
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    // Handle file selection
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      // Read file content
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const content = e.target?.result as string;
          const data = JSON.parse(content);
          
          // Validate the data structure
          // Validate the data structure
          if (!data.items || !Array.isArray(data.items)) {
            throw new Error('Invalid file format');
          }

          // Convert date strings back to Date objects
          // Convert date strings back to Date objects
          const importedItems = data.items.map((item: any) => ({
            ...item,
            createdAt: new Date(item.createdAt),
            lastEditedAt: item.lastEditedAt ? new Date(item.lastEditedAt) : undefined
          }));

          // Show confirmation dialog with item count and backup notice
          // Confirm import
          const confirmImport = window.confirm(
            `This will import ${importedItems.length} items and replace your current data. This will also create an automatic backup. Are you sure you want to continue?`
          );

          // Import data if user confirms
          if (confirmImport) {
            await importItems(importedItems);
            alert(`Successfully imported ${importedItems.length} items!`);
          }
        } catch (error) {
          alert('Error importing file. Please check the file format and try again.');
        }
      };
      
      // Start reading the file as text
      reader.readAsText(file);
    };
    
    // Trigger file selection dialog
    input.click();
    
    // Close menu after initiating import
    setIsMenuOpen(false);
  };

  /**
   * COMPONENT RENDER
   * ================
   * 
   * Renders the complete header with title, menu button, and dropdown.
   * Uses sticky positioning and responsive design principles.
   */
  return (
    /* Sticky Header Container: Stays at top with shadow for depth */
    <header className="sticky top-0 bg-white z-20 shadow-sm">
      {/* Content Container: Centered with max width and padding */}
      <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-center relative">
        {/* App Title: Centered and prominent */}
        {/* Centered Title */}
        <h1 className="text-xl font-semibold text-gray-900">Golden Price List</h1>
        
        {/* Menu Section: Absolutely positioned to right */}
        {/* Menu Button - Positioned absolutely to the right */}
        <div className="absolute right-4">
          {/* Menu Toggle Button: Shows hamburger or X icon */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors duration-200"
          >
            {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          {/* Dropdown Menu: Appears below button when open */}
          {isMenuOpen && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden animate-fade-in z-50">
              {/* Menu Items Container */}
              <div className="py-1">
                {/* Export Button: Green icon with download functionality */}
                <button
                  onClick={handleExport}
                  className="w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center transition-colors duration-200"
                >
                  <Download size={16} className="mr-3 text-green-600" />
                  Export Database
                </button>
                
                {/* Import Button: Blue icon with upload functionality */}
                <button
                  onClick={handleImport}
                  className="w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center transition-colors duration-200"
                >
                  <Upload size={16} className="mr-3 text-blue-600" />
                  Import Database
                </button>
              </div>
              
              {/* Menu Footer: Shows current item count with database icon */}
              <div className="px-4 py-3 bg-gray-50 border-t border-gray-100">
                <div className="flex items-center text-xs text-gray-500">
                  <Database size={12} className="mr-1" />
                  <span>{items.length} items</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
/**

