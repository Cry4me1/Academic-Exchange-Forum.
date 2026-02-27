"use client";

import { CreditRechargeDialog } from "@/components/payments/CreditRechargeDialog";
import { useEffect, useState } from "react";

/**
 * 全局充值弹窗 Provider
 * 监听 CustomEvent "open-recharge-dialog"，在任何页面（帖子编辑、VIP 页面等）
 * 触发时都能打开充值弹窗。
 */
export function CreditRechargeProvider() {
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        const handler = () => setIsOpen(true);
        window.addEventListener("open-recharge-dialog", handler);
        return () => window.removeEventListener("open-recharge-dialog", handler);
    }, []);

    return <CreditRechargeDialog isOpen={isOpen} onOpenChange={setIsOpen} />;
}
