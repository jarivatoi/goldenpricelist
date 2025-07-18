import React from 'react';
import Header from './components/Header';
import AddItemForm from './components/AddItemForm';
import PriceList from './components/PriceList';
import SearchBar from './components/SearchBar';
import RecoveryModal from './components/RecoveryModal';
import { PriceListProvider } from './context/PriceListContext';
import { usePriceList } from './context/PriceListContext';

const AppContent: React.FC = () => {
  const { showRecovery, setShowRecovery, importItems } = usePriceList();

  const handleRecover = async (items: any[]) => {
    await importItems(items);
    setShowRecovery(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      <AddItemForm />
      <PriceList />
      <SearchBar />
      
      <RecoveryModal
        isOpen={showRecovery}
        onClose={() => setShowRecovery(false)}
        onRecover={handleRecover}
      />
    </div>
  );
};

function App() {
  return (
    <PriceListProvider>
      <AppContent />
    </PriceListProvider>
  );
}

export default App;