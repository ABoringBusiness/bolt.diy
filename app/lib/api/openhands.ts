/**
 * OpenHands API Client
 * 
 * This module provides a client for interacting with the OpenHands backend API.
 * It handles authentication, Git operations, and other server-side functionality.
 */

import { toast } from 'react-toastify';

// Default API URL - can be overridden in environment variables
const DEFAULT_API_URL = 'http://localhost:8000';

// Get the API URL from environment variables or use the default
const getApiUrl = () => {
  return import.meta.env.VITE_OPENHANDS_API_URL || DEFAULT_API_URL;
};

/**
 * Base API client for OpenHands
 */
class OpenHandsApiClient {
  private apiUrl: string;
  private token: string | null = null;

  constructor() {
    this.apiUrl = getApiUrl();
  }

  /**
   * Set the authentication token
   */
  setToken(token: string) {
    this.token = token;
  }

  /**
   * Clear the authentication token
   */
  clearToken() {
    this.token = null;
  }

  /**
   * Get the authentication headers
   */
  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    return headers;
  }

  /**
   * Make a request to the OpenHands API
   */
  async request<T>(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
    data?: any
  ): Promise<T> {
    const url = `${this.apiUrl}${endpoint}`;
    
    try {
      const response = await fetch(url, {
        method,
        headers: this.getHeaders(),
        body: data ? JSON.stringify(data) : undefined,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API Error (${response.status}): ${errorText}`);
      }

      // For 204 No Content responses, return empty object
      if (response.status === 204) {
        return {} as T;
      }

      return await response.json() as T;
    } catch (error) {
      console.error(`OpenHands API Error (${endpoint}):`, error);
      toast.error(`API Error: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * Check if the API is available
   */
  async checkHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${this.apiUrl}/health`);
      return response.ok;
    } catch (error) {
      console.error('OpenHands API health check failed:', error);
      return false;
    }
  }
}

// Create a singleton instance
export const openHandsApi = new OpenHandsApiClient();

// Export types
export interface Repository {
  id: number;
  name: string;
  full_name: string;
  owner: {
    login: string;
    avatar_url: string;
  };
  html_url: string;
  description: string;
  private: boolean;
  fork: boolean;
  created_at: string;
  updated_at: string;
  pushed_at: string;
  git_url: string;
  ssh_url: string;
  clone_url: string;
  default_branch: string;
}

export interface User {
  id: number;
  login: string;
  name: string;
  avatar_url: string;
  html_url: string;
}