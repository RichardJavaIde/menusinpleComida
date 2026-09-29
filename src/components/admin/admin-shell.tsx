//src/components/admin/admin-shell.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard, FolderTree, UtensilsCrossed, Tag, QrCode,
  Settings, Users, LogOut, Menu, X, ExternalLink, type LucideIcon,
} from "lucide-react";
import { logoutAction } from "@/app/login/actions";

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  adminOnly?: boolean;
  exact?: boolean;
};

const NAV: NavItem[] = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/categorias", label: "Categorías", icon: FolderTree },
  { href: "/admin/platos", label: "Platos", icon: UtensilsCrossed },
  { href: "/admin/etiquetas", label: "Etiquetas", icon: Tag },
  { href: "/admin/qr", label: "Código QR", icon: QrCode },
  { href: "/admin/configuracion", label: "Configuración", icon: Settings, adminOnly: true },
  { href: "/admin/usuarios", label: "Usuarios", icon: Users, adminOnly: true },
];

type Props = {
  user: { name: string; email: string; role: string };
  children: React.ReactNode;
};

export function AdminShell({ user, children }: Props) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const items = NAV.filter((i) => !i.adminOnly || user.role === "ADMIN");
  const isActive = (i: NavItem) => (i.exact ? pathname === i.href : pathname.startsWith(i.href));

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 px-4 py-5">
        <div className="flex size-9 items-center justify-center rounded-lg bg-amber-700 text-white">
          <UtensilsCrossed className="size-5" />
        </div>
        <span className="font-semibold text-stone-900">Menú Digital</span>
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {items.map((item) => {
          const active = isActive(item);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              aria-current={active ? "page" : undefined}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                active
                  ? "bg-amber-100 text-amber-900"
                  : "text-stone-600 hover:bg-stone-100 hover:text-stone-900"
              }`}
            >
              <item.icon className="size-5" />
              {item.label}
            </Link>
          );
        })}

        <a
          href="/menu"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-stone-600 hover:bg-stone-100 hover:text-stone-900"
        >
          <ExternalLink className="size-5" />
          Ver menú público
        </a>
      </nav>

      <div className="border-t border-stone-200 p-4">
        <p className="truncate text-sm font-medium text-stone-900">{user.name}</p>
        <p className="truncate text-xs text-stone-500">{user.email}</p>
        <span className="mt-1 inline-block rounded-full bg-stone-100 px-2 py-0.5 text-xs font-medium text-stone-600">
          {user.role === "ADMIN" ? "Administrador" : "Usuario"}
        </span>
        <form action={logoutAction} className="mt-3">
          <button
            type="submit"
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-stone-600 hover:bg-stone-100"
          >
            <LogOut className="size-4" />
            Cerrar sesión
          </button>
        </form>
      </div>
    </div>
  );

  return (
    <div className="min-h-dvh bg-stone-50 text-stone-900">
      {/* Escritorio */}
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-stone-200 bg-white md:block">
        {sidebar}
      </aside>

      {/* Móvil: barra superior */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-stone-200 bg-white px-4 py-3 md:hidden">
        <span className="font-semibold">Menú Digital</span>
        <button
          onClick={() => setOpen(true)}
          aria-label="Abrir menú"
          className="rounded-lg p-2 hover:bg-stone-100"
        >
          <Menu className="size-6" />
        </button>
      </header>

      {/* Móvil: panel deslizable */}
      {open && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-72 bg-white shadow-xl">
            <button
              onClick={() => setOpen(false)}
              aria-label="Cerrar menú"
              className="absolute right-3 top-4 rounded-lg p-2 hover:bg-stone-100"
            >
              <X className="size-5" />
            </button>
            {sidebar}
          </div>
        </div>
      )}

      <main className="md:pl-64">
        <div className="mx-auto max-w-5xl p-4 sm:p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}