export interface CloudAuthorizationContext {
  accountId?: string;
  accountEmail?: string;
}

export class AppError extends Error {
  status: number;

  code: string | undefined;

  constructor(status: number, message: string, code?: string) {
    super(message);
    this.name = new.target.name;
    this.status = status;
    this.code = code;
  }
}

export class CloudAuthorizationError extends AppError {
  provider: string;

  accountId: string | undefined;

  accountEmail: string | undefined;

  constructor(provider: string, context: CloudAuthorizationContext = {}) {
    super(401, 'Cloud authorization expired or was revoked.', 'CLOUD_REAUTH_REQUIRED');
    this.provider = provider;
    this.accountId = context.accountId;
    this.accountEmail = context.accountEmail;
  }
}

export function isCloudAuthorizationFailure(error: unknown): boolean {
  if (error instanceof CloudAuthorizationError) {
    return true;
  }

  if (!error || typeof error !== 'object') {
    return false;
  }

  const candidate = error as {
    code?: unknown;
    status?: unknown;
    statusCode?: unknown;
    message?: unknown;
    response?: { status?: unknown; data?: unknown };
  };

  const body = candidate.response?.data;
  let responseBody: { error?: unknown; error_description?: unknown } | undefined;
  if (body && typeof body === 'object') {
    responseBody = body as { error?: unknown; error_description?: unknown };
  }

  return candidate.code === 'invalid_grant'
    || responseBody?.error === 'invalid_grant'
    || (typeof responseBody?.error_description === 'string'
      && /invalid_grant/i.test(responseBody.error_description))
    || candidate.status === 401
    || candidate.statusCode === 401
    || candidate.response?.status === 401
    || (typeof candidate.message === 'string' && /invalid_grant/i.test(candidate.message));
}
