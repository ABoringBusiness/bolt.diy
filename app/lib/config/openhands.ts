/**
 * OpenHands Configuration
 * 
 * This module provides configuration options for the OpenHands integration.
 */

// Default API URL
export const DEFAULT_API_URL = 'http://localhost:8000';

// Get the API URL from environment variables or use the default
export const getApiUrl = () => {
  return import.meta.env.VITE_OPENHANDS_API_URL || DEFAULT_API_URL;
};

// Feature flags for OpenHands integration
export const OPENHANDS_FEATURES = {
  // Enable/disable OpenHands integration
  ENABLED: true,
  
  // Enable/disable Git operations via OpenHands
  GIT_ENABLED: true,
  
  // Enable/disable file operations via OpenHands
  FILES_ENABLED: true,
  
  // Enable/disable command execution via OpenHands
  COMMANDS_ENABLED: true,
};

// OpenHands authentication configuration
export const OPENHANDS_AUTH = {
  // Enable/disable authentication
  ENABLED: true,
  
  // Authentication endpoint
  ENDPOINT: '/api/auth/login',
  
  // Token storage key
  TOKEN_KEY: 'openhands_token',
};

// Export the configuration
export const openHandsConfig = {
  apiUrl: getApiUrl(),
  features: OPENHANDS_FEATURES,
  auth: OPENHANDS_AUTH,
};