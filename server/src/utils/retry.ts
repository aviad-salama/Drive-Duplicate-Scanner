// Retries on rate limit (429) and server errors (5xx) with exponential backoff
export async function withRetry<T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    try {
      return await fn();
    } catch (err: unknown) {
      // Safely cast the error to check its properties
      const error = err as { code?: number };
      const retryable = error?.code === 429 || (error?.code && error.code >= 500);
      
      if (!retryable || attempt >= maxRetries) {
        throw err;
      }
      
      const delay = 2 ** (attempt + 1) * 1000 + Math.floor(Math.random() * 1000);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}