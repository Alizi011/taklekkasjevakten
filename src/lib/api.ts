export const API_ORIGIN = "https://api.taklekkasjevakten.no";
export const API_BASE = `${API_ORIGIN}/api`;

export function apiUrl(path: string): string {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE}${cleanPath}`;
}

export function apiAssetUrl(path?: string | null): string {
  if (!path) return "";
  if (/^https?:\/\//i.test(path)) return path;

  return `${API_ORIGIN}${path.startsWith("/") ? path : `/${path}`}`;
}