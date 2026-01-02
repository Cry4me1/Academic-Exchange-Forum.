"use client";

import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { submitReport } from "@/app/(protected)/posts/[id]/report-actions";

interface ReportDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    type: "post" | "comment" | "user";
    targetId: string;
    targetTitle?: string;
}

const REPORT_REASONS = [
    { value: "spam", label: "垃圾信息/广告" },
    { value: "inappropriate", label: "不当内容" },
    { value: "harassment", label: "骚扰/攻击性言论" },
    { value: "misinformation", label: "虚假信息" },
    { value: "copyright", label: "侵犯版权" },
    { value: "other", label: "其他" },
];

export function ReportDialog({
    open,
    onOpenChange,
    type,
    targetId,
    targetTitle,
}: ReportDialogProps) {
    const [reason, setReason] = useState("");
    const [details, setDetails] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const typeLabel = type === "post" ? "帖子" : type === "comment" ? "评论" : "用户";

    const handleSubmit = async () => {
        if (!reason) {
            toast.error("请选择举报原因");
            return;
        }

        setIsSubmitting(true);

        try {
            const result = await submitReport({
                type,
                targetId,
                targetTitle,
                reason,
                details: details.trim() || undefined,
            });

            if (result.error) {
                toast.error(result.error);
            } else {
                toast.success("举报已提交，我们会尽快处理");
                onOpenChange(false);
                setReason("");
                setDetails("");
            }
        } catch {
            toast.error("提交失败，请稍后重试");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-orange-500" />
                        举报{typeLabel}
                    </DialogTitle>
                    <DialogDescription>
                        请选择举报原因，我们会认真审核每一条举报。
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="space-y-3">
                        <Label>举报原因 *</Label>
                        <RadioGroup value={reason} onValueChange={setReason}>
                            {REPORT_REASONS.map((item) => (
                                <div key={item.value} className="flex items-center space-x-2">
                                    <RadioGroupItem value={item.value} id={item.value} />
                                    <Label htmlFor={item.value} className="font-normal cursor-pointer">
                                        {item.label}
                                    </Label>
                                </div>
                            ))}
                        </RadioGroup>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="details">补充说明（可选）</Label>
                        <Textarea
                            id="details"
                            placeholder="请详细描述问题..."
                            value={details}
                            onChange={(e) => setDetails(e.target.value)}
                            rows={3}
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={isSubmitting}
                    >
                        取消
                    </Button>
                    <Button onClick={handleSubmit} disabled={isSubmitting}>
                        {isSubmitting ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                提交中...
                            </>
                        ) : (
                            "提交举报"
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
