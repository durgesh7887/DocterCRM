export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: Number(process.env.PORT ?? 4000),
  mongodbUri: process.env.MONGODB_URI ?? "mongodb://127.0.0.1:27017/medflow",
  jwtAccessSecret: process.env.JWT_ACCESS_SECRET ?? "dev-medflow-access-secret-change",
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET ?? "dev-medflow-refresh-secret-change",
  accessTtl: process.env.JWT_ACCESS_TTL ?? "15m",
  refreshTtl: process.env.JWT_REFRESH_TTL ?? "7d",
  corsOrigins: (process.env.CORS_ORIGINS ?? "web-six-virid-gza34xaqcf.vercel.app,docter-crm-pwa.vercel.app").split(","),
  cookieName: "medflow_refresh",
};

