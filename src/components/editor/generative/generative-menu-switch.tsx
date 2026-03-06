"use client";

import { Button } from "@/components/ui/button";
import { EditorBubble, useEditor } from "novel";
import { Fragment, type ReactNode } from "react";
import { AISelector } from "./ai-selector";
import Magic from "./icons/magic";

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
                placement: open ? "top-start" : "top",
                appendTo: () => document.body,
                onHidden: () => {
                    onOpenChange(false);
                },
                popperOptions: {
                    strategy: "fixed",
                    modifiers: [
                        {
                            name: "flip",
                            options: {
                                fallbackPlacements: ["bottom-start", "bottom", "top"],
                                padding: 16,
                            },
                        },
                        {
                            name: "preventOverflow",
                            options: {
                                boundary: "viewport",
                                padding: 8,
                                altAxis: true,
                                tether: false,
                            },
                        },
                    ],
                },
                maxWidth: "90vw",
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
