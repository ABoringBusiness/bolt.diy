/**
 * Git Service
 * 
 * This module provides Git operations using the OpenHands backend API.
 * It handles repository operations like clone, push, pull, etc.
 */

import { openHandsApi, Repository, User } from './openhands';

/**
 * Git Service for interacting with repositories via OpenHands API
 */
export class GitService {
  /**
   * Get user information from the Git provider
   */
  async getUser(): Promise<User> {
    return await openHandsApi.request<User>('/api/user/info');
  }

  /**
   * Get repositories for the authenticated user
   */
  async getRepositories(sort: string = 'pushed'): Promise<Repository[]> {
    return await openHandsApi.request<Repository[]>(`/api/user/repositories?sort=${sort}`);
  }

  /**
   * Search for repositories
   */
  async searchRepositories(
    query: string,
    perPage: number = 5,
    sort: string = 'stars',
    order: string = 'desc'
  ): Promise<Repository[]> {
    return await openHandsApi.request<Repository[]>(
      `/api/user/search/repositories?query=${encodeURIComponent(query)}&per_page=${perPage}&sort=${sort}&order=${order}`
    );
  }

  /**
   * Clone a repository
   * 
   * @param repoUrl The URL of the repository to clone
   * @param targetDir The directory to clone into (optional)
   */
  async cloneRepository(repoUrl: string, targetDir?: string): Promise<{ workdir: string; files: Record<string, any> }> {
    const response = await openHandsApi.request<{ workdir: string; files: Record<string, any> }>(
      '/api/git/clone',
      'POST',
      {
        url: repoUrl,
        target_dir: targetDir,
      }
    );
    
    return response;
  }

  /**
   * Execute a Git command
   * 
   * @param command The Git command to execute
   * @param cwd The working directory
   */
  async executeGitCommand(command: string, cwd: string): Promise<{ output: string; exitCode: number }> {
    return await openHandsApi.request<{ output: string; exitCode: number }>(
      '/api/git/execute',
      'POST',
      {
        command,
        cwd,
      }
    );
  }
}

// Create a singleton instance
export const gitService = new GitService();