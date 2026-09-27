export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import Link from "next/link";
import { ensureInitialized } from "@/lib/db/init";
import { getSession } from "@/lib/auth/session";
import { getAllUsers, PublicUser } from "@/lib/db/users";
import { AdminSearch, getAllSearches } from "@/lib/db/searches";

export default async function AdminPage({ searchParams }: { searchParams: Promise<{ user?: string }> }) {
  await ensureInitialized();
  const session = await getSession();
  if (!session || session.role !== "admin") {
    redirect("/login");
  }

  const { user } = await searchParams;
  const userId = user ? Number(user) : null;
  const [users, allSearches] = await Promise.all([
    getAllUsers(),
    getAllSearches(500),
  ]);

  const userById = new Map(users.map((u) => [u.id, u]));
  const searches: AdminSearch[] = userId
    ? allSearches.filter((s) => s.user_id === userId)
    : allSearches;

  return (
    <main className="admin-page">
      <header className="nav admin-nav">
        <Link className="brand" href="/">MOLECULAR TABLE <span>β</span></Link>
        <span className="admin-badge">Admin</span>
      </header>

      <section className="admin-section">
        <h1>Users</h1>
        <table className="admin-table">
          <thead>
            <tr><th>Email</th><th>Role</th><th>Joined</th><th>Searches</th></tr>
          </thead>
          <tbody>
            {users.map((u: PublicUser) => (
              <tr key={u.id}>
                <td>{u.email}</td>
                <td>{u.role}</td>
                <td>{new Date(u.created_at).toLocaleString()}</td>
                <td><Link href={`/admin?user=${u.id}`}>View searches</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="admin-section">
        <h1>Searches</h1>
        {userId && <p className="admin-filter">Showing searches for user #{userId}. <Link href="/admin">Show all</Link></p>}
        <table className="admin-table">
          <thead>
            <tr><th>User</th><th>Query</th><th>Status</th><th>Sources</th><th>Time</th></tr>
          </thead>
          <tbody>
            {searches.map((s: AdminSearch) => (
              <tr key={s.id}>
                <td>{s.email || userById.get(s.user_id)?.email || s.user_id}</td>
                <td>{s.nutrient ? `${s.query} → ${s.nutrient}` : s.query}</td>
                <td><span className={`status ${s.status}`}>{s.status}</span></td>
                <td>{s.source_count}</td>
                <td>{new Date(s.created_at).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {searches.length === 0 && <p className="empty">No searches recorded yet.</p>}
      </section>
    </main>
  );
}
