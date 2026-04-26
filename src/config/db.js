import { Pool } from "pg";

const useSsl = (process.env.DB_SSL || "false").toLowerCase() === "true";

const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT || 5432),
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "postgres",
  database: process.env.DB_NAME || "content_delivery_db",
  ssl: useSsl ? { rejectUnauthorized: false } : false,
});

export const query = (text, params = []) => pool.query(text, params);

export const checkDatabaseConnection = async () => {
  try {
    await query("SELECT 1");
    return true;
  } catch (error) {
    return false;
  }
};

export default pool;
