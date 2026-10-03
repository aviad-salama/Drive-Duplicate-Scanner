import { API_URL } from '../config/api';
import type { CloudAccount } from '../types/cloud';
import { api } from './apiClient';

const accountBase = (accountId: string) => `${API_URL}/api/accounts/${accountId}`;

export const listAccounts = () =>
  api<{ accounts: CloudAccount[] }>('/cloud/accounts').then((r) => r.accounts);

export const disconnectAccount = (id: string) =>
  api<{ success: boolean }>(`/cloud/accounts/${id}`, { method: 'DELETE' });

// URLs for navigation, EventSource, and img/video elements (not fetch).
export const connectUrl = (provider: string) => `${API_URL}/api/cloud/${provider}/connect`;
export const scanUrl = (accountId: string) => `${accountBase(accountId)}/scan`;
export const thumbnailUrl = (accountId: string, fileId: string) =>
  `${accountBase(accountId)}/files/${fileId}/thumbnail`;
export const streamUrl = (accountId: string, fileId: string) =>
  `${accountBase(accountId)}/files/${fileId}/stream`;

export const deleteFile = (accountId: string, fileId: string) =>
  api<{ success: boolean }>(`/accounts/${accountId}/files/${fileId}`, { method: 'DELETE' });