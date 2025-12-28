"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PenSquare, Send } from "lucide-react";

export function QuickPostButton() {
    const [open, setOpen] = useState(false);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button
                    size="lg"
                    className="w-full gap-2 h-12 text-base font-semibold shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
                >
                    <PenSquare className="h-5 w-5" />
                    发布新帖
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold">发布新帖子</DialogTitle>
                    <DialogDescription>
                        分享您的学术见解、研究成果或问题讨论
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                    <div className="space-y-2">
                        <Label htmlFor="title">标题</Label>
                        <Input
                            id="title"
                            placeholder="输入帖子标题..."
                            className="h-11"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="content">内容</Label>
                        <textarea
                            id="content"
                            placeholder="支持 Markdown 格式和 LaTeX 公式（使用 $...$ 或 $$...$$）"
                            className="w-full min-h-[200px] p-3 rounded-md border border-input bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="tags">标签</Label>
                        <Input
                            id="tags"
                            placeholder="添加学科标签，用逗号分隔（如：Mathematics, Physics）"
                            className="h-11"
                        />
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <Button variant="outline" onClick={() => setOpen(false)}>
                            取消
                        </Button>
                        <Button className="gap-2">
                            <Send className="h-4 w-4" />
                            发布
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
