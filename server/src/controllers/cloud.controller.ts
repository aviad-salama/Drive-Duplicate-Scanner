import type { Request, Response } from 'express';
import { env } from '../config/env.js';
import { getProvider } from '../providers/registry.js';
import { signOAuthState, verifyOAuthState } from '../services/auth.service.js';
import {
  deleteCloudAccount,
  listCloudAccounts,
  saveCloudAccount,
} from '../services/cloudAccount.service.js';
import { z } from 'zod';

const callbackQuerySchema = z.object({
  code: z.string(),
  state: z.string(),
});

// Step 1: The user clicks "Connect cloud" and is redirected to the provider's authorization page.
export function connectHandler(req: Request, res: Response) {
  const provider = getProvider(String(req.params['provider']));
  const state = signOAuthState(req.user!.id, provider.id);
  res.redirect(provider.getAuthUrl(state));
}

// Step 2: The provider redirects back with an authorization code.
export async function callbackHandler(req: Request, res: Response) {
  const dashboard = `${env.CLIENT_URL}/dashboard`;
  try {
    const provider = getProvider(String(req.params['provider']));
    
    const result = callbackQuerySchema.safeParse(req.query);
    if (!result.success) {
      res.redirect(`${dashboard}?error=connect_failed`);
      return;
    }
    
    const { code, state } = result.data;
    
    const { userId, provider: stateProvider } = verifyOAuthState(state);
    if (stateProvider !== provider.id) {
      res.redirect(`${dashboard}?error=connect_failed`);
      return;
    }
    const info = await provider.exchangeCode(code);
    await saveCloudAccount(userId, provider.id, info);
    res.redirect(`${dashboard}?connected=${provider.id}`);
  } catch (error) {
    console.error('Cloud connect failed:', error);
    res.redirect(`${dashboard}?error=connect_failed`);
  }
}

export async function listAccountsHandler(req: Request, res: Response) {
  res.json({ accounts: await listCloudAccounts(req.user!.id) });
}

export async function deleteAccountHandler(req: Request, res: Response) {
  await deleteCloudAccount(String(req.params['id']), req.user!.id);
  res.json({ success: true });
}