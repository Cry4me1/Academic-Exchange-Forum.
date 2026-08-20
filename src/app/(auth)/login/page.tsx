import { Suspense } from "react";
import { LoginForm } from "@/components/auth/login-form";
import { Loader2 } from "lucide-react";

export default function LoginPage() {
    return (
        <Suspense
            fallback={
                <div className="flex flex-col items-center justify-center min-h-[400px] text-muted-foreground gap-3">
                    <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
                    <span className="text-sm">正在加载登录通道...</span>
                </div>
            }
        >
            <LoginForm />
        </Suspense>
    );
}
