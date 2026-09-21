import { http } from './httpClient';

export interface AuthMeResponse {
  authenticated: boolean;
  user: {
    id: string;
    username: string;
    globalName?: string | null;
    avatarUrl: string;
    roleIds: string[];
  } | null;
}

export async function fetchAuthMe(): Promise<AuthMeResponse> {
  return http.get<AuthMeResponse>('/api/auth/me');
}

export async function logoutAuthSession(): Promise<{ success: boolean }> {
  return http.post<{ success: boolean }>('/api/auth/logout', {});
}
