import { POSProvider } from './context/POSContext';
import { Outlet } from 'react-router-dom';
import { Toaster } from 'sonner';

export function POSApp() {
  return (
    <POSProvider>
      <div className="min-h-screen bg-background text-foreground">
        <Outlet />
        <Toaster position="top-center" richColors />
      </div>
    </POSProvider>
  );
}
