/**
 * APP.TSX - MAIN APPLICATION COMPONENT
 * ====================================
 * 
 * OVERVIEW:
 * This is the root component of the Golden Price List application, a React-based
 * Progressive Web App (PWA) for managing price lists with offline capabilities.
 * 
 * MAIN FEATURES:
 * - Offline-first architecture using IndexedDB
 * - Swipeable list items with edit/delete actions
 * - Real-time search and sorting
 * - Import/export functionality
 * - PWA installation prompts
 * - Responsive mobile-first design
 * 
 * TECHNOLOGIES USED:
 * - React 18 with TypeScript
 * - Tailwind CSS for styling
 * - Lucide React for icons
 * - IndexedDB for offline storage
 * - Context API for state management
 * 
 * COMPONENT HIERARCHY:
 * App (this file)
 * ├── PriceListProvider (Context wrapper)
 * ├── Header (Navigation and menu)
 * ├── AddItemForm (Add new items)
 * ├── PriceList (Display items)
 * ├── SearchBar (Search and filter)
 * └── AddToHomeScreen (PWA installation)
 */

import React from 'react';
import Header from './components/Header';
import AddItemForm from './components/AddItemForm';
import PriceList from './components/PriceList';
import SearchBar from './components/SearchBar';
import { PriceListProvider } from './context/PriceListContext';
import AddToHomeScreen from './components/AddToHomeScreen';

/**
 * MAIN APP COMPONENT
 * ==================
 * 
 * PURPOSE:
 * Renders the complete application layout with all major components.
 * Wraps everything in PriceListProvider for global state management.
 * 
 * LAYOUT STRUCTURE:
 * - Full height container with gray background
 * - Sticky header at top
 * - Sticky add form below header
 * - Scrollable price list in middle
 * - Sticky search bar at bottom
 * - PWA installation prompt (conditional)
 * 
 * STYLING APPROACH:
 * - Mobile-first responsive design
 * - Flexbox layout for proper spacing
 * - Sticky positioning for key UI elements
 * - Consistent spacing and shadows
 * 
 * STATE MANAGEMENT:
 * All state is managed through PriceListContext, including:
 * - Items array with CRUD operations
 * - Search query and filtering
 * - Sort options
 * - Loading and error states
 * - IndexedDB synchronization
 */
function App() {
  return (
    // Context Provider: Wraps entire app for global state access
    <PriceListProvider>
      {/* Main Container: Full height with gray background */}
      <div className="min-h-screen bg-gray-50 flex flex-col">
        {/* Header: Sticky navigation with menu and export/import */}
        <Header />
        
        {/* Add Form: Sticky form for adding new items */}
        <AddItemForm />
        
        {/* Price List: Main content area with scrollable items */}
        <PriceList />
        
        {/* Search Bar: Sticky bottom search and filter controls */}
        <SearchBar />
        
        {/* PWA Prompt: Conditional installation prompt for mobile */}
        <AddToHomeScreen />
      </div>
    </PriceListProvider>
  );
}

export default App;