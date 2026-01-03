"use client";

import { useEffect, useState, useRef } from "react";
import { useEditor } from "novel";
import { AISelector } from "./ai-selector";

export const SlashAISelector = () => {
    const { editor } = useEditor();
    const [open, setOpen] = useState(false);
    const [initialOption, setInitialOption] = useState<string | undefined>(undefined);
    const [position, setPosition] = useState({ top: 0, left: 0 });

    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleTriggerContinue = () => {
            if (!editor) return;
            const { view } = editor;
            // 获取光标坐标
            const coords = view.coordsAtPos(view.state.selection.from);

            // 设置位置和初始选项
            setPosition({ top: coords.bottom + 10, left: coords.left });
            setInitialOption("continue");
            setOpen(true);
        };

        const handleTriggerAsk = () => {
            if (!editor) return;
            const { view } = editor;
            const coords = view.coordsAtPos(view.state.selection.from);

            setPosition({ top: coords.bottom + 10, left: coords.left });
            setInitialOption(undefined); // undefined means "ask" input mode
            setOpen(true);
        };

        window.addEventListener("trigger-ai-continue", handleTriggerContinue);
        window.addEventListener("trigger-ai-ask", handleTriggerAsk);

        return () => {
            window.removeEventListener("trigger-ai-continue", handleTriggerContinue);
            window.removeEventListener("trigger-ai-ask", handleTriggerAsk);
        };
    }, [editor]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setOpen(false);
            }
        };
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                setOpen(false);
                // 恢复编辑器焦点
                editor?.commands.focus();
            }
        };

        if (open) {
            document.addEventListener("mousedown", handleClickOutside);
            document.addEventListener("keydown", handleKeyDown);
        }
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [open, editor]);

    if (!open) return null;

    return (
        <div
            ref={menuRef}
            style={{
                position: "fixed",
                top: position.top,
                left: position.left,
                zIndex: 99999,
            }}
            className="shadow-xl rounded-md border bg-background animate-in fade-in zoom-in-95 duration-200"
        >
            <AISelector
                open={open}
                onOpenChange={setOpen}
                initialOption={initialOption}
            />
        </div>
    );
};
