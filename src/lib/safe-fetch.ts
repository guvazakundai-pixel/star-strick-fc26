const DEFAULT_RETRIES = 2;
const RETRY_DELAY_MS = 1000;

export async function safeFetch<T>(
  fn: () => Promise<T>,
  retries = DEFAULT_RETRIES,
): Promise<{ data: T | null; error: Error | null }> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const data = await fn();
      return { data, error: null };
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      if (attempt < retries) {
        await new Promise((r) => setTimeout(r, RETRY_DELAY_MS * (attempt + 1)));
      }
    }
  }

  return { data: null, error: lastError };
}

export function getDisplayUsername(user: {
  displayName: string | null;
  username: string;
}): string {
  return user.displayName || user.username;
}

export function getInitial(name: string): string {
  return (name || "?")[0].toUpperCase();
}

export function formatWinRate(wins: number, total: number): string {
  if (total === 0) return "0%";
  return `${Math.round((wins / total) * 100)}%`;
}

export function formatGoalDiff(gf: number, ga: number): string {
  const diff = gf - ga;
  if (diff > 0) return `+${diff}`;
  return `${diff}`;
}