/**
 * Admin cihaz doğrulama – client tarafında cihaz kimliği.
 * localStorage'da saklanır; yeni cihazda doğrulama kodu istenir.
 */
const STORAGE_KEY = "nabz_admin_device_id";

export function getDeviceId(): string {
  if (typeof window === "undefined") return "";
  let id = localStorage.getItem(STORAGE_KEY);
  if (!id) {
    id = "d_" + Math.random().toString(36).slice(2) + "_" + Date.now().toString(36);
    try {
      localStorage.setItem(STORAGE_KEY, id);
    } catch {
      // private mode vb.
    }
  }
  return id;
}
