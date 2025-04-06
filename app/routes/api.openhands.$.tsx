/**
 * OpenHands API Proxy
 * 
 * This route proxies requests to the OpenHands backend API.
 * It handles authentication and forwards requests to the appropriate endpoints.
 */

import { LoaderFunctionArgs, json } from '@remix-run/node';

// Default API URL - can be overridden in environment variables
const DEFAULT_API_URL = 'http://localhost:8000';

// Get the API URL from environment variables or use the default
const getApiUrl = () => {
  return process.env.OPENHANDS_API_URL || DEFAULT_API_URL;
};

/**
 * Loader function to proxy GET requests to OpenHands API
 */
export async function loader({ request, params }: LoaderFunctionArgs) {
  const apiUrl = getApiUrl();
  const wildcard = params['*'];
  
  if (!wildcard) {
    return json({ error: 'Invalid endpoint' }, { status: 400 });
  }
  
  const url = new URL(request.url);
  const targetUrl = `${apiUrl}/${wildcard}${url.search}`;
  
  try {
    // Forward the request to the OpenHands API
    const response = await fetch(targetUrl, {
      method: request.method,
      headers: {
        'Content-Type': 'application/json',
        // Forward authorization header if present
        ...(request.headers.get('Authorization') 
          ? { 'Authorization': request.headers.get('Authorization')! } 
          : {}),
      },
    });
    
    // Get the response data
    const data = await response.json().catch(() => ({}));
    
    // Return the response with the same status code
    return json(data, { status: response.status });
  } catch (error) {
    console.error(`Error proxying to OpenHands API (${targetUrl}):`, error);
    return json({ error: 'Failed to connect to OpenHands API' }, { status: 500 });
  }
}

/**
 * Action function to proxy POST/PUT/DELETE requests to OpenHands API
 */
export async function action({ request, params }: LoaderFunctionArgs) {
  const apiUrl = getApiUrl();
  const wildcard = params['*'];
  
  if (!wildcard) {
    return json({ error: 'Invalid endpoint' }, { status: 400 });
  }
  
  const url = new URL(request.url);
  const targetUrl = `${apiUrl}/${wildcard}${url.search}`;
  
  try {
    // Get the request body
    const body = await request.json().catch(() => ({}));
    
    // Forward the request to the OpenHands API
    const response = await fetch(targetUrl, {
      method: request.method,
      headers: {
        'Content-Type': 'application/json',
        // Forward authorization header if present
        ...(request.headers.get('Authorization') 
          ? { 'Authorization': request.headers.get('Authorization')! } 
          : {}),
      },
      body: JSON.stringify(body),
    });
    
    // Get the response data
    const data = await response.json().catch(() => ({}));
    
    // Return the response with the same status code
    return json(data, { status: response.status });
  } catch (error) {
    console.error(`Error proxying to OpenHands API (${targetUrl}):`, error);
    return json({ error: 'Failed to connect to OpenHands API' }, { status: 500 });
  }
}