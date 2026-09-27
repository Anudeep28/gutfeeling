import { migrate } from "./migrate";
import { seedAdmin } from "@/lib/auth/seed";

let initialized = false;

export async function ensureInitialized() {
  if (initialized) return;
  await migrate();
  await seedAdmin();
  initialized = true;
}
