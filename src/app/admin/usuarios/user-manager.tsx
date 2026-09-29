//src/app/admin/usuarios/actions.ts
"use client";

import { useActionState, useCallback, useEffect, useState, useTransition } from "react";
import {
  Eye, EyeOff, KeyRound, Loader2, Pencil, Plus, RefreshCw, Trash2, UserCheck, UserX, X,
} from "lucide-react";
import { useToast } from "@/components/toast";
import type { ActionResult } from "@/lib/action-result";
import {
  saveUser, resetUserPassword, toggleUserActive, deleteUser, type UserFormState,
} from "./actions";

type UserRow = {
  id: number;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
};

type Dialog = { type: "edit"; user: UserRow | null } | { type: "password"; user: UserRow } | null;

const inputCls =
  "w-full rounded-lg border border-stone-300 bg-white px-3 py-2.5 text-stone-900 outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-600/20 disabled:bg-stone-100 disabled:text-stone-500";

const iconBtn =
  "rounded-lg p-2 text-stone-500 transition hover:bg-stone-100 hover:text-stone-900 disabled:opacity-30 disabled:hover:bg-transparent";

function generatePassword() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  let p = "";
  do {
    p = Array.from(crypto.getRandomValues(new Uint32Array(12)), (n) => chars[n % chars.length]).join("");
  } while (!/[A-Za-z]/.test(p) || !/\d/.test(p));
  return p;
}

export function UserManager({ users, currentUserId }: { users: UserRow[]; currentUserId: number }) {
  const [dialog, setDialog] = useState<Dialog>(null);
  const [pending, startTransition] = useTransition();
  const toast = useToast();

  const closeDialog = useCallback(() => setDialog(null), []);

  const run = (fn: () => Promise<ActionResult>) =>
    startTransition(async () => {
      try {
        const result = await fn();
        if (result.ok) {
          if (result.tone === "danger") toast.danger(result.message);
          else toast.success(result.message);
        } else {
          toast.error(result.error);
        }
      } catch {
        toast.error("Ocurrió un error inesperado. Inténtalo de nuevo.");
      }
    });

  const onToggle = (u: UserRow) => {
    if (u.isActive && !confirm(`¿Desactivar a "${u.name}"? No podrá iniciar sesión.`)) return;
    run(() => toggleUserActive(u.id));
  };

  const onDelete = (u: UserRow) => {
    if (confirm(`¿Eliminar al usuario "${u.name}"? Esta acción no se puede deshacer.`)) {
      run(() => deleteUser(u.id));
    }
  };

  return (
    <>
      <div className="mb-4 flex justify-end">
        <button
          onClick={() => setDialog({ type: "edit", user: null })}
          className="flex items-center gap-2 rounded-lg bg-amber-700 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-amber-800"
        >
          <Plus className="size-4" />
          Nuevo usuario
        </button>
      </div>

      <ul className={`space-y-2 ${pending ? "opacity-70" : ""}`}>
        {users.map((u) => {
          const isSelf = u.id === currentUserId;
          return (
            <li
              key={u.id}
              className="flex flex-wrap items-center gap-3 rounded-xl bg-white p-3 ring-1 ring-stone-200 sm:flex-nowrap"
            >
              <div
                className={`flex size-11 shrink-0 items-center justify-center rounded-full bg-amber-100 font-semibold text-amber-900 ${
                  u.isActive ? "" : "opacity-50"
                }`}
                aria-hidden="true"
              >
                {u.name.trim().charAt(0).toUpperCase() || "?"}
              </div>

              <div className={`min-w-0 flex-1 ${u.isActive ? "" : "opacity-60"}`}>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <p className="truncate font-medium">{u.name}</p>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      u.role === "ADMIN" ? "bg-amber-100 text-amber-900" : "bg-stone-100 text-stone-600"
                    }`}
                  >
                    {u.role === "ADMIN" ? "Administrador" : "Usuario"}
                  </span>
                  {!u.isActive && (
                    <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs text-red-700">
                      Inactivo
                    </span>
                  )}
                  {isSelf && (
                    <span className="rounded-full bg-green-50 px-2 py-0.5 text-xs text-green-700">
                      Tú
                    </span>
                  )}
                </div>
                <p className="truncate text-sm text-stone-500">{u.email}</p>
                <p className="text-xs text-stone-400">Creado el {u.createdAt}</p>
              </div>

              <div className="flex shrink-0 items-center">
                <button
                  className={iconBtn}
                  aria-label={`Restablecer contraseña de ${u.name}`}
                  title="Restablecer contraseña"
                  disabled={pending}
                  onClick={() => setDialog({ type: "password", user: u })}
                >
                  <KeyRound className="size-4" />
                </button>
                <button
                  className={iconBtn}
                  aria-label={u.isActive ? `Desactivar a ${u.name}` : `Activar a ${u.name}`}
                  title={isSelf ? "No puedes desactivarte a ti mismo" : u.isActive ? "Desactivar" : "Activar"}
                  disabled={pending || isSelf}
                  onClick={() => onToggle(u)}
                >
                  {u.isActive ? <UserX className="size-4" /> : <UserCheck className="size-4" />}
                </button>
                <button
                  className={iconBtn}
                  aria-label={`Editar a ${u.name}`}
                  title="Editar"
                  onClick={() => setDialog({ type: "edit", user: u })}
                >
                  <Pencil className="size-4" />
                </button>
                <button
                  className={`${iconBtn} hover:!bg-red-50 hover:!text-red-600`}
                  aria-label={`Eliminar a ${u.name}`}
                  title={isSelf ? "No puedes eliminarte a ti mismo" : "Eliminar"}
                  disabled={pending || isSelf}
                  onClick={() => onDelete(u)}
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            </li>
          );
        })}
      </ul>

      {dialog?.type === "edit" && (
        <UserDialog user={dialog.user} isSelf={dialog.user?.id === currentUserId} onClose={closeDialog} />
      )}
      {dialog?.type === "password" && <PasswordDialog user={dialog.user} onClose={closeDialog} />}
    </>
  );
}

/* ───────────── Base de los cuadros de diálogo ───────────── */

function Modal({
  title, onClose, children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center sm:p-4"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className="max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-white p-5 shadow-xl sm:rounded-2xl"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 id="modal-title" className="text-lg font-semibold">{title}</h2>
          <button onClick={onClose} aria-label="Cerrar" className={iconBtn}>
            <X className="size-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function FormFooter({ pending, error, onClose }: { pending: boolean; error?: string; onClose: () => void }) {
  return (
    <>
      {error && (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}
      <div className="flex justify-end gap-2 pt-2">
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg px-4 py-2.5 text-sm font-medium text-stone-600 hover:bg-stone-100"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={pending}
          className="flex items-center gap-2 rounded-lg bg-amber-700 px-4 py-2.5 text-sm font-medium text-white hover:bg-amber-800 disabled:opacity-60"
        >
          {pending && <Loader2 className="size-4 animate-spin" />}
          Guardar
        </button>
      </div>
    </>
  );
}

function PasswordField({ id, label }: { id: string; label: string }) {
  const [value, setValue] = useState("");
  const [visible, setVisible] = useState(false);

  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-medium text-stone-700">
        {label}
      </label>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            id={id}
            name="password"
            type={visible ? "text" : "password"}
            required
            minLength={8}
            maxLength={72}
            autoComplete="new-password"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className={`${inputCls} pr-11 font-mono`}
          />
          <button
            type="button"
            onClick={() => setVisible((s) => !s)}
            aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
            className="absolute right-1 top-1/2 -translate-y-1/2 rounded-lg p-2 text-stone-500 hover:bg-stone-100"
          >
            {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
        <button
          type="button"
          onClick={() => {
            setValue(generatePassword());
            setVisible(true);
          }}
          title="Generar contraseña segura"
          className="flex items-center gap-1.5 rounded-lg px-3 text-sm font-medium text-stone-600 ring-1 ring-stone-300 hover:bg-stone-50"
        >
          <RefreshCw className="size-4" />
          <span className="hidden sm:inline">Generar</span>
        </button>
      </div>
      <p className="mt-1 text-xs text-stone-500">
        Mínimo 8 caracteres, con letras y números. No se podrá volver a ver: cópiala antes de guardar.
      </p>
    </div>
  );
}

/* ───────────── Crear / editar ───────────── */

function UserDialog({
  user, isSelf, onClose,
}: {
  user: UserRow | null;
  isSelf: boolean;
  onClose: () => void;
}) {
  const [state, action, pending] = useActionState<UserFormState, FormData>(saveUser, {});
  const [, startTransition] = useTransition();
  const toast = useToast();

  useEffect(() => {
    if (state.success) {
      toast.success(state.message ?? "Guardado.");
      onClose();
    }
  }, [state, toast, onClose]);

  return (
    <Modal title={user ? "Editar usuario" : "Nuevo usuario"} onClose={onClose}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          startTransition(() => action(fd));
        }}
        className="space-y-4"
      >
        {user && <input type="hidden" name="id" value={user.id} />}

        <div>
          <label htmlFor="u-name" className="mb-1 block text-sm font-medium text-stone-700">
            Nombre
          </label>
          <input
            id="u-name"
            name="name"
            required
            maxLength={60}
            autoFocus
            defaultValue={user?.name}
            className={inputCls}
          />
        </div>

        <div>
          <label htmlFor="u-email" className="mb-1 block text-sm font-medium text-stone-700">
            Correo
          </label>
          <input
            id="u-email"
            name="email"
            type="email"
            required
            maxLength={120}
            autoComplete="off"
            defaultValue={user?.email}
            className={inputCls}
          />
        </div>

        {!user && <PasswordField id="u-password" label="Contraseña inicial" />}

        <div>
          <label htmlFor="u-role" className="mb-1 block text-sm font-medium text-stone-700">
            Rol
          </label>
          <select
            id="u-role"
            name="role"
            defaultValue={user?.role ?? "USER"}
            disabled={isSelf}
            className={inputCls}
          >
            <option value="USER">Usuario: todo menos Configuración y Usuarios</option>
            <option value="ADMIN">Administrador: acceso total</option>
          </select>
        </div>

        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            name="isActive"
            defaultChecked={user?.isActive ?? true}
            disabled={isSelf}
            className="size-4 accent-amber-700"
          />
          <span className="text-sm">Activo (puede iniciar sesión)</span>
        </label>

        {isSelf && (
          <p className="rounded-lg bg-stone-50 px-3 py-2 text-xs text-stone-500">
            Es tu propia cuenta: no puedes cambiar tu rol ni desactivarte. Otro administrador puede hacerlo.
          </p>
        )}

        <FormFooter pending={pending} error={state.error} onClose={onClose} />
      </form>
    </Modal>
  );
}

/* ───────────── Restablecer contraseña ───────────── */

function PasswordDialog({ user, onClose }: { user: UserRow; onClose: () => void }) {
  const [state, action, pending] = useActionState<UserFormState, FormData>(resetUserPassword, {});
  const [, startTransition] = useTransition();
  const toast = useToast();

  useEffect(() => {
    if (state.success) {
      toast.success(state.message ?? "Guardado.");
      onClose();
    }
  }, [state, toast, onClose]);

  return (
    <Modal title="Restablecer contraseña" onClose={onClose}>
      <p className="mb-4 text-sm text-stone-600">
        Nueva contraseña para <strong>{user.name}</strong> ({user.email}).
      </p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          startTransition(() => action(fd));
        }}
        className="space-y-4"
      >
        <input type="hidden" name="id" value={user.id} />
        <PasswordField id="p-password" label="Nueva contraseña" />
        <FormFooter pending={pending} error={state.error} onClose={onClose} />
      </form>
    </Modal>
  );
}