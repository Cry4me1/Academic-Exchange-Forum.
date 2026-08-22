import { CreditRechargeProvider } from "@/components/payments/CreditRechargeProvider";
import { PresenceProvider } from "@/contexts/PresenceContext";
import { createClient } from "@/lib/supabase/server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  if (!user.email_confirmed_at) {
    redirect("/pending-verification");
  }

  const headersList = await headers();
  const pathname = headersList.get("x-pathname") || "";

  // 检查新用户的入驻与公约签署完成状态
  const { data: profile } = await supabase
    .from("profiles")
    .select("onboarding_completed")
    .eq("id", user.id)
    .single();

  const isOnboardingCompleted = profile?.onboarding_completed ?? false;
  const isAllowedPathWithoutOnboarding =
    pathname.startsWith("/welcome") ||
    pathname.startsWith("/rules") ||
    pathname.startsWith("/api/");

  if (!isOnboardingCompleted && !isAllowedPathWithoutOnboarding) {
    redirect("/welcome");
  }

  return (
    <div className="min-h-screen bg-background">
      <PresenceProvider currentUserId={user.id}>
        {children}
        <CreditRechargeProvider />
      </PresenceProvider>
    </div>
  );
}
