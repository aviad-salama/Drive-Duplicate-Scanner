import { createHash } from 'node:crypto';
import type { Readable } from 'node:stream';

/** Consumes the stream and returns its SHA-256 digest as a lowercase hex string. */
export async function calculateSha256(stream: Readable): Promise<string> {
  const hash = createHash('sha256');

  for await (const chunk of stream) {
    hash.update(chunk);
  }

  return hash.digest('hex');
}