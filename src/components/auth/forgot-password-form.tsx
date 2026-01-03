"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { forgotPasswordSchema, type ForgotPasswordFormData } from "@/lib/validations/auth";
import { forgotPassword } from "@/app/auth/actions";

import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export function ForgotPasswordForm() {
    const [isPending, startTransition] = useTransition();

    const form = useForm<ForgotPasswordFormData>({
        resolver: zodResolver(forgotPasswordSchema),
        defaultValues: {
            email: "",
        },
    });

    function onSubmit(data: ForgotPasswordFormData) {
        startTransition(async () => {
            const formData = new FormData();
            formData.append("email", data.email);

            const result = await forgotPassword(formData);

            if (result?.error) {
                toast.error("发送失败", {
                    description: result.error,
                });
            } else {
                toast.success("邮件已发送", {
                    description: "请查收您的邮箱以重置密码。",
                });
                form.reset();
            }
        });
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>邮箱地址</FormLabel>
                            <FormControl>
                                <Input placeholder="name@example.com" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <Button type="submit" className="w-full" disabled={isPending}>
                    {isPending ? "发送中..." : "发送重置链接"}
                </Button>
            </form>
        </Form>
    );
}
