import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { ShieldAlert } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { LogOutButton } from "./LogOutButton"; // We will create this

export default async function PendingVerificationPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Double check if verified, just in case
  if (user.email_confirmed_at) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <Card className="max-w-md w-full shadow-lg border-yellow-500/20">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto bg-yellow-500/10 p-3 rounded-full mb-4 w-fit">
            <ShieldAlert className="h-8 w-8 text-yellow-600" />
          </div>
          <CardTitle className="text-2xl font-bold">请验证您的邮箱</CardTitle>
          <CardDescription className="text-base mt-2">
            需要验证邮箱后才能使用平台功能
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-sm text-muted-foreground">
            Scholarly 是一个严格的学术交流平台。为了保证社区质量，所有新注册的用户都需要经过邮箱验证。
            我们已向您的注册邮箱 <strong>{user.email}</strong> 发送了一封验证邮件，请点击邮件中的链接完成验证。
          </p>
          <div className="bg-accent/50 p-4 rounded-lg text-sm">
            <p className="font-medium text-foreground mb-1">没有收到邮件？</p>
            <p className="text-muted-foreground">请检查垃圾邮件箱，或者尝试重新发送验证邮件。</p>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-3 pt-4">
          <Button variant="outline" className="w-full" asChild>
            <Link href="/">
              返回首页
            </Link>
          </Button>
          <LogOutButton />
        </CardFooter>
      </Card>
    </div>
  );
}
