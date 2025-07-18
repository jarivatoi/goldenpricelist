import React from 'react';
import { List, ArrowUp } from 'lucide-react';

const EmptyState: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <ArrowUp size={24} className="text-blue-500 animate-bounce mb-4" />
      <div className="bg-blue-50 p-4 rounded-full mb-4">
        <List size={36} className="text-blue-500" />
      </div>
      <h2 className="text-xl font-semibold text-gray-800 mb-2">Your price list is empty</h2>
      <p className="text-gray-600 mb-6 max-w-xs">
        Add your first item using the "Add New Item" button above
      </p>
    </div>
  );
};

export default EmptyState;