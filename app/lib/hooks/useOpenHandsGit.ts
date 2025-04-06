/**
 * OpenHands Git Hook
 * 
 * This hook provides Git operations using the OpenHands backend API.
 * It's designed to be a drop-in replacement for the useGit hook.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { gitService } from '~/lib/api/git-service';
import { openHandsApi } from '~/lib/api/openhands';
import { toast } from 'react-toastify';

export function useOpenHandsGit() {
  const [ready, setReady] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const fileData = useRef<Record<string, { data: any; encoding?: string }>>({});

  // Check if the OpenHands API is available
  useEffect(() => {
    const checkConnection = async () => {
      try {
        const isHealthy = await openHandsApi.checkHealth();
        setIsConnected(isHealthy);
        setReady(isHealthy);
        
        if (!isHealthy) {
          console.warn('OpenHands API is not available. Falling back to WebContainer Git.');
          toast.warning('OpenHands backend not detected. Some Git features may be limited.');
        }
      } catch (error) {
        console.error('Failed to connect to OpenHands API:', error);
        setIsConnected(false);
        setReady(false);
        toast.error('Failed to connect to OpenHands backend');
      }
    };

    checkConnection();
  }, []);

  // Clone a Git repository using OpenHands API
  const gitClone = useCallback(
    async (url: string) => {
      if (!ready || !isConnected) {
        throw new Error('OpenHands API is not available');
      }

      fileData.current = {};

      try {
        const result = await gitService.cloneRepository(url);
        
        // Convert the files to the format expected by the UI
        const data: Record<string, { data: any; encoding?: string }> = {};
        
        for (const [path, content] of Object.entries(result.files)) {
          data[path] = {
            data: content,
            encoding: 'utf8',
          };
          
          // Store in the fileData ref for later use
          fileData.current[path] = {
            data: content,
            encoding: 'utf8',
          };
        }

        return {
          workdir: result.workdir,
          data,
        };
      } catch (error) {
        console.error('Git clone error:', error);
        toast.error(`Git clone error: ${(error as Error).message}`);
        throw error;
      }
    },
    [ready, isConnected]
  );

  // Execute a Git command using OpenHands API
  const executeGitCommand = useCallback(
    async (command: string, cwd: string) => {
      if (!ready || !isConnected) {
        throw new Error('OpenHands API is not available');
      }

      try {
        const result = await gitService.executeGitCommand(command, cwd);
        return result;
      } catch (error) {
        console.error('Git command error:', error);
        toast.error(`Git command error: ${(error as Error).message}`);
        throw error;
      }
    },
    [ready, isConnected]
  );

  return {
    ready,
    isConnected,
    gitClone,
    executeGitCommand,
  };
}