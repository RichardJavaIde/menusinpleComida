//src/lib/roles.ts
export const ROLES = ["ADMIN", "USER"] as const;
export type Role = (typeof ROLES)[number];

export const isAdmin = (role: string | undefined | null) => role === "ADMIN";