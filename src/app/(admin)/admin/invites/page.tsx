import { requireAdmin } from "@/lib/admin/permissions";
import { InvitesManagementClient } from "./InvitesManagementClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "邀请码管理 - Scholarly 管理后台",
    description: "学术邀请码签发、权限控制与学者核销审计",
};

export default async function AdminInvitesPage() {
    // 严格限制仅超级管理员 (Hansszh) 可访问
    await requireAdmin("super_admin");

    return (
        <div className="animate-fade-in">
            <InvitesManagementClient />
        </div>
    );
}
