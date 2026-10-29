import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  PORT: z.coerce.number().default(3000),
  HOST: z.string().default('0.0.0.0'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  LOG_LEVEL: z.string().default('info'),
  DB_FILE: z.string().default(path.resolve(process.cwd(), 'data', 'urja-ops.db')),
  JWT_SECRET: z.string().min(16).default('super-secret-urja-ops-production-token-key-2026!#flock'),
  JWT_EXPIRES_IN: z.string().default('24h'),
  DEFAULT_OPERATOR_EMAIL: z.string().email().default('operator@urja.local'),
  DEFAULT_OPERATOR_PASSWORD: z.string().min(8).default('urja-ops-2026'),
  RATE_LIMIT_MAX: z.coerce.number().default(100),
  RATE_LIMIT_TIME_WINDOW_MS: z.coerce.number().default(60000),
  AUTH_RATE_LIMIT_MAX: z.coerce.number().default(10),
  AUTH_ENABLED: z
    .string()
    .transform((val) => val !== 'false')
    .default('true'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment configuration:', parsed.error.format());
  process.exit(1);
}

export const env = parsed.data;
export type Env = z.infer<typeof envSchema>;
