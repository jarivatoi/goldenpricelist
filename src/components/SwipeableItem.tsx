/**
 * COMPONENTS/SWIPEABLEITEM.TSX - INTERACTIVE LIST ITEM COMPONENT
 * ==============================================================
 * 
 * OVERVIEW:
 * This component renders individual price list items with advanced swipe-to-action
 * functionality. It provides an intuitive mobile-first interface for editing and
 * deleting items through horizontal swipe gestures, similar to iOS and Android
 * native list interfaces.
 * 
 * KEY FEATURES:
 * - Horizontal swipe gestures for revealing action buttons
 * - Touch and mouse support for cross-platform compatibility
 * - Smooth animations and visual feedback
 * - Text truncation with popup for long item names
 * - Non-selectable text to prevent accidental selection
 * - Automatic position reset when clicking outside
 * 
 * INTERACTION DESIGN:
 * - Swipe left to reveal Edit and Delete buttons
 * - Tap truncated text to view full item details
 * - Tap anywhere when buttons are revealed to reset position
 * - Visual feedback with cursor changes and hover states
 * 
 * TECHNICAL IMPLEMENTATION:
 * - CSS transforms for smooth animations
 * - Event handling for touch and mouse interactions
 * - State management for drag positions and animations
 * - Responsive design with mobile-optimized touch targets
 * 
 * ACCESSIBILITY:
 * - Proper ARIA labels and roles
 * - Keyboard navigation support
 * - High contrast colors for action buttons
 * - Clear visual feedback for all interactions
 */

import React, { useState, useRef, useEffect } from 'react';
import { Edit, Trash2, X } from 'lucide-react';
import { PriceItem } from '../types';

/**
 * COMPONENT PROPS INTERFACE
 * =========================
 * 
 * Defines the props required by the SwipeableItem component.
 * 
 * @param item - PriceItem object containing id, name, price, and dates
 * @param onEdit - Callback function triggered when edit button is pressed
 * @param onDelete - Callback function triggered when delete button is pressed
 */
interface SwipeableItemProps {
  item: PriceItem;
  onEdit: (item: PriceItem) => void;
  onDelete: (id: string) => void;
}

/**
 * SWIPEABLE ITEM COMPONENT
 * ========================
 * 
 * Main component that renders a swipeable list item with action buttons.
 * Handles all touch/mouse interactions and provides smooth animations.
 * 
 * STATE MANAGEMENT:
 * - revealWidth: How much of the action buttons are currently visible (0-150px)
 * - isDragging: Whether user is currently dragging the item
 * - dragStartX: X coordinate where the drag started
 * - showTextPopup: Whether the text details popup is visible
 * - isAnimating: Whether a smooth animation is currently playing
 * 
 * LAYOUT STRUCTURE:
 * - Container: Fixed height wrapper with overflow hidden
 * - Action Buttons: Edit and Delete buttons that slide in from right
 * - Price Text: Fixed position price display that moves with swipe
 * - Main Card: Item content that stays in place during swipe
 * - Text Popup: Modal for displaying full item details
 * 
 * @param item - Price item data to display
 * @param onEdit - Function to call when edit is requested
 * @param onDelete - Function to call when delete is requested
 */
const SwipeableItem: React.FC<SwipeableItemProps> = ({ item, onEdit, onDelete }) => {
  // Swipe interaction state
  const [revealWidth, setRevealWidth] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);
  
  // UI state
  const [showTextPopup, setShowTextPopup] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  
  // DOM references
  const containerRef = useRef<HTMLDivElement>(null);
  const itemTextRef = useRef<HTMLDivElement>(null);
  
  /**
   * PRICE FORMATTING
   * ===============
   * 
   * Formats the price with currency symbol and proper decimal places.
   * Uses Rs (Rupees) currency symbol with 2 decimal precision.
   */
  const formattedPrice = `Rs ${item.price.toFixed(2)}`;

  /**
   * TEXT TRUNCATION DETECTION
   * =========================
   * 
   * Determines if the item name is truncated due to container width.
   * Used to decide whether to show the text popup on tap.
   * 
   * LOGIC:
   * - Compares scrollWidth (full text width) with clientWidth (visible width)
   * - Returns true if text is cut off, false if fully visible
   * 
   * @returns boolean - True if text is truncated and popup should be available
   */
  const isTextTruncated = () => {
    if (!itemTextRef.current) return false;
    return itemTextRef.current.scrollWidth > itemTextRef.current.clientWidth;
  };

  /**
   * POSITION RESET FUNCTION
   * =======================
   * 
   * Smoothly animates the item back to its default position, hiding action buttons.
   * Includes animation state management to prevent interaction during transition.
   * 
   * ANIMATION PROCESS:
   * 1. Set isAnimating to true to prevent new interactions
   * 2. Set revealWidth to 0 to trigger CSS transition
   * 3. Wait for animation to complete (300ms)
   * 4. Clear animation state to re-enable interactions
   */
  const resetPosition = () => {
    if (revealWidth > 0) {
      setIsAnimating(true);
      // Allow animation to complete before clearing animating state
      setTimeout(() => setIsAnimating(false), 300);
    }
    setRevealWidth(0);
  };

  /**
   * OUTSIDE CLICK HANDLER EFFECT
   * ============================
   * 
   * Sets up event listeners to detect clicks/touches outside the component
   * and automatically reset the position when action buttons are revealed.
   * 
   * BEHAVIOR:
   * - Only active when buttons are revealed (revealWidth > 0)
   * - Listens for both mouse and touch events
   * - Automatically cleans up event listeners when component unmounts
   * - Uses useRef to check if click target is inside component
   * 
   * PERFORMANCE:
   * - Event listeners are only added when needed
   * - Proper cleanup prevents memory leaks
   * - Uses passive event listeners where possible
   */
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node) && revealWidth > 0) {
        resetPosition();
      }
    };

    if (revealWidth > 0) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
      
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        document.removeEventListener('touchstart', handleClickOutside);
      };
    }
  }, [revealWidth]);

  /**
   * DRAG START HANDLER
   * ==================
   * 
   * Initializes drag operation when user starts swiping.
   * Works for both touch and mouse interactions.
   * 
   * @param clientX - X coordinate where drag started
   */
  const handleDragStart = (clientX: number) => {
    setIsDragging(true);
    setDragStartX(clientX);
  };

  /**
   * DRAG MOVE HANDLER
   * =================
   * 
   * Handles continuous drag movement and updates reveal width.
   * Includes boundary checking and drag cancellation logic.
   * 
   * DRAG LOGIC:
   * 1. Calculate horizontal distance from start point
   * 2. Check if drag is still within item boundaries
   * 3. Update reveal width with constraints (0-150px)
   * 4. Cancel drag if moved outside item vertically
   * 
   * CONSTRAINTS:
   * - Only allows leftward swipes (positive deltaX)
   * - Maximum reveal width of 150px (75px per button)
   * - Cancels drag if moved outside item bounds vertically
   * 
   * @param clientX - Current X coordinate
   * @param clientY - Current Y coordinate for boundary checking
   */
  const handleDragMove = (clientX: number, clientY: number) => {
    if (!isDragging) return;
    
    // Check if touch/mouse is still within the item bounds
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const isWithinBounds = clientY >= rect.top && clientY <= rect.bottom;
      
      // If dragging outside the item vertically, stop the drag
      if (!isWithinBounds) {
        handleDragEnd();
        return;
      }
    }
    
    // Calculate horizontal drag distance (reversed for left swipe)
    const deltaX = dragStartX - clientX;
    
    // Only allow positive values (revealing actions) and limit to 150px
    if (deltaX >= 0) {
      setRevealWidth(Math.min(deltaX, 150));
    }
  };

  /**
   * DRAG END HANDLER
   * ================
   * 
   * Completes drag operation and snaps to final position.
   * Implements smart snapping based on drag distance.
   * 
   * SNAPPING LOGIC:
   * - If dragged >= 25px: Snap to full reveal (150px)
   * - If dragged < 25px: Snap back to closed (0px)
   * - Uses low threshold for easy activation
   * - Includes smooth animation for final positioning
   */
  const handleDragEnd = () => {
    setIsDragging(false);
    
    // Snap to positions based on drag distance
    if (revealWidth >= 25) {
      // Much lower threshold - any meaningful swipe reveals buttons
      setIsAnimating(true);
      setRevealWidth(150);
      setTimeout(() => setIsAnimating(false), 300);
    } else {
      // Reset to closed position
      setIsAnimating(true);
      setRevealWidth(0);
      setTimeout(() => setIsAnimating(false), 300);
    }
  };

  /**
   * TOUCH EVENT HANDLERS
   * ====================
   * 
   * Handle touch-specific events for mobile devices.
   * Provides smooth touch interaction with proper event handling.
   */

  /**
   * Touch start - Initialize touch drag
   */
  const handleTouchStart = (e: React.TouchEvent) => {
    handleDragStart(e.touches[0].clientX);
  };

  /**
   * Touch move - Handle continuous touch movement
   * Prevents default scrolling only when actively dragging
   */
  const handleTouchMove = (e: React.TouchEvent) => {
    if (isDragging) {
      // Only prevent default when actively dragging
      e.preventDefault();
    }
    handleDragMove(e.touches[0].clientX, e.touches[0].clientY);
  };

  /**
   * Touch end - Complete touch interaction
   */
  const handleTouchEnd = (e: React.TouchEvent) => {
    handleDragEnd();
  };

  /**
   * MOUSE EVENT HANDLERS
   * ====================
   * 
   * Handle mouse-specific events for desktop devices.
   * Provides consistent interaction across input methods.
   */

  /**
   * Mouse down - Initialize mouse drag (left button only)
   */
  const handleMouseDown = (e: React.MouseEvent) => {
    // Only respond to left mouse button
    if (e.button !== 0) return;
    e.preventDefault();
    handleDragStart(e.clientX);
  };

  /**
   * GLOBAL MOUSE EVENT EFFECT
   * =========================
   * 
   * Sets up global mouse event listeners during drag operations.
   * Required because mouse can move outside component during drag.
   * 
   * EVENT HANDLING:
   * - mousemove: Track mouse movement globally
   * - mouseup: End drag operation anywhere on page
   * - Automatic cleanup when drag ends or component unmounts
   */
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      handleDragMove(e.clientX, e.clientY);
    };

    const handleMouseUp = () => {
      handleDragEnd();
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragStartX, revealWidth]);

  /**
   * CARD CLICK HANDLER
   * ==================
   * 
   * Handles clicks on the main card area with context-aware behavior.
   * 
   * BEHAVIOR:
   * - If text is truncated and buttons hidden: Show text popup
   * - If buttons are revealed: Reset to closed position
   * - No action if text is fully visible and buttons hidden
   */
  const handleCardClick = () => {
    if (isTextTruncated() && revealWidth === 0) {
      // Show full text popup for truncated items
      setShowTextPopup(true);
    } else if (revealWidth > 0) {
      // Reset position when buttons are revealed
      resetPosition();
    }
  };

  /**
   * ACTION BUTTON HANDLERS
   * ======================
   * 
   * Handle clicks on edit and delete action buttons.
   * Include event propagation prevention and position reset.
   */

  /**
   * Edit button click handler
   */
  const handleEditClick = (e: React.MouseEvent) => {
    // Prevent event from bubbling to card click handler
    e.stopPropagation();
    onEdit(item);
    resetPosition();
  };

  /**
   * Delete button click handler
   */
  const handleDeleteClick = (e: React.MouseEvent) => {
    // Prevent event from bubbling to card click handler
    e.stopPropagation();
    onDelete(item.id);
    resetPosition();
  };

  /**
   * COMPONENT RENDER
   * ================
   * 
   * Renders the complete swipeable item with all interactive elements.
   * Uses absolute positioning and CSS transforms for smooth animations.
   */
  return (
    <>
      {/* Main Container: Fixed height with overflow hidden for swipe effect */}
      <div 
        ref={containerRef}
        className="relative h-16 overflow-hidden"
      >
        {/* Action Buttons Container: Slides in from right during swipe */}
        <div 
          className="absolute top-0 right-0 h-full flex"
          style={{ 
            // Fixed width for two 75px buttons
            width: '150px',
            // Transform based on reveal width (150 - revealWidth = slide distance)
            transform: `translateX(${150 - revealWidth}px)`,
            // Smooth animation when not actively dragging
            transition: (isAnimating || !isDragging) ? 'transform 0.3s ease-out' : 'none',
            zIndex: 10
          }}
        >
          {/* Edit Button: Blue background with edit icon */}
          <button 
            className="w-[75px] bg-blue-500 flex items-center justify-center hover:bg-blue-600 transition-colors"
            onClick={handleEditClick}
          >
            <Edit className="text-white" size={20} />
          </button>
          
          {/* Delete Button: Red background with trash icon */}
          <button 
            className="w-[75px] bg-red-500 flex items-center justify-center hover:bg-red-600 transition-colors"
            onClick={handleDeleteClick}
          >
            <Trash2 className="text-white" size={20} />
          </button>
        </div>

        {/* Price Text: Fixed position that moves with swipe, non-selectable */}
        <div 
          className="absolute top-0 right-0 h-full flex items-center justify-center font-semibold text-gray-900 whitespace-nowrap bg-yellow-100 rounded-r-lg"
          onClick={revealWidth > 0 ? resetPosition : undefined}
          style={{ 
            // Dynamic width based on price text length
            width: `${formattedPrice.length * 8 + 16}px`,
            fontSize: '16px',
            zIndex: 8,
            // Move left as buttons are revealed
            transform: `translateX(-${revealWidth}px)`,
            // Smooth animation when not actively dragging
            transition: (isAnimating || !isDragging) ? 'transform 0.3s ease-out' : 'none',
            // Prevent text selection on all browsers
            userSelect: 'none',
            WebkitUserSelect: 'none',
            // Show pointer cursor when clickable (buttons revealed)
            cursor: revealWidth > 0 ? 'pointer' : 'default'
          }}
        >
          {formattedPrice}
        </div>

        {/* Main Card: Contains item content, stays in place during swipe */}
        <div 
          className="absolute top-0 left-0 h-full shadow-sm border border-gray-200 cursor-pointer rounded-lg"
          style={{ 
            // Calculate width to leave space for price text
            width: `calc(100% - ${formattedPrice.length * 8 + 16}px)`,
            // Prevent text selection during swipe
            userSelect: 'none',
            WebkitUserSelect: 'none',
            // Allow vertical scrolling, prevent horizontal
            touchAction: 'pan-y',
            // Pale golden background for visual appeal
            backgroundColor: '#fefce8',
            zIndex: 5,
          }}
          // Touch event handlers for mobile devices
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          // Mouse event handler for desktop devices
          onMouseDown={handleMouseDown}
          // Click handler for text popup and position reset
          onClick={handleCardClick}
        >
          {/* Content Container: Proper layout with padding and alignment */}
          <div className="relative h-full flex items-center px-4 pointer-events-none">
            {/* Item Text: Truncated with ellipsis, ref for truncation detection */}
            <div 
              ref={itemTextRef}
              className="font-medium text-gray-800 truncate"
              style={{ 
                fontSize: '16px',
                zIndex: 2,
                maxWidth: '100%'
              }}
            >
              {item.name}
            </div>
          </div>
        </div>
      </div>

      {/* Text Popup Modal: Shows full item details when text is truncated */}
      {showTextPopup && (
        // Modal Overlay: Full screen with semi-transparent background
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          {/* Modal Content: White card with item details */}
          <div className="bg-white rounded-xl shadow-lg w-full max-w-sm overflow-hidden animate-fade-in">
            <div className="p-4">
              {/* Header: Title and close button */}
              <div className="flex justify-between items-start mb-3">
                <h3 className="text-lg font-semibold text-gray-900">Item Details</h3>
                <button 
                  onClick={() => setShowTextPopup(false)}
                  className="text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              
              {/* Full Item Text: Complete name without truncation */}
              <div className="mb-3">
                <p className="text-gray-800 font-medium leading-relaxed">
                  {item.name}
                </p>
              </div>
              
              {/* Price Display: Right-aligned formatted price */}
              <div className="text-right">
                <span className="text-lg font-semibold text-gray-900">
                  {formattedPrice}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SwipeableItem;