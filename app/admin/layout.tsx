import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { isAdminSession } from "@/lib/admin/guard";
import { AdminShell } from "@/components/admin/AdminShell";

// Server-side gate (defence in depth alongside middleware.ts).
export default async function AdminLayout({ children }: { children: ReactNode }) {
  if (!(await isAdminSession())) redirect("/");
  return <AdminShell>{children}</AdminShell>;
}
