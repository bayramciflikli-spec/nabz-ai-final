/** Arama geçmişi - localStorage ile sakla */
const KEY = "nabz_search_history";
const MAX = 12;

export function getSearchHistory(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    return JSON.parse(raw) as string[];
  } catch {
    return [];
  }
}

export function addSearchHistory(query: string): void {
  if (typeof window === "undefined" || !query.trim()) return;
  try {
    const list = getSearchHistory().filter((q) => q.toLowerCase() !== query.trim().toLowerCase());
    const updated = [query.trim(), ...list].slice(0, MAX);
    localStorage.setItem(KEY, JSON.stringify(updated));
  } catch {
    // ignore
  }
}

export function removeSearchHistory(query: string): void {
  if (typeof window === "undefined") return;
  try {
    const list = getSearchHistory().filter((q) => q.toLowerCase() !== query.toLowerCase());
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    // ignore
  }
}

export function clearSearchHistory(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}
