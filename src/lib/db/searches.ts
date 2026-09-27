import { query } from "./client";

export interface DbSearch {
  id: number;
  user_id: number;
  query: string;
  nutrient: string | null;
  status: "success" | "failed";
  source_count: number;
  error_message: string | null;
  created_at: Date;
}

export interface AdminSearch extends DbSearch {
  email: string;
}

export async function recordSearch(params: {
  userId: number;
  query: string;
  nutrient?: string;
  status: "success" | "failed";
  sourceCount: number;
  errorMessage?: string;
}): Promise<DbSearch> {
  const result = await query<DbSearch>(
    "INSERT INTO searches (user_id, query, nutrient, status, source_count, error_message) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
    [params.userId, params.query, params.nutrient || null, params.status, params.sourceCount, params.errorMessage || null],
  );
  return result.rows[0];
}

export async function countSuccessfulSearchesToday(userId: number): Promise<number> {
  const result = await query<{ count: number }>(
    "SELECT COUNT(*)::int as count FROM searches WHERE user_id = $1 AND status = 'success' AND created_at >= (DATE_TRUNC('day', NOW() AT TIME ZONE 'UTC') AT TIME ZONE 'UTC')",
    [userId],
  );
  return result.rows[0]?.count || 0;
}

export async function getSearchesByUser(userId: number, limit = 100): Promise<DbSearch[]> {
  const result = await query<DbSearch>(
    "SELECT * FROM searches WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2",
    [userId, limit],
  );
  return result.rows;
}

export async function getAllSearches(limit = 500): Promise<AdminSearch[]> {
  const result = await query<AdminSearch>(
    "SELECT s.*, u.email FROM searches s JOIN users u ON s.user_id = u.id ORDER BY s.created_at DESC LIMIT $1",
    [limit],
  );
  return result.rows;
}
