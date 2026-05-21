export const config = {
  port: Number(process.env.PORT ?? 3001),
  jwtSecret: process.env.JWT_SECRET ?? 'dev-xq-secret-change-in-production',
  corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
};
