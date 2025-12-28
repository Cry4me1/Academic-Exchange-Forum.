"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

export interface HeadingItem {
    id: string;
    text: string;
    level: number;
}

interface TableOfContentsProps {
    headings: HeadingItem[];
    className?: string;
}

export function TableOfContents({ headings, className }: TableOfContentsProps) {
    const [activeId, setActiveId] = useState<string>("");

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setActiveId(entry.target.id);
                    }
                });
            },
            {
                rootMargin: "-80px 0px -80% 0px",
                threshold: 0,
            }
        );

        headings.forEach(({ id }) => {
            const element = document.getElementById(id);
            if (element) {
                observer.observe(element);
            }
        });

        return () => observer.disconnect();
    }, [headings]);

    const scrollToHeading = (id: string) => {
        const element = document.getElementById(id);
        if (element) {
            const yOffset = -100;
            const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
            window.scrollTo({ top: y, behavior: "smooth" });
        }
    };

    if (headings.length === 0) {
        return null;
    }

    return (
        <nav className={cn("space-y-1", className)}>
            <h3 className="font-semibold text-sm text-foreground mb-3">目录</h3>
            <ul className="space-y-1">
                {headings.map((heading) => (
                    <li key={heading.id}>
                        <button
                            onClick={() => scrollToHeading(heading.id)}
                            className={cn(
                                "toc-item text-left text-sm text-muted-foreground hover:text-foreground w-full py-1 truncate",
                                `level-${heading.level}`,
                                activeId === heading.id && "active"
                            )}
                            title={heading.text}
                        >
                            {heading.text}
                        </button>
                    </li>
                ))}
            </ul>
        </nav>
    );
}

export default TableOfContents;
