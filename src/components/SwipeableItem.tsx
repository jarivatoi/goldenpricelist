import React, { useState, useRef, useEffect } from 'react';
import { Edit, Trash2 } from 'lucide-react';
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
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Format price with Rs
  const formattedPrice = `Rs ${item.price.toFixed(2)}`;
  
  // Format date as dd-mmm-yyyy
  const formatDate = (date: Date) => {
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    
    const day = date.getDate().toString().padStart(2, '0');
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    
    return `${day}-${month}-${year}`;
  };
  
  const formattedDate = formatDate(item.createdAt);
  const isEdited = !!item.lastEditedAt;
  const formattedEditDate = item.lastEditedAt ? formatDate(item.lastEditedAt) : '';

  // Reset position
  const resetPosition = () => {
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
  const handleDragMove = (clientX: number) => {
    if (!isDragging) return;
    
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
    if (revealWidth >= 100) {
      setRevealWidth(150); // Full reveal (delete zone)
    } else if (revealWidth >= 50) {
      setRevealWidth(75);  // Half reveal (edit zone)
    } else {
      setRevealWidth(0);   // Reset position
    }
  };

  // Touch events
  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    handleDragStart(e.touches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();
    handleDragMove(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    e.preventDefault();
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
      handleDragMove(e.clientX);
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

  // Handle card click (when actions are revealed)
  const handleCardClick = () => {
    if (revealWidth >= 100) {
      onDelete(item.id);
      resetPosition();
    } else if (revealWidth >= 50) {
      onEdit(item);
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
    <div 
      ref={containerRef}
      className="relative rounded-lg mb-3 select-none"
      style={{ height: '80px' }} // Increased height for date
    >
      {/* Action buttons background - always rendered with higher z-index */}
      <div className="absolute top-0 right-0 h-full w-[150px] flex z-20 rounded-lg overflow-hidden">
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

      {/* Main card - stays in place with pale golden background */}
      <div 
        className="absolute top-0 left-0 h-full p-4 shadow-sm border border-gray-200 cursor-pointer rounded-lg z-10"
        style={{ 
          width: `calc(100% - ${revealWidth}px)`,
          userSelect: 'none',
          WebkitUserSelect: 'none',
          transition: isDragging ? 'none' : 'width 0.2s ease-out',
          backgroundColor: '#fefce8' // Pale golden background
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onClick={handleCardClick}
      >
        <div className="flex justify-between items-center pointer-events-none h-full">
          <div className="flex-1 pr-4">
            <div className="font-medium text-gray-800 truncate mb-1">
              {item.name}
            </div>
            <div className="text-xs text-gray-500">
              {isEdited ? (
                <span>
                  {formattedEditDate} <span className="text-blue-600 font-medium">(Last edited)</span>
                </span>
              ) : (
                formattedDate
              )}
            </div>
          </div>
          <div className="text-right">
            <div className="font-semibold text-gray-900 whitespace-nowrap">
              {formattedPrice}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SwipeableItem;