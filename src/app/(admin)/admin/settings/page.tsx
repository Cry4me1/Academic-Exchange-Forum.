import { requireAdmin } from "@/lib/admin/permissions";
import { SettingsClient } from "./SettingsClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "系统设置 - Scholarly 管理后台",
    description: "全局注册准入模式、AI功能与安全配置",
};

export default async function AdminSettingsPage() {
    await requireAdmin("super_admin");

    return (
        <div className="animate-fade-in">
            <SettingsClient />
        </div>
    );
}
