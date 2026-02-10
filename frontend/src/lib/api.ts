// frontend/src/lib/api.ts
import { z } from 'zod';

// 1. Get the base URL from env, ensuring no trailing slash.
// Default to current origin so nginx `/api` proxy works in production; dev can set NEXT_PUBLIC_API_URL=http://localhost:8000.
const runtimeOrigin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:8000';
const ENV_API_URL = (process.env.NEXT_PUBLIC_API_URL || `${runtimeOrigin}/api`).replace(/\/+$/, '');

// 2. The safe URL builder function
function buildUrl(endpoint: string): string {
  // Remove leading slash from endpoint if present
  let cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

  // Ensure endpoint starts with /api/v1 if not already present
  if (!cleanEndpoint.startsWith('/api/v1')) {
    cleanEndpoint = `/api/v1${cleanEndpoint}`;
  }

  // Combine ROOT + cleanEndpoint
  // ENV_API_URL is guaranteed to NOT have a trailing slash
  // cleanEndpoint is guaranteed to start with /api/v1
  const finalUrl = `${ENV_API_URL}${cleanEndpoint}`;

  // Normalize any accidental double slashes (except http://)
  return finalUrl.replace(/([^:]\/)\/+/g, '$1');
}

// Base options without body
type BaseApiOptions = {
  headers?: Record<string, string>;
  params?: Record<string, string | number>;
};

// Options for methods that can have a body
type BodyApiOptions = BaseApiOptions & {
  body?: any;
};

class ApiError extends Error {
  status: number;
  details: any;

  constructor(message: string, status: number, details: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

async function baseRequest<T>(
  endpoint: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
  options: BodyApiOptions = {}
): Promise<T> {
  const { headers = {}, params, body } = options;

  let url = buildUrl(endpoint);

  if (process.env.NODE_ENV !== 'production') {
    console.log(`[API] ${method} ${url}`);
  }

  if (params) {
    const queryParams = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null) {
        queryParams.append(key, String(value));
      }
    }
    const queryString = queryParams.toString();
    if (queryString) {
      url += `?${queryString}`;
    }
  }

  const config: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  };

  // Inject token if available
  const token = localStorage.getItem('chartforge_token');
  if (token) {
    (config.headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }

  if (body) {
    if (body instanceof FormData) {
      delete (config.headers as Record<string, string>)['Content-Type'];
      config.body = body;
    } else {
      config.body = JSON.stringify(body);
    }
  }

  try {
    const response = await fetch(url, config);

    if (!response.ok) {
      if (response.status === 401) {
        // Handle 401 Unauthorized - clear token and redirect
        localStorage.removeItem('chartforge_token');
        localStorage.removeItem('chartforge_user');
        if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
          window.location.href = '/login';
        }
      }

      let errorDetails;
      try {
        errorDetails = await response.json();
      } catch (e) {
        errorDetails = { message: response.statusText };
      }
      throw new ApiError(
        `API request failed with status ${response.status}`,
        response.status,
        errorDetails
      );
    }

    if (response.status === 204) {
      return null as T;
    }

    return await response.json();
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new Error(error instanceof Error ? error.message : 'An unknown network error occurred');
  }
}

export const api = {
  get: <T>(endpoint: string, options?: BaseApiOptions) => baseRequest<T>(endpoint, 'GET', options),
  post: <T>(endpoint: string, body: any, options?: BaseApiOptions) => baseRequest<T>(endpoint, 'POST', { ...options, body }),
  put: <T>(endpoint: string, body: any, options?: BaseApiOptions) => baseRequest<T>(endpoint, 'PUT', { ...options, body }),
  delete: <T>(endpoint: string, options?: BaseApiOptions) => baseRequest<T>(endpoint, 'DELETE', options),
  patch: <T>(endpoint: string, body: any, options?: BaseApiOptions) => baseRequest<T>(endpoint, 'PATCH', { ...options, body }),
  buildUrl, // Export for debugging or edge cases
};

export { ApiError };

// Example usage with Zod schema validation
export async function fetchAndValidate<T>(
  endpoint: string,
  schema: z.ZodType<T>,
  options: BaseApiOptions = {}
): Promise<T> {
  const data = await api.get<unknown>(endpoint, options);
  const validationResult = schema.safeParse(data);
  if (!validationResult.success) {
    console.error("API response validation failed:", validationResult.error);
    throw new Error("Invalid data structure received from the server.");
  }
  return validationResult.data;
}
