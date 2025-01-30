import { ConnectionPool } from "mssql";

interface DbQueryInputs {
  [key: string]: any; // Define an object with key-value pairs
}

/**
 * Executes a database query with inputs.
 * @param pool - The SQL connection pool.
 * @param query - The SQL query string.
 * @param inputs - An object containing input parameters.
 * @returns - The result of the query.
 */
export async function dbQuery(
  pool: ConnectionPool,
  query: string,
  inputs: DbQueryInputs = {}
): Promise<any> {
  try {
    const request = pool.request();

    // Add inputs dynamically
    Object.entries(inputs).forEach(([key, value]) => {
      request.input(key, value);
    });
    const result = await request.query(query);
    return result;
  } catch (error) {
    console.error("Database query error:", error);
    throw error; // Let the calling function handle the error
  }
}
