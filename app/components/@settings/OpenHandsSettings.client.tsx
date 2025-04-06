/**
 * OpenHands Settings Component
 * 
 * This component provides settings for the OpenHands integration.
 */

import { useState, useEffect } from 'react';
import { openHandsApi } from '~/lib/api/openhands';
import { openHandsConfig } from '~/lib/config/openhands';

export function OpenHandsSettings() {
  const [apiUrl, setApiUrl] = useState(openHandsConfig.apiUrl);
  const [isConnected, setIsConnected] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Check connection on mount and when API URL changes
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

    checkConnection();
  }, [apiUrl]);

  // Save settings
  const saveSettings = async () => {
    setIsSaving(true);
    try {
      // Save API URL to localStorage
      localStorage.setItem('openhands_api_url', apiUrl);
      
      // Reload the page to apply the new settings
      window.location.reload();
    } catch (error) {
      console.error('Failed to save OpenHands settings:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">OpenHands Integration</h2>
      
      <div className="space-y-2">
        <label htmlFor="api-url" className="block text-sm font-medium">
          API URL
        </label>
        <div className="flex gap-2">
          <input
            id="api-url"
            type="text"
            value={apiUrl}
            onChange={(e) => setApiUrl(e.target.value)}
            className="flex-1 px-3 py-2 border rounded-md text-sm"
            placeholder="http://localhost:8000"
          />
          <button
            onClick={() => {
              setApiUrl(openHandsConfig.apiUrl);
            }}
            className="px-3 py-2 border rounded-md text-sm"
            title="Reset to default"
          >
            Reset
          </button>
        </div>
      </div>
      
      <div className="flex items-center gap-2 text-sm">
        <div
          className={`w-3 h-3 rounded-full ${
            isChecking
              ? 'bg-yellow-500'
              : isConnected
              ? 'bg-green-500'
              : 'bg-red-500'
          }`}
        />
        <span>
          {isChecking
            ? 'Checking connection...'
            : isConnected
            ? 'Connected to OpenHands'
            : 'Not connected to OpenHands'}
        </span>
      </div>
      
      <div className="flex justify-end">
        <button
          onClick={saveSettings}
          disabled={isSaving || isChecking}
          className="px-4 py-2 bg-blue-500 text-white rounded-md text-sm disabled:opacity-50"
        >
          {isSaving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
}