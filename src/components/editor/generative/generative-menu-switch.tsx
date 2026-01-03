"use client";

import { EditorBubble, useEditor } from "novel";
import { Fragment, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import Magic from "./icons/magic";
import { AISelector } from "./ai-selector";

interface GenerativeMenuSwitchProps {
    children: ReactNode;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const GenerativeMenuSwitch = ({ children, open, onOpenChange }: GenerativeMenuSwitchProps) => {
    const { editor } = useEditor();

    return (
        <EditorBubble
            tippyOptions={{
                placement: open ? "bottom-start" : "top",
                onHidden: () => {
                    onOpenChange(false);
                },
            }}
            className="flex w-fit max-w-[90vw] overflow-hidden rounded-md border border-muted bg-background shadow-xl"
        >
            {open && <AISelector open={open} onOpenChange={onOpenChange} />}
            {!open && (
                <Fragment>
                    <Button
                        className="gap-1 rounded-none text-purple-500"
                        variant="ghost"
                        onClick={() => onOpenChange(true)}
                        size="sm"
                    >
                        <Magic className="h-5 w-5" />
                        Ask AI
                    </Button>
                    {children}
                </Fragment>
            )}
        </EditorBubble>
    );
};

export default GenerativeMenuSwitch;
