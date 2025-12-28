"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PenSquare } from "lucide-react";

export function QuickPostButton() {
    return (
        <Link href="/posts/new">
            <Button
                size="lg"
                className="w-full gap-2 h-12 text-base font-semibold shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
            >
                <PenSquare className="h-5 w-5" />
                发布新帖
            </Button>
        </Link>
    );
}
