// During local development, send API requests to the Vite proxy on localhost.
// In production, use the existing Taklekkasjevakten API domain directly.
const REMOTE_API_ORIGIN = "https://api.taklekkasjevakten.no";
export const API_ORIGIN = import.meta.env.DEV ? window.location.origin : REMOTE_API_ORIGIN;
export const API_BASE = `${API_ORIGIN}/api`;

export function apiUrl(path: string): string {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE}${cleanPath}`;
}

export function apiAssetUrl(path?: string | null): string {
  if (!path) return "";
  if (/^https?:\/\//i.test(path)) return path;

  // PDFs, images and audio remain served by the real API domain.
  return `${REMOTE_API_ORIGIN}${path.startsWith("/") ? path : `/${path}`}`;
}

const PROJECT_MANAGER_SESSION_KEY =
  "taklekkasjevakten_project_manager_session";

export function authenticatedFetch(
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  const headers = new Headers(options.headers);

  // Admin uses the existing HttpOnly cookie; project manager uses their session.
  const sessionToken = window.localStorage.getItem(
    PROJECT_MANAGER_SESSION_KEY
  );

  if (
    window.location.pathname.startsWith("/prosjektportal") &&
    sessionToken &&
    !headers.has("Authorization")
  ) {
    headers.set("Authorization", `Bearer ${sessionToken}`);
  }

  return fetch(apiUrl(path), {
    ...options,
    credentials: "include",
    headers,
  });
}
