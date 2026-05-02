import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminHeader } from "@/components/admin/AdminHeader";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "管理后台 - Scholarly",
  description: "Scholarly 学术论坛管理后台",
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // 检查管理员权限
  const { data: adminRole } = await supabase
    .from("admin_roles")
    .select("role")
    .eq("user_id", user.id)
    .single();

  if (!adminRole) {
    redirect("/dashboard");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, avatar_url, email")
    .eq("id", user.id)
    .single();

  const adminUser = {
    id: user.id,
    role: adminRole.role as string,
    fullName: profile?.full_name ?? "管理员",
    avatarUrl: profile?.avatar_url ?? null,
    email: profile?.email ?? user.email ?? "",
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <AdminSidebar role={adminUser.role} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <AdminHeader user={adminUser} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
