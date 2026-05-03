/** Parse `postgresql://user:pass@host:port/db` (Railway, Neon, etc.). */
export function parseDatabaseUrl(connectionString: string): {
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
} | null {
  const raw = connectionString.trim();
  if (!raw.startsWith('postgres')) return null;
  try {
    const u = new URL(raw);
    const db = u.pathname.replace(/^\//, '').split('?')[0];
    if (!db) return null;
    return {
      host: u.hostname,
      port: u.port ? Number(u.port) : 5432,
      username: decodeURIComponent(u.username || 'postgres'),
      password: decodeURIComponent(u.password || ''),
      database: db,
    };
  } catch {
    return null;
  }
}
