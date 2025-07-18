import React, { useState } from 'react';
import { Menu, Download, Upload, X, Database } from 'lucide-react';
import { usePriceList } from '../context/PriceListContext';

const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { items, importItems } = usePriceList();

  const handleExport = () => {
    try {
      const dataToExport = {
        version: '1.0',
        exportDate: new Date().toISOString(),
        items: items.map(item => ({
          ...item,
          createdAt: item.createdAt.toISOString(),
          lastEditedAt: item.lastEditedAt?.toISOString()
        }))
      };

      const dataStr = JSON.stringify(dataToExport, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `golden-price-list-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      setIsMenuOpen(false);
    } catch (error) {
      alert('Error exporting data. Please try again.');
    }
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const content = e.target?.result as string;
          const data = JSON.parse(content);
          
          // Validate the data structure
          if (!data.items || !Array.isArray(data.items)) {
            throw new Error('Invalid file format');
          }

          // Convert date strings back to Date objects
          const importedItems = data.items.map((item: any) => ({
            ...item,
            createdAt: new Date(item.createdAt),
            lastEditedAt: item.lastEditedAt ? new Date(item.lastEditedAt) : undefined
          }));

          // Confirm import
          const confirmImport = window.confirm(
            `This will import ${importedItems.length} items and replace your current data. Are you sure you want to continue?`
          );

          if (confirmImport) {
            await importItems(importedItems);
            alert(`Successfully imported ${importedItems.length} items!`);
          }
        } catch (error) {
          alert('Error importing file. Please check the file format and try again.');
        }
      };
      
      reader.readAsText(file);
    };
    
    input.click();
    setIsMenuOpen(false);
  };

  return (
    <header className="sticky top-0 bg-white z-20 shadow-sm">
      <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-center relative">
        {/* Centered Title */}
        <h1 className="text-xl font-semibold text-gray-900">Golden Price List</h1>
        
        {/* Menu Button - Positioned absolutely to the right */}
        <div className="absolute right-4">
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors duration-200"
          >
            {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          {isMenuOpen && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden animate-fade-in z-50">
              <div className="py-1">
                <button
                  onClick={handleExport}
                  className="w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center transition-colors duration-200"
                >
                  <Download size={16} className="mr-3 text-green-600" />
                  Export Database
                </button>
                
                <button
                  onClick={handleImport}
                  className="w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center transition-colors duration-200"
                >
                  <Upload size={16} className="mr-3 text-blue-600" />
                  Import Database
                </button>
              </div>
              
              <div className="px-4 py-3 bg-gray-50 border-t border-gray-100">
                <div className="flex items-center text-xs text-gray-500">
                  <Database size={12} className="mr-1" />
                  <span>{items.length} items stored locally</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;