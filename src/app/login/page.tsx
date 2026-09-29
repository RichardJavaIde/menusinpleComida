//src/app/login/page.tsx
import { redirect } from "next/navigation";
import { UtensilsCrossed } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { LoginForm } from "./login-form";

export const metadata = { title: "Iniciar sesión" };

export default async function LoginPage() {
  if (await getCurrentUser()) redirect("/admin");

  return (
    <main className="flex min-h-dvh items-center justify-center bg-stone-100 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-sm ring-1 ring-stone-200 sm:p-8">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-xl bg-amber-700 text-white">
            <UtensilsCrossed className="size-6" />
          </div>
          <h1 className="text-xl font-semibold text-stone-900">Menú Digital</h1>
          <p className="text-sm text-stone-500">Panel de administración</p>
        </div>
        <LoginForm />
      </div>
    </main>
  );
}