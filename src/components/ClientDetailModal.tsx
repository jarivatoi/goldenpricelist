import React from 'react';
import { X, Calendar, Receipt, CreditCard, Plus, Edit2 } from 'lucide-react';
import { Client } from '../types';
import { useCredit } from '../context/CreditContext';

interface ClientDetailModalProps {
  client: Client;
  onClose: () => void;
  onQuickAdd?: (client: Client) => void;
}

/**
 * CLIENT DETAIL MODAL COMPONENT
 * =============================
 * 
 * Shows detailed breakdown of client's transactions and payments
 */
const ClientDetailModal: React.FC<ClientDetailModalProps> = ({ client, onClose, onQuickAdd }) => {
  const { getClientTransactions, getClientPayments, getClientTotalDebt, updateClient } = useCredit();
  const [isEditingName, setIsEditingName] = React.useState(false);
  const [editedName, setEditedName] = React.useState(client.name);
  const [isSaving, setIsSaving] = React.useState(false);
  
  const transactions = getClientTransactions(client.id);
  const payments = getClientPayments(client.id);
  const totalDebt = getClientTotalDebt(client.id);

  const handleSaveName = async () => {
    if (!editedName.trim() || editedName.trim() === client.name) {
      setIsEditingName(false);
      setEditedName(client.name);
      return;
    }

    setIsSaving(true);
    try {
      const updatedClient = {
        ...client,
        name: editedName.trim()
          .split(' ')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
          .join(' ')
      };
      
      await updateClient(updatedClient);
      setIsEditingName(false);
    } catch (error) {
      alert('Failed to update client name');
      setEditedName(client.name);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditingName(false);
    setEditedName(client.name);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-2xl max-h-[80vh] overflow-hidden">
        
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <div>
            {!isEditingName ? (
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-semibold text-gray-900">{client.name}</h2>
                <button
                  onClick={() => setIsEditingName(true)}
                  className="p-1 text-gray-500 hover:text-gray-700 transition-colors"
                  title="Edit client name"
                >
                  <Edit2 size={16} />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  className="text-2xl font-semibold text-gray-900 bg-transparent border-b-2 border-blue-500 focus:outline-none"
                  disabled={isSaving}
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveName();
                    if (e.key === 'Escape') handleCancelEdit();
                  }}
                />
                <div className="flex gap-1">
                  <button
                    onClick={handleSaveName}
                    disabled={isSaving}
                    className="px-2 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
                  >
                    {isSaving ? '...' : '✓'}
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    disabled={isSaving}
                    className="px-2 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600 disabled:opacity-50"
                  >
                    ✕
                  </button>
                </div>
              </div>
            )}
            <p className="text-gray-600">Client ID: {client.id}</p>
          </div>
          <div className="flex items-center gap-2">
            {/* Close Button */}
            <button 
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(80vh - 200px)' }}>
          
          {/* Summary */}
          <div className="bg-red-50 rounded-lg p-4 mb-6">
            <h3 className="text-lg font-semibold text-red-800 mb-2">Outstanding Balance</h3>
            <p className="text-3xl font-bold text-red-600">Rs {totalDebt.toFixed(2)}</p>
          </div>

          {/* Transactions Section */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Receipt size={20} className="text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-800">Items Taken</h3>
            </div>
            
            {transactions.filter(transaction => transaction.amount > 0).length === 0 ? (
              <p className="text-gray-500 text-center py-4">No transactions found</p>
            ) : (
              <div className="space-y-3">
                {transactions
                  .sort((a, b) => b.date.getTime() - a.date.getTime())
                  .map((transaction) => (
                  <div key={transaction.id} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium text-gray-800">{transaction.description}</h4>
                      <span className={`text-lg font-semibold ${
                        transaction.description.toLowerCase().includes('returned')
                          ? 'text-green-600'
                          : transaction.amount === 0
                          ? 'text-transparent'
                          : 'text-red-600'
                      }`}>
                        {transaction.description.toLowerCase().includes('returned')
                          ? 'Returned'
                          : transaction.amount === 0
                          ? ' '
                          : `Rs ${transaction.amount.toFixed(2)}`
                        }
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Calendar size={14} />
                      <span>
                        {transaction.date.toLocaleDateString('en-GB', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric'
                        })} {transaction.date.toLocaleTimeString('en-GB', {
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: false
                        })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Payments Section */}
          {payments.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <CreditCard size={20} className="text-green-600" />
                <h3 className="text-lg font-semibold text-gray-800">Payment History</h3>
              </div>
              
              <div className="space-y-3">
                {payments.map((payment) => (
                  <div key={payment.id} className="bg-green-50 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium text-gray-800">
                        {payment.type === 'partial' ? 'Partial Payment' : 'Full Settlement'}
                      </h4>
                      <span className="text-lg font-semibold text-green-600">
                        -Rs {payment.amount.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Calendar size={14} />
                      <span>
                        {payment.date.toLocaleDateString('en-GB', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric'
                        })} {payment.date.toLocaleTimeString('en-GB', {
                          hour: '2-digit',
                          hour12: false
                        })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50 flex-shrink-0">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-600">Total to be settled:</p>
              <p className="text-xl font-bold text-red-600">Rs {totalDebt.toFixed(2)}</p>
            </div>
            <button
              onClick={onClose}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientDetailModal;

export default ClientDetailModal