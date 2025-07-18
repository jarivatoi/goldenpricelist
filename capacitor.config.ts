import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.pricelist.app',
  appName: 'Price List',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;