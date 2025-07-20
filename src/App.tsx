/**
 * APP.TSX - MAIN APPLICATION COMPONENT
 * ====================================
 * 
 * OVERVIEW:
 * This is the root component of the Golden Price List application, a PWA for managing
 * price lists with offline capabilities. It orchestrates all major components and
 * provides the main application structure.
 * 
 * FUNCTIONALITY:
 * - Renders the main application layout with header, forms, and price list
 * - Provides React Context for state management across components
 * - Implements responsive design with mobile-first approach
 * - Includes PWA installation prompt functionality
 * 
 * TECHNOLOGIES USED:
 * - React 18 with TypeScript
 * - Tailwind CSS for styling
 * - React Context API for state management
 * - IndexedDB for offline storage
 * - PWA capabilities with service worker
 * 
 * COMPONENT STRUCTURE:
 * App (Root)
 * ├── PriceListProvider (Context wrapper)
 * │   ├── Header (Navigation and menu)
 * │   ├── AddItemForm (Item creation form)
 * │   ├── PriceList (Main list display)
 * │   ├── SearchBar (Search and filter)
 * │   └── AddToHomeScreen (PWA install prompt)
 * 
 * LAYOUT DESIGN:
 * - Sticky header at top (60px height)
 * - Sticky add form below header (84px height)
 * - Scrollable price list in middle (calculated height)
 * - Sticky search bar at bottom (64px height)
 * - Mobile-optimized with max-width container
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
 * The root component that sets up the application structure and provides
 * global state management through React Context.
 * 
 * COMPONENT HIERARCHY:
 * 1. PriceListProvider - Wraps entire app with context for state management
 * 2. Main container - Flexbox layout with gray background
 * 3. Header - Sticky navigation with app title and menu
 * 4. AddItemForm - Sticky form for adding new price items
 * 5. PriceList - Scrollable list of price items with swipe actions
 * 6. SearchBar - Sticky search and filter controls at bottom
 * 7. AddToHomeScreen - PWA installation prompt (renders conditionally)
 * 
 * STYLING APPROACH:
 * - Mobile-first responsive design
 * - Tailwind CSS utility classes
 * - Sticky positioning for header, form, and search
 * - Calculated heights for optimal space usage
 * - Gray background for visual separation
 * 
 * STATE MANAGEMENT:
 * - All state is managed through PriceListContext
 * - No local state in this component
 * - Context provides items, search, sort, and CRUD operations
 */
function App() {
  return (
    // Context Provider: Wraps entire app with price list state management
    <PriceListProvider>
      {/* Main Container: Full height flex layout with gray background */}
      <div className="min-h-screen bg-gray-50 flex flex-col">
        {/* Header: Sticky navigation bar with app title and menu (60px) */}
        <Header />
        
        {/* Add Form: Sticky form for creating new items (84px when visible) */}
        <AddItemForm />
        
        {/* Price List: Main scrollable content area (calculated height) */}
        <PriceList />
        
        {/* Search Bar: Sticky search and filter controls at bottom (64px) */}
        <SearchBar />
        
        {/* PWA Install: Shows installation prompt on first visit */}
        <AddToHomeScreen />
      </div>
    </PriceListProvider>
  );
}

export default App;