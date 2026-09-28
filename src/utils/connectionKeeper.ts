/**
 * ConnectionKeeper manages clean tab visibility restoration and prevents memory leaks.
 * Aggressive background intervals and polling have been completely removed to avoid
 * memory exhaustion (Aw, Snap! / Out of Memory) on background tabs.
 */
import { DataSyncManager } from './DataSyncManager';

let isInitialized = false;

export function initConnectionKeeper(): () => void {
  if (isInitialized || typeof window === 'undefined') {
    return () => {};
  }
  isInitialized = true;

  // 1. Passive Visibility Change: only run when tab is actively viewed (zero background CPU/memory)
  const handleVisibilityChange = () => {
    if (document.visibilityState === 'visible' && navigator.onLine) {
      // Trigger pending sync queue flush in DataSyncManager
      try {
        DataSyncManager.flushPendingQueue();
      } catch (e) {
        console.warn('Sync flush notice on tab focus:', e);
      }

      // Notify window of reconnection
      window.dispatchEvent(new CustomEvent('app-tab-restored', { detail: { time: Date.now() } }));
    }
  };

  document.addEventListener('visibilitychange', handleVisibilityChange);

  // 2. Online network restoration
  const handleOnline = () => {
    try {
      DataSyncManager.flushPendingQueue();
    } catch (e) {}
  };

  window.addEventListener('online', handleOnline);

  // 3. Suppress transient background disconnect noise
  const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
    const reason = event.reason;
    const msg = typeof reason === 'string' ? reason : reason?.message || '';
    if (
      msg.includes('Failed to fetch') ||
      msg.includes('NetworkError') ||
      msg.includes('WebSocket') ||
      msg.includes('aborted')
    ) {
      event.preventDefault();
      console.warn('[ConnectionKeeper] Suppressed transient background disconnection:', msg);
    }
  };

  window.addEventListener('unhandledrejection', handleUnhandledRejection);

  // Cleanup handler
  return () => {
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    isInitialized = false;
  };
}
