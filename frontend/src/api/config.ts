const root = import.meta.env.VITE_API_ROOT ?? "/api";

export function apiUrl(path: string): string {
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${root.replace(/\/$/, "")}${p}`;
}
