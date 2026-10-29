import crypto from 'node:crypto';

export function hashPassword(password: string): { salt: string; hash: string } {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return { salt, hash };
}

export function verifyPassword(password: string, salt: string, storedHash: string): boolean {
  const hashBuffer = Buffer.from(storedHash, 'hex');
  const candidateBuffer = crypto.scryptSync(password, salt, 64);
  return crypto.timingSafeEqual(hashBuffer, candidateBuffer);
}
