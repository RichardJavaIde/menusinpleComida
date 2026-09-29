//src/app/login/login-form.tsx
"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { loginAction, type LoginState } from "./actions";

export function LoginForm() {
  const [state, action, pending] = useActionState<LoginState, FormData>(loginAction, {});

  return (
    <form action={action} className="space-y-4">
      <div>
        <label htmlFor="email" className="mb-1 block text-sm font-medium text-stone-700">
          Correo
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="username"
          className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2.5 text-stone-900 outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-600/20"
        />
      </div>

      <div>
        <label htmlFor="password" className="mb-1 block text-sm font-medium text-stone-700">
          Contraseña
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2.5 text-stone-900 outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-600/20"
        />
      </div>

      {state.error && (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-amber-700 px-4 py-2.5 font-medium text-white transition hover:bg-amber-800 disabled:opacity-60"
      >
        {pending && <Loader2 className="size-4 animate-spin" />}
        Iniciar sesión
      </button>
    </form>
  );
}