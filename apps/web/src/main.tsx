import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { App } from './App';
import { initAnalytics } from './lib/analytics';
import './styles.css';

initAnalytics(import.meta.env.VITE_GA4_ID as string | undefined);

const queryClient = new QueryClient();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <App />
        <Toaster richColors position="top-center" />
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
);
