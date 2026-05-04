import { Wifi, WifiOff, Clock, TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { usePOS } from '../context/POSContext';
import { useEffect, useState } from 'react';

export function SessionBadge() {
  const { state, cartTotal } = usePOS();
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 10000);
    return () => clearInterval(timer);
  }, []);

  const sessionTotal = state.session?.expectedCash
    ? state.session.expectedCash - (state.session.openingBalance || 0)
    : null;

  return (
    <div className="flex items-center gap-2 text-sm">
      {/* Online/offline */}
      {state.isOnline ? (
        <Badge variant="secondary" className="gap-1 text-green-700 bg-green-100 dark:text-green-400 dark:bg-green-900/30 text-xs">
          <Wifi className="w-3 h-3" /> En ligne
        </Badge>
      ) : (
        <Badge variant="destructive" className="gap-1 text-xs">
          <WifiOff className="w-3 h-3" />
          Hors ligne
          {state.pendingCount > 0 && (
            <span className="ml-1 bg-white/20 rounded px-1">{state.pendingCount}</span>
          )}
        </Badge>
      )}

      {/* Session sales total */}
      {sessionTotal !== null && sessionTotal > 0 && (
        <div className="hidden sm:flex items-center gap-1 text-xs text-muted-foreground bg-muted/50 rounded-full px-2 py-0.5">
          <TrendingUp className="w-3 h-3 text-green-600" />
          <span className="font-mono font-medium">{sessionTotal.toLocaleString()} XOF</span>
        </div>
      )}

      {/* Cashier name */}
      {state.user && (
        <span className="text-muted-foreground hidden lg:block text-xs font-medium">
          {state.user.name}
        </span>
      )}

      {/* Session open time */}
      {state.session && (
        <span className="text-muted-foreground hidden md:flex items-center gap-1 text-xs">
          <Clock className="w-3 h-3" />
          {new Date(state.session.openedAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
        </span>
      )}

      {/* Clock */}
      <span className="font-mono text-xs font-medium text-foreground tabular-nums">
        {time.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
      </span>
    </div>
  );
}
