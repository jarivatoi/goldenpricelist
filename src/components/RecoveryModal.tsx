import React, { useState } from 'react';
import { Upload, AlertCircle, FileText, Calendar, Hash, X } from 'lucide-react';
import { backupManager } from '../utils/backupManager';
import { PriceItem } from '../types';

interface RecoveryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRecover: (items: PriceItem[]) => Promise<void>;
}

const RecoveryModal: React.FC<RecoveryModalProps> = ({ isOpen, onClose, onRecover }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleFileSelect = async (file: File) => {
    if (!file) return;

    setIsProcessing(true);
    setError('');

    try {
      const result = await backupManager.parseBackupFile(file);
      
      if (!result) {
        setError('Invalid backup file. Please select a valid Golden Price List backup file.');
        return;
      }

      const { items, metadata } = result;
      
      if (items.length === 0) {
        setError('This backup file is empty.');
        return;
      }

      // Confirm recovery
      const confirmMessage = `Found ${items.length} items in this backup from ${
        new Date(metadata.exportDate).toLocaleDateString()
      }. Restore this data?`;
      
      if (window.confirm(confirmMessage)) {
        await onRecover(items);
        onClose();
      }
    } catch (err) {
      setError('Failed to process backup file. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-md overflow-hidden animate-fade-in">
        <div className="flex justify-between items-center p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Restore Your Data</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6">
          {/* Info message */}
          <div className="flex items-start gap-3 mb-6 p-3 bg-blue-50 rounded-lg">
            <AlertCircle className="text-blue-600 mt-0.5" size={16} />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Your price list is empty</p>
              <p>This might be because browser cache was cleared or this is your first time using the app. If you have a backup file, you can restore your data below.</p>
            </div>
          </div>

          {/* File drop zone */}
          <div
            className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
              isDragOver 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <Upload className="mx-auto mb-3 text-gray-400" size={32} />
            <p className="text-gray-600 mb-2">
              Drop your backup file here or click to browse
            </p>
            <p className="text-xs text-gray-500 mb-4">
              Supports: golden-price-list-backup-*.json files
            </p>
            
            <input
              type="file"
              accept=".json"
              onChange={handleFileInput}
              className="hidden"
              id="backup-file-input"
              disabled={isProcessing}
            />
            
            <label
              htmlFor="backup-file-input"
              className={`inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer transition-colors ${
                isProcessing ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <FileText size={16} className="mr-2" />
              {isProcessing ? 'Processing...' : 'Choose File'}
            </label>
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          {/* Instructions */}
          <div className="mt-6 text-xs text-gray-500">
            <p className="font-medium mb-2">Where to find backup files:</p>
            <ul className="space-y-1 ml-4">
              <li>• Check your Downloads folder</li>
              <li>• Look for files starting with "golden-price-list-backup-"</li>
              <li>• Files are automatically created when you add/edit items</li>
            </ul>
          </div>
        </div>

        <div className="px-6 pb-6">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
          >
            Skip Recovery
          </button>
        </div>
      </div>
    </div>
  );
};

export default RecoveryModal;