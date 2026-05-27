import dotenv from "dotenv";

dotenv.config();

const parseOriginList = (value) =>
  (value || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

const clientOrigins = parseOriginList(process.env.CLIENT_ORIGIN);

export const config = {
  port: Number(process.env.PORT || 4100),
  isDevelopment: process.env.NODE_ENV !== "production",
  clientOrigin: clientOrigins[0] || "http://localhost:5173",
  clientOrigins: clientOrigins.length ? clientOrigins : ["http://localhost:5173"],
  authSecret: process.env.AUTH_SECRET || "dev-auth-secret-change-me",
  adminEmail: process.env.ADMIN_EMAIL || "admin@example.com",
  adminPassword: process.env.ADMIN_PASSWORD || "change-me-before-launch",
  artistEmail: process.env.ARTIST_EMAIL || "ogbemi.heymann@example.com",
  pressEmail: process.env.PRESS_EMAIL || "press@example.com",
  mysql: {
    host: process.env.MYSQL_HOST,
    port: Number(process.env.MYSQL_PORT || 3306),
    database: process.env.MYSQL_DATABASE,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD || ""
  },
  smtp: {
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    user: process.env.SMTP_USER,
    password: process.env.SMTP_PASSWORD,
    from: process.env.SMTP_FROM || "Ogbemi Heymann Website <website@example.com>"
  },
  airtable: {
    apiKey: process.env.AIRTABLE_API_KEY,
    baseId: process.env.AIRTABLE_BASE_ID,
    tableName: process.env.AIRTABLE_TABLE_NAME || "Works"
  }
};
