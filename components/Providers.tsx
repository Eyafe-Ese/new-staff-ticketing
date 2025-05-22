'use client';

import { Provider } from 'react-redux';
import { store } from '@/store';
import { ReactQueryProvider } from '@/lib/react-query';
import { ReactNode } from 'react';
import { Toaster } from '@/components/ui/sonner';
import { PersistGate } from './PersistGate';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <Provider store={store}>
      <PersistGate>
      <ReactQueryProvider>
        {children}
        <Toaster />
      </ReactQueryProvider>
      </PersistGate>
    </Provider>
  );
} 