import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import Link from "next/link";

export default function ForgotPasswordPage() {
    return (
        <div className="container flex h-screen w-screen flex-col items-center justify-center">
            <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
                <div className="flex flex-col space-y-2 text-center">
                    <h1 className="text-2xl font-semibold tracking-tight">
                        重置密码
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        输入您的邮箱地址，我们将发送重置链接给您。
                    </p>
                </div>
                <ForgotPasswordForm />
                <p className="px-8 text-center text-sm text-muted-foreground">
                    <Link
                        href="/login"
                        className="hover:text-brand underline underline-offset-4"
                    >
                        返回登录
                    </Link>
                </p>
            </div>
        </div>
    );
}
