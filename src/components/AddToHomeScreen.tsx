import React, { useState, useEffect } from 'react';
import { AddToHomescreen } from '../utils/addToHomescreen';

const AddToHomeScreen: React.FC = () => {
  useEffect(() => {
    // Initialize the add to homescreen utility with your specific configuration
    const addToHomescreen = new AddToHomescreen({
      appName: 'Golden PriceList',
      appIconUrl: 'https://jarivatoi.github.io/goldenpricelist/icon-512.png'
    });

    // Show the prompt after a delay
    const timer = setTimeout(() => {
      addToHomescreen.show();
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  // This component no longer renders anything - the utility handles the UI
  return null;
};

export default AddToHomeScreen;