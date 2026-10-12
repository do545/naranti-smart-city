import { useEffect, useState } from 'react';
import { logger } from '../integration/logger';

/** Estado de conexión del navegador. `simulateOffline` lo fuerza para pruebas. */
export function useNetworkStatus(simulateOffline = false) {
  const [online, setOnline] = useState(() => navigator.onLine);
  useEffect(() => {
    const up = () => {
      setOnline(true);
      logger.info('network-online');
    };
    const down = () => {
      setOnline(false);
      logger.warn('network-offline');
    };
    window.addEventListener('online', up);
    window.addEventListener('offline', down);
    return () => {
      window.removeEventListener('online', up);
      window.removeEventListener('offline', down);
    };
  }, []);
  return online && !simulateOffline;
}
