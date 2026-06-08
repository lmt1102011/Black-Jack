import 'dotenv/config';

const parseOrigins = (value) => {
  if (!value) return ['http://localhost:5173'];
  return value.split(',').map((origin) => origin.trim()).filter(Boolean);
};

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? 4000),
  clientOrigins: parseOrigins(process.env.CLIENT_ORIGIN),
  firebase: {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    databaseURL: process.env.FIREBASE_DATABASE_URL
  }
};

export const isProduction = env.nodeEnv === 'production';
