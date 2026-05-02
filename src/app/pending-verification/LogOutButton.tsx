"use client";

import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";

export function LogOutButton() {
  const router = useRouter();
  const supabase = createClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <Button variant="ghost" className="w-full text-muted-foreground" onClick={handleSignOut}>
      <LogOut className="h-4 w-4 mr-2" />
      退出登录
    </Button>
  );
}
