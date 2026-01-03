import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function ResetPasswordPage() {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    return (
        <div className="container flex h-screen w-screen flex-col items-center justify-center">
            <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
                <div className="flex flex-col space-y-2 text-center">
                    <h1 className="text-2xl font-semibold tracking-tight">
                        设置新密码
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        请输入您的新密码。
                    </p>
                </div>
                <ResetPasswordForm />
            </div>
        </div>
    );
}
