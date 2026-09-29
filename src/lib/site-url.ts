//src/lib/site-url.ts
/** "midominio.com" o "https://midominio.com/loquesea" → "https://midominio.com/menu" */
export function menuUrlFrom(input: string): string | null {
  let raw = input.trim();
  if (!raw) return null;
  if (!/^https?:\/\//i.test(raw)) raw = `https://${raw}`;

  try {
    const u = new URL(raw);
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    if (u.hostname !== "localhost" && !u.hostname.includes(".")) return null;
    return `${u.origin}/menu`;
  } catch {
    return null;
  }
}

/** true si la dirección solo se puede abrir desde la misma computadora o red local */
export function isPrivateHost(link: string) {
  const h = new URL(link).hostname;
  return (
    h === "localhost" ||
    h.endsWith(".local") ||
    /^127\./.test(h) ||
    /^10\./.test(h) ||
    /^192\.168\./.test(h) ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(h)
  );
}