/**
 * OpenHands Status Component
 * 
 * This component displays the connection status to the OpenHands backend.
 */

import { useEffect, useState } from 'react';
import { openHandsApi } from '~/lib/api/openhands';
import { openHandsConfig } from '~/lib/config/openhands';

export function OpenHandsStatus() {
  const [isConnected, setIsConnected] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkConnection = async () => {
      setIsChecking(true);
      try {
        const isHealthy = await openHandsApi.checkHealth();
        setIsConnected(isHealthy);
      } catch (error) {
        console.error('Failed to connect to OpenHands API:', error);
        setIsConnected(false);
      } finally {
        setIsChecking(false);
      }
    };

    // Check connection on mount
    checkConnection();

    // Check connection every 30 seconds
    const interval = setInterval(checkConnection, 30000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  if (!openHandsConfig.features.ENABLED) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 text-xs">
      <div className="flex items-center gap-1">
        <div
          className={`w-2 h-2 rounded-full ${
            isChecking
              ? 'bg-yellow-500'
              : isConnected
              ? 'bg-green-500'
              : 'bg-red-500'
          }`}
        />
        <span className="text-gray-400">
          {isChecking
            ? 'Checking OpenHands...'
            : isConnected
            ? 'OpenHands Connected'
            : 'OpenHands Disconnected'}
        </span>
      </div>
    </div>
  );
}