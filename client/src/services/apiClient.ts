import { API_URL } from '../config/api';

export class ApiError extends Error {
  status: number;

  code: string | undefined;

  provider: string | undefined;

  accountId: string | undefined;

  accountEmail: string | undefined;

  constructor(
    status: number,
    message: string,
    code?: string,
    provider?: string,
    accountId?: string,
    accountEmail?: string,
  ) {
    super(message);
    this.status = status;
    this.code = code;
    this.provider = provider;
    this.accountId = accountId;
    this.accountEmail = accountEmail;
  }
}

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_URL}/api${path}`, {
    ...options,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(options.headers ?? {}) },
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new ApiError(
      res.status,
      data.error ?? 'Request failed',
      data.code,
      data.provider,
      data.accountId,
      data.accountEmail,
    );
  }

  return data as T;
}
