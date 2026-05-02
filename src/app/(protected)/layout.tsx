import { CreditRechargeProvider } from "@/components/payments/CreditRechargeProvider";
import { PresenceProvider } from "@/contexts/PresenceContext";
import { createClient } from "@/lib/supabase/server";
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

  return (
    <div className="min-h-screen bg-background">
      <PresenceProvider currentUserId={user.id}>
        {children}
        <CreditRechargeProvider />
      </PresenceProvider>
    </div>
  );
}
