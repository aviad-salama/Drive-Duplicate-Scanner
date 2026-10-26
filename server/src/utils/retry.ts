import { z } from 'zod';

const retryErrorSchema = z.object({
  code: z.number().optional(),
});

// Retries on rate limit (429) and server errors (5xx) with exponential backoff
export async function withRetry<T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    try {
      return await fn();
    } catch (err: unknown) {
      // Parse retryable status codes without trusting an unvalidated error object.
      const parsed = retryErrorSchema.safeParse(err);
      const code = parsed.success ? parsed.data.code : undefined;

      const retryable = code === 429 || (code && code >= 500);

      if (!retryable || attempt >= maxRetries) {
        throw err;
      }

      const delay = 2 ** (attempt + 1) * 1000 + Math.floor(Math.random() * 1000);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}
