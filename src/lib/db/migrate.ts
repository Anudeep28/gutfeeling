import fs from "fs";
import path from "path";
import { query } from "./client";

export async function migrate() {
  const filePath = path.join(process.cwd(), "src", "lib", "db", "schema.sql");
  const sql = fs.readFileSync(filePath, "utf-8");
  await query(sql);
}
