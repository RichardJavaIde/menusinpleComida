//src/lib/time.ts
/** "15:00" → "3:00 PM" */
export function formatTime12(value: string | null | undefined) {
  if (!value || !/^\d{2}:\d{2}$/.test(value)) return "";
  const [h, m] = value.split(":").map(Number);
  const suffix = h >= 12 ? "PM" : "AM";
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${suffix}`;
}

/** "hace 5 min", "hace 2 horas", "hace 3 días" o la fecha si es más antigua */
export function timeAgo(date: Date, now = new Date()) {
  const seconds = Math.max(0, Math.round((now.getTime() - date.getTime()) / 1000));
  if (seconds < 60) return "hace un momento";

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `hace ${minutes} min`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `hace ${hours} ${hours === 1 ? "hora" : "horas"}`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `hace ${days} ${days === 1 ? "día" : "días"}`;

  return date.toLocaleDateString("es-DO", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "America/Santo_Domingo",
  });
}