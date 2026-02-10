import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { QueryClientProvider } from '@/context/queryClient';
import { ManualModeProvider } from '@/contexts/ManualModeContext';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider>
      <ManualModeProvider>
        <App />
      </ManualModeProvider>
    </QueryClientProvider>
  </React.StrictMode>
);