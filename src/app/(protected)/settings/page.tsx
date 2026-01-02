import { redirect } from "next/navigation";

export default function SettingsPage() {
    // 重定向到个人资料设置页面
    redirect("/settings/profile");
}
