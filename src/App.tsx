import React from 'react';
import Header from './components/Header';
import AddItemForm from './components/AddItemForm';
import PriceList from './components/PriceList';
import SearchBar from './components/SearchBar';
import { PriceListProvider } from './context/PriceListContext';

function App() {
  return (
    <PriceListProvider>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header />
        <AddItemForm />
        <PriceList />
        <SearchBar />
      </div>
    </PriceListProvider>
  );
}

export default App;