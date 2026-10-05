import { createHash } from 'node:crypto';
import type { Readable } from 'node:stream';

export async function calculateSha256(stream: Readable): Promise<string> {
  const hash = createHash('sha256');

  for await (const chunk of stream) {
    hash.update(chunk);
  }

  return hash.digest('hex');
}