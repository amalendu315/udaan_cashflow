import sql, { config as SQLConfig } from "mssql";
import {
  DB_SERVER,
  DB_DATABASE,
  DB_PASSWORD,
  DB_USER,
} from "@/utils/constants";

const config: SQLConfig = {
  user: DB_USER,
  password: DB_PASSWORD,
  database: DB_DATABASE,
  server: DB_SERVER,
  options: {
    encrypt: false, // Disable encryption to match SSMS "Optional" setting
    trustServerCertificate: true, // Trust the self-signed certificate
  },
};

export const pool = new sql.ConnectionPool(config);

export const connectDb = async (): Promise<sql.ConnectionPool> => {
  if (!pool.connected) {
    try {
      await pool.connect();
      console.log("Connected to MSSQL Database");
    } catch (error) {
      console.error("Database connection failed:", (error as Error).message);
      throw error;
    }
  }
  return pool;
};
