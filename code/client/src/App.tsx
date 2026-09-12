import { QueryClientProvider } from '@tanstack/react-query';
import { type JSX } from 'react';
import { AppRouter } from './routes/AppRouter';
import { queryClient } from './lib/queryClient';
import { AppErrorBoundary } from './components/layout/AppErrorBoundary';
import { AuthProvider } from './features/auth/AuthProvider';

export default function App(): JSX.Element {
  return (
    <AppErrorBoundary>
      <AuthProvider>
        <QueryClientProvider client={queryClient}>
          <AppRouter />
        </QueryClientProvider>
      </AuthProvider>
    </AppErrorBoundary>
  );
}
