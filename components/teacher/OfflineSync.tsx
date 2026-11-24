'use client';

import { useCallback, useEffect, useState } from 'react';
import { CloudOff, RefreshCw, CheckCircle2 } from 'lucide-react';
import { QUEUE_EVENT, flushQueue, getPendingCount } from '@/lib/offline/queue';

/** Banner + background sync for the offline queue. Mounted once in the teacher layout. */
export function OfflineSync() {
  const [online, setOnline] = useState(true);
  const [pending, setPending] = useState(0);
  const [syncedCount, setSyncedCount] = useState<number | null>(null);

  const refresh = useCallback(async () => {
    setPending(await getPendingCount());
  }, []);

  const sync = useCallback(async () => {
    const result = await flushQueue();
    if (result.sent > 0) {
      setSyncedCount(result.sent);
      window.setTimeout(() => setSyncedCount(null), 6000);
    }
    await refresh();
  }, [refresh]);

  useEffect(() => {
    setOnline(navigator.onLine);
    void refresh();
    if (navigator.onLine) void sync();

    const handleOnline = () => {
      setOnline(true);
      void sync();
    };
    const handleOffline = () => setOnline(false);
    const handleQueue = () => void refresh();

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener(QUEUE_EVENT, handleQueue);
    const interval = window.setInterval(() => {
      if (navigator.onLine) void sync();
    }, 20000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener(QUEUE_EVENT, handleQueue);
      window.clearInterval(interval);
    };
  }, [refresh, sync]);

  if (!online) {
    return (
      <div role="status" className="flex items-center gap-2 bg-warning px-4 py-2 text-sm font-medium text-foreground">
        <CloudOff className="h-4 w-4 shrink-0" aria-hidden />
        Hakuna mtandao. Data inahifadhiwa na itatumwa mtandao ukirejea{pending > 0 ? ` (zinasubiri: ${pending})` : ''}.
      </div>
    );
  }
  if (pending > 0) {
    return (
      <div role="status" className="flex items-center gap-2 bg-primary px-4 py-2 text-sm font-medium text-white">
        <RefreshCw className="h-4 w-4 shrink-0 animate-spin" aria-hidden />
        Inasawazisha data ({pending} zinasubiri)...
      </div>
    );
  }
  if (syncedCount !== null) {
    return (
      <div role="status" className="flex items-center gap-2 bg-success px-4 py-2 text-sm font-medium text-white">
        <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden />
        Imesawazishwa: {syncedCount}
      </div>
    );
  }
  return null;
}
