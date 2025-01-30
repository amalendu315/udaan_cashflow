import { ConnectionPool } from "mssql";

/**
 * Logs an action into the cache_logs table.
 * @param pool - The database connection pool.
 * @param userId - The ID of the user performing the action.
 * @param role - The role of the user performing the action.
 * @param tableName - The name of the table affected by the action.
 * @param action - The action performed (e.g., "Create User").
 * @param details - Additional details about the action.
 */
export async function logAction(
  pool: ConnectionPool,
  userId: number | null,
  role: string | null,
  tableName: string,
  action: string,
  details: string
): Promise<void> {
  try {
    await pool
      .request()
      .input("user_id", userId)
      .input("role", role)
      .input("table_name", tableName)
      .input("action", action)
      .input("details", details)
      .query(
        `INSERT INTO cache_logs (user_id, role, table_name, action, details, created_at)
         VALUES (@user_id, @role, @table_name, @action, @details, GETDATE())`
      );
  } catch (error) {
    console.error("Failed to log action:", error);
    throw error;
  }
}
