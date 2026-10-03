import 'dotenv/config';

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing environment variable: ${name}`);
  return value;
}

export const env = {
  PORT: Number(process.env['PORT'] ?? 3000),
  NODE_ENV: process.env['NODE_ENV'] ?? 'development',
  CLIENT_URL: process.env['CLIENT_URL'] ?? 'http://localhost:5173',
  DATABASE_URL: required('DATABASE_URL'),
  JWT_SECRET: required('JWT_SECRET'),
  TOKEN_ENC_KEY: required('TOKEN_ENC_KEY'),
  GOOGLE_CLIENT_ID: required('GOOGLE_CLIENT_ID'),
  GOOGLE_CLIENT_SECRET: required('GOOGLE_CLIENT_SECRET'),
  GOOGLE_REDIRECT_URI: required('GOOGLE_REDIRECT_URI'),
};

export const isProd = env.NODE_ENV === 'production';