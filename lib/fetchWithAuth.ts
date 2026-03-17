/**
 * API çağrıları için auth token ekleyen fetch wrapper.
 * 401 alındığında global login modal açılır (session süresi dolmuş olabilir).
 */
import { auth } from "./firebase";

const AUTH_UNAUTHORIZED_EVENT = "auth:unauthorized";

/** 401 alındığında login modal açılsın diye tetiklenir (AuthProvider dinler). Admin'de asla açma. */
export function triggerLoginModal() {
  if (typeof window === "undefined") return;
  if (window.location.pathname.startsWith("/admin")) return;
  window.dispatchEvent(new CustomEvent(AUTH_UNAUTHORIZED_EVENT));
}

export async function fetchWithAuth(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = await auth.currentUser?.getIdToken();
  const headers = new Headers(options.headers);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  const method = (options.method || "GET").toUpperCase();
  if ((method === "POST" || method === "PUT" || method === "PATCH") && options.body) {
    headers.set("Content-Type", "application/json");
  }
  const res = await fetch(url, { ...options, headers });
  if (res.status === 401) triggerLoginModal();
  return res;
}
