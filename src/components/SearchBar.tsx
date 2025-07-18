import React from 'react';
import { Search, Filter } from 'lucide-react';
import { usePriceList } from '../context/PriceListContext';
import { SortOption } from '../types';

const SearchBar: React.FC = () => {
  const { searchQuery, setSearchQuery, sortOption, setSortOption } = usePriceList();
  const [isFilterOpen, setIsFilterOpen] = React.useState(false);

  const sortOptions: { value: SortOption; label: string }[] = [
    { value: 'name-asc', label: 'Name (A-Z)' },
    { value: 'name-desc', label: 'Name (Z-A)' },
    { value: 'price-asc', label: 'Price (Low to High)' },
    { value: 'price-desc', label: 'Price (High to Low)' },
    { value: 'date-asc', label: 'Oldest First' },
    { value: 'date-desc', label: 'Newest First' },
  ];

  return (
    <div className="sticky bottom-0 bg-white border-t border-gray-200 p-3 shadow-lg">
      <div className="relative flex items-center">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search size={18} className="text-gray-400" />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search items..."
          className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        <button
          onClick={() => setIsFilterOpen(!isFilterOpen)}
          className="absolute inset-y-0 right-0 pr-3 flex items-center"
        >
          <Filter 
            size={18} 
            className={`${sortOption !== 'date-desc' ? 'text-blue-500' : 'text-gray-400'}`} 
          />
        </button>
      </div>

      {isFilterOpen && (
        <div className="mt-2 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden animate-fade-in">
          <div className="p-2">
            <p className="text-sm font-medium text-gray-700 mb-1 px-2">Sort by:</p>
            {sortOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  setSortOption(option.value);
                  setIsFilterOpen(false);
                }}
                className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors ${
                  sortOption === option.value
                    ? 'bg-blue-50 text-blue-700'
                    : 'hover:bg-gray-100 text-gray-700'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchBar;