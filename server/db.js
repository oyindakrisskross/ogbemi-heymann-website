import mysql from "mysql2/promise";
import { config } from "./config.js";

let pool;

export function hasDatabaseConfig() {
  return Boolean(config.mysql.host && config.mysql.database && config.mysql.user);
}

export function getPool() {
  if (!hasDatabaseConfig()) return null;
  if (!pool) {
    pool = mysql.createPool({
      host: config.mysql.host,
      port: config.mysql.port,
      database: config.mysql.database,
      user: config.mysql.user,
      password: config.mysql.password,
      waitForConnections: true,
      connectionLimit: 10,
      namedPlaceholders: true
    });
  }
  return pool;
}

export async function query(sql, params = []) {
  const currentPool = getPool();
  if (!currentPool) return null;
  const [rows] = await currentPool.execute(sql, params);
  return rows;
}

export async function tryQuery(sql, params = []) {
  try {
    return await query(sql, params);
  } catch (error) {
    console.warn("MySQL query failed; using in-memory fallback where possible.", error.message);
    return null;
  }
}
