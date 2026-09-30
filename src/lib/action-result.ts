//src/lib/action-result.ts
export type ActionResult =
  | { ok: true; message: string; tone?: "danger" }
  | { ok: false; error: string };