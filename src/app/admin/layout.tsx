//src/app/admin/layout.tsx
import { requireUser } from "@/lib/auth";
import { AdminShell } from "@/components/admin/admin-shell";
import { ToastProvider } from "@/components/toast";

export const metadata = { title: { default: "Panel", template: "%s · Menú Digital" } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();

  return (
    <ToastProvider>
      <AdminShell user={{ name: user.name, email: user.email, role: user.role }}>
        {children}
      </AdminShell>
    </ToastProvider>
  );
}