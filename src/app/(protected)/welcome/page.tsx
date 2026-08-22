import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { WelcomeClient } from "./WelcomeClient";

export const metadata = {
    title: "欢迎入驻 Scholarly - 新手向导与学者档案配置",
    description: "签署学术社区公约，开启学者名片与个性化空间主题定制",
};

export default async function WelcomePage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    const { data: profile } = await supabase
        .from("profiles")
        .select("id, email, username, avatar_url, gender, country, language, timezone, bio, banner_style, onboarding_completed, terms_accepted_at, onboarding_step")
        .eq("id", user.id)
        .single();

    const initialData = {
        username: profile?.username || (user.email ? user.email.split("@")[0] : ""),
        avatar_url: profile?.avatar_url || "",
        gender: profile?.gender || "",
        country: profile?.country || "中国",
        language: profile?.language || "zh",
        timezone: profile?.timezone || "Asia/Shanghai",
        bio: profile?.bio || "",
        banner_style: profile?.banner_style || "default",
        onboarding_completed: profile?.onboarding_completed ?? false,
        terms_accepted_at: profile?.terms_accepted_at ?? null,
        onboarding_step: profile?.onboarding_step ?? 1,
    };

    return (
        <WelcomeClient
            userId={user.id}
            email={user.email || ""}
            initialData={initialData}
        />
    );
}
