import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios';

/**
 * Debug Log Interface
 */
export interface HttpDebugLog {
  id: string;
  timestamp: string;
  type: 'request' | 'response' | 'error';
  method: string;
  url: string;
  status?: number;
  durationMs?: number;
  requestHeaders?: any;
  requestParams?: any;
  requestData?: any;
  responseHeaders?: any;
  responseData?: any;
  error?: any;
  isMockOrFallback?: boolean;
}

export type HttpDebugListener = (log: HttpDebugLog) => void;

// In-memory ring buffer of recent HTTP logs for inspection
const debugLogs: HttpDebugLog[] = [];
const MAX_DEBUG_LOGS = 100;
const debugListeners: Set<HttpDebugListener> = new Set();
let isDebugLoggingEnabled = true;

/**
 * Register a listener to stream HTTP debug logs in real time
 */
export const onHttpDebugLog = (listener: HttpDebugListener): (() => void) => {
  debugListeners.add(listener);
  return () => debugListeners.delete(listener);
};

/**
 * Get snapshot of captured request/response debug logs
 */
export const getHttpDebugLogs = (): HttpDebugLog[] => [...debugLogs];

/**
 * Clear captured HTTP debug logs
 */
export const clearHttpDebugLogs = (): void => {
  debugLogs.length = 0;
};

/**
 * Toggle debug logging mode
 */
export const setHttpDebugLogging = (enabled: boolean): void => {
  isDebugLoggingEnabled = enabled;
};

/**
 * Helper to record and broadcast debug log entries to subscribers
 */
function recordDebugLog(log: HttpDebugLog) {
  debugLogs.unshift(log);
  if (debugLogs.length > MAX_DEBUG_LOGS) {
    debugLogs.pop();
  }

  debugListeners.forEach(listener => {
    try {
      listener(log);
    } catch (e) {
      console.error('[HttpDebug] Listener callback failed:', e);
    }
  });
}

function maskSecretValue(value: unknown): unknown {
  if (typeof value !== 'string') return value;
  if (value.trim().length === 0) return value;
  return '••••';
}

function redactSensitiveHeaders(headers: Record<string, any> | undefined): Record<string, any> | undefined {
  if (!headers) return headers;
  const redacted: Record<string, any> = { ...headers };
  for (const key of Object.keys(redacted)) {
    const lower = key.toLowerCase();
    if (lower === 'authorization' || lower === 'x-venny-secret' || lower === 'x-api-key') {
      redacted[key] = maskSecretValue(redacted[key]);
    }
  }
  return redacted;
}

/**
 * Unauthorized Event Payload definition
 */
export interface UnauthorizedEventDetail {
  url?: string;
  status: number;
  message: string;
  timestamp: string;
  method?: string;
}

export type UnauthorizedListener = (detail: UnauthorizedEventDetail) => void;

// In-memory runtime custom API key override
let runtimeApiKey: string | null = null;

// Registry for global 401 unauthorized listeners
const unauthorizedListeners: Set<UnauthorizedListener> = new Set();

/**
 * Resolves the Venny API Key in priority order:
 * 1. Explicit runtime override (setVennyApiKey)
 * 2. Client-side Vite environment variable: import.meta.env.VITE_VENNY_API_KEY
 * 3. LocalStorage cached token (if previously configured in UI)
 * 4. Node process environment if running server-side
 * 5. Default fallback development key
 */
export const getVennyApiKey = (): string => {
  if (runtimeApiKey) return runtimeApiKey;

  // 1. Check client-side Vite environment variables
  try {
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      const viteKey = import.meta.env.VITE_VENNY_API_KEY || (import.meta.env as Record<string, any>).VENNY_API_KEY;
      if (viteKey && typeof viteKey === 'string' && viteKey.trim() !== '') {
        return viteKey.trim();
      }
    }
  } catch {
    // Ignore environment read errors in non-standard environments
  }

  // 2. Check localStorage (for browser runtime user settings)
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const stored = localStorage.getItem('VITE_VENNY_API_KEY') || localStorage.getItem('VENNY_API_KEY');
      if (stored && stored.trim() !== '') {
        return stored.trim();
      }
    } catch {
      // Ignore localStorage access errors
    }
  }

  // 3. Check server-side process environment if applicable
  if (typeof process !== 'undefined' && process.env?.VENNY_API_KEY) {
    return process.env.VENNY_API_KEY;
  }

  // 4. Default non-sensitive placeholder for local development
  return 'configured-secret';
};

/**
 * Updates or overrides the Venny API Key dynamically at runtime
 */
export const setVennyApiKey = (key: string | null): void => {
  runtimeApiKey = key;
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      if (key) {
        localStorage.setItem('VITE_VENNY_API_KEY', key);
      } else {
        localStorage.removeItem('VITE_VENNY_API_KEY');
      }
    } catch {
      // Ignore storage errors
    }
  }
};

/**
 * Subscribes a global callback for 401 Unauthorized responses
 * @returns Unsubscribe function
 */
export const onUnauthorized = (listener: UnauthorizedListener): (() => void) => {
  unauthorizedListeners.add(listener);
  return () => {
    unauthorizedListeners.delete(listener);
  };
};

/**
 * Triggers global 401 Unauthorized event dispatch
 */
export const notifyUnauthorized = (detail: UnauthorizedEventDetail): void => {
  console.warn(
    `[Network Service] Global 401 Unauthorized captured on ${detail.method || 'GET'} ${detail.url || 'endpoint'}: ${detail.message}`
  );

  // Notify registered callbacks
  unauthorizedListeners.forEach((listener) => {
    try {
      listener(detail);
    } catch (err) {
      console.error('[Network Service] Error in unauthorized listener callback:', err);
    }
  });

  // Dispatch browser DOM CustomEvent for decoupled components
  if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
    try {
      window.dispatchEvent(new CustomEvent('venny:unauthorized', { detail }));
    } catch {
      // Ignore event dispatch errors
    }
  }
};

/**
 * Custom typed error class for standardized API errors
 */
export class ApiError extends Error {
  status: number;
  statusText: string;
  data: any;
  url?: string;
  method?: string;

  constructor(
    message: string,
    status: number = 500,
    statusText: string = 'Internal Error',
    data: any = null,
    url?: string,
    method?: string
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.statusText = statusText;
    this.data = data;
    this.url = url;
    this.method = method;
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

/**
 * Create the centralized Axios instance
 */
export const apiClient: AxiosInstance = axios.create({
  baseURL: '',
  timeout: 20000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

/**
 * Request Interceptor:
 * Automatically injects the VITE_VENNY_API_KEY into every request via standard headers,
 * logs the outgoing request URL and headers to verify proper authentication injection,
 * and attaches metadata for full request/response cycle debug tracking.
 */
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const apiKey = getVennyApiKey();
    const method = (config.method || 'GET').toUpperCase();
    const url = config.url || '';

    if (apiKey) {
      // Standard Bearer token authentication
      config.headers.set('Authorization', `Bearer ${apiKey}`);
      // Custom X-Venny-Secret authentication header
      config.headers.set('X-Venny-Secret', apiKey);
      // Fallback x-api-key header
      config.headers.set('x-api-key', apiKey);
    }

    const serializedHeaders = typeof (config.headers as any)?.toJSON === 'function'
      ? (config.headers as any).toJSON()
      : { ...config.headers };
    const redactedHeaders = redactSensitiveHeaders(serializedHeaders);

    // Explicitly log the intercepted request URL, method, and authentication headers
    if (isDebugLoggingEnabled && typeof console !== 'undefined') {
      console.log(
        `%c🔑 [Venny Logging Middleware] ↗ ${method} ${url}`,
        'color: #f59e0b; font-weight: bold;',
        {
          url,
          method,
          isVennyEndpoint: url.startsWith('/api/'),
          apiKey: apiKey ? 'configured' : '(none)',
          apiKeyInjected: Boolean(apiKey),
          apiKeySource: runtimeApiKey ? 'runtime' : 'env/storage/fallback',
          headers: redactedHeaders,
          params: config.params,
          body: config.data,
        }
      );
    }

    // Attach request start timestamp for duration measurement
    const startTime = Date.now();
    (config as any).__startTime = startTime;
    const reqId = `req-${startTime}-${Math.random().toString(36).substring(7)}`;
    (config as any).__reqId = reqId;

    recordDebugLog({
      id: reqId,
      timestamp: new Date().toISOString(),
      type: 'request',
      method,
      url,
      requestHeaders: redactedHeaders,
      requestParams: config.params,
      requestData: config.data,
      isMockOrFallback: false,
    });

    return config;
  },
  (error) => {
    recordDebugLog({
      id: `req-err-${Date.now()}`,
      timestamp: new Date().toISOString(),
      type: 'error',
      method: 'UNKNOWN',
      url: 'UNKNOWN',
      error: error?.message || 'Request setup error',
      isMockOrFallback: true,
    });
    return Promise.reject(error);
  }
);

/**
 * Response Interceptor:
 * Logs full response cycles, checks for mock data overrides, catches 401 Unauthorized responses,
 * and normalizes API errors.
 */
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    const startTime = (response.config as any)?.__startTime;
    const reqId = (response.config as any)?.__reqId || `res-${Date.now()}`;
    const durationMs = startTime ? Date.now() - startTime : undefined;
    const url = response.config?.url || '';
    const method = (response.config?.method || 'GET').toUpperCase();

    // Check if the response data has indicators of static fallback/mocking
    const isMock = Boolean(
      (response.data as any)?._isMock ||
      (response.headers as any)?.['x-mock-data'] === 'true' ||
      url.includes('mock')
    );

    if (isDebugLoggingEnabled && typeof console !== 'undefined') {
      const statusColor = response.status < 400 ? '#10b981' : '#f59e0b';
      const backendTag = isMock
        ? '⚠️ [FALLBACK/MOCK DATA]'
        : '✅ [LIVE VENNY BACKEND]';

      console.log(
        `%c📥 [Venny Logging Middleware] ↘ ${method} ${url} [Status: ${response.status} ${response.statusText || 'OK'}] (${durationMs ?? 0}ms) ${backendTag}`,
        `color: ${statusColor}; font-weight: bold;`,
        {
          url,
          method,
          status: response.status,
          statusText: response.statusText,
          durationMs,
          isMockOrFallback: isMock,
          responseHeaders: response.headers,
          fullResponseBody: response.data,
        }
      );
    }

    recordDebugLog({
      id: reqId,
      timestamp: new Date().toISOString(),
      type: 'response',
      method,
      url,
      status: response.status,
      durationMs,
      responseHeaders: response.headers,
      responseData: response.data,
      isMockOrFallback: isMock,
    });

    return response;
  },
  (error: AxiosError) => {
    const startTime = (error.config as any)?.__startTime;
    const reqId = (error.config as any)?.__reqId || `err-${Date.now()}`;
    const durationMs = startTime ? Date.now() - startTime : undefined;
    const status = error.response?.status;
    const url = error.config?.url || '';
    const method = error.config?.method?.toUpperCase() || 'GET';
    const responseData = error.response?.data as any;

    let errorMessage = error.message;
    if (responseData) {
      errorMessage = responseData.message || responseData.error || errorMessage;
    }

    if (isDebugLoggingEnabled && typeof console !== 'undefined') {
      console.error(
        `%c❌ [Venny Logging Middleware] ↘ ${method} ${url} [Status: ${status || 'NETWORK_ERROR'}] (${durationMs ?? 0}ms)`,
        'color: #ef4444; font-weight: bold;',
        {
          url,
          method,
          status,
          durationMs,
          error: errorMessage,
          headers: redactSensitiveHeaders(error.config?.headers as any),
          fullResponseBody: responseData,
        }
      );
    }

    recordDebugLog({
      id: reqId,
      timestamp: new Date().toISOString(),
      type: 'error',
      method,
      url,
      status,
      durationMs,
      responseData,
      error: errorMessage,
      isMockOrFallback: true,
    });

    // Handle 401 Unauthorized globally
    if (status === 401) {
      const detail: UnauthorizedEventDetail = {
        url,
        method,
        status: 401,
        message: errorMessage || 'Unauthorized: The provided VITE_VENNY_API_KEY is invalid or missing.',
        timestamp: new Date().toISOString(),
      };

      notifyUnauthorized(detail);
    }

    const normalizedError = new ApiError(
      errorMessage || 'Request failed',
      status || 0,
      error.response?.statusText || 'Network Error',
      responseData,
      url,
      method
    );

    return Promise.reject(normalizedError);
  }
);

/**
 * Ergonomic typed helper wrappers around the centralized Axios instance
 */
export const http = {
  /**
   * Perform a GET request returning typed data payload
   */
  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await apiClient.get<T>(url, config);
    return response.data;
  },

  /**
   * Perform a POST request returning typed data payload
   */
  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await apiClient.post<T>(url, data, config);
    return response.data;
  },

  /**
   * Perform a PUT request returning typed data payload
   */
  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await apiClient.put<T>(url, data, config);
    return response.data;
  },

  /**
   * Perform a PATCH request returning typed data payload
   */
  async patch<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await apiClient.patch<T>(url, data, config);
    return response.data;
  },

  /**
   * Perform a DELETE request returning typed data payload
   */
  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await apiClient.delete<T>(url, config);
    return response.data;
  },

  /**
   * Raw request method
   */
  request: apiClient.request.bind(apiClient),
};

export default http;
