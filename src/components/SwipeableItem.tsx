import React, { useState, useRef, useEffect } from 'react';
import { Edit, Trash2, X } from 'lucide-react';
import { PriceItem } from '../types';

interface SwipeableItemProps {
  item: PriceItem;
  onEdit: (item: PriceItem) => void;
  onDelete: (id: string) => void;
}

const SwipeableItem: React.FC<SwipeableItemProps> = ({ item, onEdit, onDelete }) => {
  const [revealWidth, setRevealWidth] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);
  const [showTextPopup, setShowTextPopup] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const itemTextRef = useRef<HTMLDivElement>(null);
  
  // Format price with Rs
  const formattedPrice = `Rs ${item.price.toFixed(2)}`;

  // Check if text is truncated
  const isTextTruncated = () => {
    if (!itemTextRef.current) return false;
    return itemTextRef.current.scrollWidth > itemTextRef.current.clientWidth;
  };

  // Reset position
  const resetPosition = () => {
    if (revealWidth > 0) {
      setIsAnimating(true);
      // Allow animation to complete before clearing animating state
      setTimeout(() => setIsAnimating(false), 300);
    }
    setRevealWidth(0);
  };

  // Handle clicks outside the container to reset position
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

  // Handle drag start (both mouse and touch)
  const handleDragStart = (clientX: number) => {
    setIsDragging(true);
    setDragStartX(clientX);
  };

  // Handle drag move (both mouse and touch)
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
    
    const deltaX = dragStartX - clientX; // Reversed for left swipe
    
    // Only allow positive values (revealing actions) and limit to 150px
    if (deltaX >= 0) {
      setRevealWidth(Math.min(deltaX, 150));
    }
  };

  // Handle drag end
  const handleDragEnd = () => {
    setIsDragging(false);
    
    // Snap to positions
    if (revealWidth >= 25) {  // Much lower threshold - any meaningful swipe
      setIsAnimating(true);
      setRevealWidth(150); // Full reveal (delete zone)
      setTimeout(() => setIsAnimating(false), 300);
    } else {
      setIsAnimating(true);
      setRevealWidth(0);   // Reset position
      setTimeout(() => setIsAnimating(false), 300);
    }
  };

  // Touch events
  const handleTouchStart = (e: React.TouchEvent) => {
    handleDragStart(e.touches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isDragging) {
      e.preventDefault(); // Only prevent default when actively dragging
    }
    handleDragMove(e.touches[0].clientX, e.touches[0].clientY);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    handleDragEnd();
  };

  // Mouse events
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // Only left mouse button
    e.preventDefault();
    handleDragStart(e.clientX);
  };

  // Global mouse events
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

  // Handle card click (when actions are revealed or text is truncated)
  const handleCardClick = () => {
    if (isTextTruncated() && revealWidth === 0) {
      setShowTextPopup(true);
    } else if (revealWidth > 0) {
      // If buttons are revealed, just reset position when clicking on card
      resetPosition();
    }
  };

  // Direct button clicks
  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit(item);
    resetPosition();
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(item.id);
    resetPosition();
  };

  return (
    <>
      <div 
        ref={containerRef}
        className="relative h-16 overflow-hidden"
      >
        {/* Action buttons container - revealed on swipe */}
        <div 
          className="absolute top-0 right-0 h-full flex"
          style={{ 
            width: '150px',
            transform: `translateX(${150 - revealWidth}px)`,
            transition: (isAnimating || !isDragging) ? 'transform 0.3s ease-out' : 'none',
            zIndex: 10
          }}
        >
          {/* Edit button */}
          <button 
            className="w-[75px] bg-blue-500 flex items-center justify-center hover:bg-blue-600 transition-colors"
            onClick={handleEditClick}
          >
            <Edit className="text-white" size={20} />
          </button>
          
          {/* Delete button */}
          <button 
            className="w-[75px] bg-red-500 flex items-center justify-center hover:bg-red-600 transition-colors"
            onClick={handleDeleteClick}
          >
            <Trash2 className="text-white" size={20} />
          </button>
        </div>

        {/* Price text - initially visible, moves with swipe */}
        <div 
          className="absolute top-0 right-0 h-full flex items-center justify-center font-semibold text-gray-900 whitespace-nowrap bg-yellow-100 rounded-r-lg"
          onClick={revealWidth > 0 ? resetPosition : undefined}
          style={{ 
            width: `${formattedPrice.length * 8 + 16}px`,
            fontSize: '16px',
            zIndex: 8,
            transform: `translateX(-${revealWidth}px)`,
            transition: (isAnimating || !isDragging) ? 'transform 0.3s ease-out' : 'none',
            userSelect: 'none',
            WebkitUserSelect: 'none',
            cursor: revealWidth > 0 ? 'pointer' : 'default'
          }}
        >
          {formattedPrice}
        </div>

        {/* Main card - stays in place */}
        <div 
          className="absolute top-0 left-0 h-full shadow-sm border border-gray-200 cursor-pointer rounded-lg"
          style={{ 
            width: `calc(100% - ${formattedPrice.length * 8 + 16}px)`, // Leave space for price
            userSelect: 'none',
            WebkitUserSelect: 'none',
            touchAction: 'pan-y', // Allow vertical scrolling, prevent horizontal
            backgroundColor: '#fefce8', // Pale golden background
            zIndex: 5,
          }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onMouseDown={handleMouseDown}
          onClick={handleCardClick}
        >
          {/* Content container with proper layout */}
          <div className="relative h-full flex items-center px-4 pointer-events-none">
            {/* Item text - stays fixed, no padding needed since price moves */}
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

      {/* Text popup modal */}
      {showTextPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-sm overflow-hidden animate-fade-in">
            <div className="p-4">
              {/* Header with close button */}
              <div className="flex justify-between items-start mb-3">
                <h3 className="text-lg font-semibold text-gray-900">Item Details</h3>
                <button 
                  onClick={() => setShowTextPopup(false)}
                  className="text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              
              {/* Full item text */}
              <div className="mb-3">
                <p className="text-gray-800 font-medium leading-relaxed">
                  {item.name}
                </p>
              </div>
              
              {/* Price */}
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