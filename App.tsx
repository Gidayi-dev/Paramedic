import React from 'react';
import { Provider } from 'react-redux';
import { store } from './src/state/store';
import TriageFormScreen from './src/ui/screens/TriageFormScreen';
import { useNetworkSync } from './src/sync/useNetworkSync';

const AppContent = () => {
  useNetworkSync(); // starts the network listener and auto-sync
  return <TriageFormScreen />;
};

const App = () => {
  return (
    <Provider store={store}>
      <AppContent />
    </Provider>
  );
};

export default App;