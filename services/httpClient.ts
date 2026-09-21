import axios, {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from 'axios';

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

const debugLogs: HttpDebugLog[] = [];
const MAX_DEBUG_LOGS = 100;
const debugListeners = new Set<HttpDebugListener>();
let isDebugLoggingEnabled = true;

export const onHttpDebugLog = (listener: HttpDebugListener): (() => void) => {
  debugListeners.add(listener);
  return () => debugListeners.delete(listener);
};

export const getHttpDebugLogs = (): HttpDebugLog[] => [...debugLogs];
export const clearHttpDebugLogs = (): void => { debugLogs.length = 0; };
export const setHttpDebugLogging = (enabled: boolean): void => { isDebugLoggingEnabled = enabled; };

function recordDebugLog(log: HttpDebugLog) {
  if (!isDebugLoggingEnabled) return;
  debugLogs.unshift(log);
  if (debugLogs.length > MAX_DEBUG_LOGS) debugLogs.pop();
  debugListeners.forEach((listener) => {
    try { listener(log); } catch { /* ignore */ }
  });
}

export interface UnauthorizedEventDetail {
  url?: string;
  status: number;
  message: string;
  timestamp: string;
  method?: string;
}

export type UnauthorizedListener = (detail: UnauthorizedEventDetail) => void;

let runtimeApiKey: string | null = null;
const unauthorizedListeners = new Set<UnauthorizedListener>();

export const getVennyApiKey = (): string => {
  if (runtimeApiKey) return runtimeApiKey;
  try {
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      const viteKey = import.meta.env.VITE_VENNY_API_KEY;
      if (viteKey && String(viteKey).trim()) return String(viteKey).trim();
    }
  } catch { /* ignore */ }
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const stored = localStorage.getItem('VITE_VENNY_API_KEY') || localStorage.getItem('VENNY_API_KEY');
      if (stored?.trim()) return stored.trim();
    } catch { /* ignore */ }
  }
  if (typeof process !== 'undefined' && process.env?.VENNY_API_KEY) {
    return process.env.VENNY_API_KEY;
  }
  return '';
};

export const setVennyApiKey = (key: string | null): void => {
  runtimeApiKey = key;
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      if (key) localStorage.setItem('VITE_VENNY_API_KEY', key);
      else localStorage.removeItem('VITE_VENNY_API_KEY');
    } catch { /* ignore */ }
  }
};

export const onUnauthorized = (listener: UnauthorizedListener): (() => void) => {
  unauthorizedListeners.add(listener);
  return () => unauthorizedListeners.delete(listener);
};

export const notifyUnauthorized = (detail: UnauthorizedEventDetail): void => {
  unauthorizedListeners.forEach((listener) => {
    try { listener(detail); } catch { /* ignore */ }
  });
  if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
    try { window.dispatchEvent(new CustomEvent('venny:unauthorized', { detail })); } catch { /* ignore */ }
  }
};

export class ApiError extends Error {
  status: number;
  statusText: string;
  data: any;
  url?: string;
  method?: string;
  constructor(message: string, status = 500, statusText = 'Internal Error', data: any = null, url?: string, method?: string) {
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

export const apiClient: AxiosInstance = axios.create({
  baseURL: '',
  timeout: 20000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const apiKey = getVennyApiKey();
  if (apiKey) {
    config.headers.set('Authorization', `Bearer ${apiKey}`);
    config.headers.set('X-Venny-Secret', apiKey);
    config.headers.set('x-api-key', apiKey);
  }
  const startTime = Date.now();
  (config as any).__startTime = startTime;
  (config as any).__reqId = `req-${startTime}`;
  recordDebugLog({
    id: (config as any).__reqId,
    timestamp: new Date().toISOString(),
    type: 'request',
    method: (config.method || 'GET').toUpperCase(),
    url: config.url || '',
  });
  return config;
});

apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    const startTime = (response.config as any)?.__startTime;
    recordDebugLog({
      id: (response.config as any)?.__reqId || `res-${Date.now()}`,
      timestamp: new Date().toISOString(),
      type: 'response',
      method: (response.config?.method || 'GET').toUpperCase(),
      url: response.config?.url || '',
      status: response.status,
      durationMs: startTime ? Date.now() - startTime : undefined,
      responseData: response.data,
    });
    return response;
  },
  (error: AxiosError) => {
    const status = error.response?.status;
    const url = error.config?.url || '';
    const method = error.config?.method?.toUpperCase() || 'GET';
    const responseData = error.response?.data as any;
    const errorMessage = responseData?.message || responseData?.error || error.message;
    if (status === 401) {
      notifyUnauthorized({
        url,
        method,
        status: 401,
        message: errorMessage || 'Unauthorized',
        timestamp: new Date().toISOString(),
      });
    }
    return Promise.reject(new ApiError(errorMessage || 'Request failed', status || 0, error.response?.statusText || 'Network Error', responseData, url, method));
  }
);

export const http = {
  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return (await apiClient.get<T>(url, config)).data;
  },
  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return (await apiClient.post<T>(url, data, config)).data;
  },
  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return (await apiClient.put<T>(url, data, config)).data;
  },
  async patch<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return (await apiClient.patch<T>(url, data, config)).data;
  },
  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return (await apiClient.delete<T>(url, config)).data;
  },
  request: apiClient.request.bind(apiClient),
};

export default http;
