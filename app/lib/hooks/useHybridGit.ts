/**
 * Hybrid Git Hook
 * 
 * This hook provides Git operations using either WebContainer or OpenHands backend API.
 * It automatically selects the best available option.
 */

import { useCallback, useEffect, useState } from 'react';
import { useGit } from './useGit';
import { useOpenHandsGit } from './useOpenHandsGit';

export function useHybridGit() {
  const webContainerGit = useGit();
  const openHandsGit = useOpenHandsGit();
  
  const [useOpenHands, setUseOpenHands] = useState(false);
  const [ready, setReady] = useState(false);

  // Determine which Git implementation to use
  useEffect(() => {
    if (openHandsGit.ready && openHandsGit.isConnected) {
      setUseOpenHands(true);
      setReady(true);
    } else if (webContainerGit.ready) {
      setUseOpenHands(false);
      setReady(true);
    }
  }, [webContainerGit.ready, openHandsGit.ready, openHandsGit.isConnected]);

  // Clone a Git repository using the selected implementation
  const gitClone = useCallback(
    async (url: string) => {
      if (!ready) {
        throw new Error('Git is not ready');
      }

      if (useOpenHands) {
        return await openHandsGit.gitClone(url);
      } else {
        return await webContainerGit.gitClone(url);
      }
    },
    [ready, useOpenHands, openHandsGit, webContainerGit]
  );

  // Execute a Git command using the selected implementation
  const executeGitCommand = useCallback(
    async (command: string, cwd: string) => {
      if (!ready) {
        throw new Error('Git is not ready');
      }

      if (useOpenHands) {
        return await openHandsGit.executeGitCommand(command, cwd);
      } else {
        // WebContainer doesn't have a direct executeGitCommand method
        // This would need to be implemented or handled differently
        throw new Error('executeGitCommand is only available with OpenHands backend');
      }
    },
    [ready, useOpenHands, openHandsGit]
  );

  return {
    ready,
    gitClone,
    executeGitCommand,
    isUsingOpenHands: useOpenHands,
  };
}