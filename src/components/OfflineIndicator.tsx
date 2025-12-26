import { useOfflinePatients } from '@/hooks/useOfflinePatients';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Wifi, WifiOff, RefreshCw, CloudOff } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export function OfflineIndicator() {
  const { isOnline, isSyncing, pendingSyncCount, syncWithServer } = useOfflinePatients();

  if (isOnline && pendingSyncCount === 0) {
    return null; // Don't show anything when online and synced
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2">
      {!isOnline && (
        <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/30 gap-1.5 py-1.5 px-3">
          <WifiOff className="w-3.5 h-3.5" />
          Offline Mode
        </Badge>
      )}
      
      {pendingSyncCount > 0 && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="sm"
              variant={isOnline ? 'default' : 'outline'}
              onClick={() => isOnline && syncWithServer()}
              disabled={!isOnline || isSyncing}
              className="gap-2"
            >
              {isSyncing ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <CloudOff className="w-4 h-4" />
              )}
              {pendingSyncCount} pending
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {isOnline 
              ? 'Click to sync pending changes'
              : 'Changes will sync when back online'
            }
          </TooltipContent>
        </Tooltip>
      )}
    </div>
  );
}
