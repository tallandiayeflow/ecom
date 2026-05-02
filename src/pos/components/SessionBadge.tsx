import { Wifi, WifiOff, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { usePOS } from '../context/POSContext';
import { useEffect, useState } from 'react';

export function SessionBadge() {
  const { state } = usePOS();
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex items-center gap-3 text-sm">
      {state.isOnline ? (
        <Badge variant="secondary" className="gap-1 text-green-700 bg-green-100 dark:bg-green-900/30">
          <Wifi className="w-3 h-3" /> En ligne
        </Badge>
      ) : (
        <Badge variant="destructive" className="gap-1">
          <WifiOff className="w-3 h-3" />
          Hors ligne
          {state.pendingCount > 0 && ` (${state.pendingCount})`}
        </Badge>
      )}

      {state.user && (
        <span className="text-muted-foreground hidden sm:block">
          {state.user.name}
        </span>
      )}

      {state.session && (
        <span className="text-muted-foreground hidden md:flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {new Date(state.session.openedAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
        </span>
      )}

      <span className="font-mono text-xs text-muted-foreground">
        {time.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
      </span>
    </div>
  );
}
