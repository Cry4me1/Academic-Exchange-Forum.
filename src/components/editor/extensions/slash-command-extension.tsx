import { Extension } from "@tiptap/core";
import Suggestion, { SuggestionOptions } from "@tiptap/suggestion";
import { ReactRenderer } from "@tiptap/react";
import tippy, { Instance, GetReferenceClientRect } from "tippy.js";
import { ReactNode, forwardRef, useEffect, useImperativeHandle, useState } from "react";

export interface CommandItemProps {
    title: string;
    description: string;
    icon: ReactNode;
    searchTerms: string[];
    command: (props: { editor: any; range: any }) => void;
}

export const Command = Extension.create({
    name: "slash-command",

    addOptions() {
        return {
            suggestion: {
                char: "/",
                command: ({ editor, range, props }: any) => {
                    props.command({ editor, range });
                },
            },
        };
    },

    addProseMirrorPlugins() {
        return [
            Suggestion({
                editor: this.editor,
                ...this.options.suggestion,
            }),
        ];
    },
});

export const renderItems = () => {
    let component: ReactRenderer<any>;
    let popup: Instance[];

    return {
        onStart: (props: any) => {
            // Create a component renderer for the CommandList
            component = new ReactRenderer(CommandList, {
                props,
                editor: props.editor,
            });

            if (!props.clientRect) {
                return;
            }

            // @ts-ignore
            popup = tippy("body", {
                getReferenceClientRect: props.clientRect,
                appendTo: () => document.body,
                content: component.element,
                showOnCreate: true,
                interactive: true,
                trigger: "manual",
                placement: "bottom-start",
            });
        },
        onUpdate(props: any) {
            component?.updateProps(props);
            if (!props.clientRect) {
                return;
            }
            popup?.[0]?.setProps({
                getReferenceClientRect: props.clientRect,
            });
        },
        onKeyDown(props: any) {
            if (props.event.key === "Escape") {
                popup?.[0].hide();
                return true;
            }
            // Delegate key events to the component
            return component?.ref?.onKeyDown(props);
        },
        onExit() {
            popup?.[0].destroy();
            component?.destroy();
        },
    };
};

// Simple Command List Component
import { cn } from "@/lib/utils";

export const CommandList = forwardRef((props: any, ref) => {
    const [selectedIndex, setSelectedIndex] = useState(0);

    const selectItem = (index: number) => {
        const item = props.items[index];
        if (item) {
            props.command(item);
        }
    };

    useEffect(() => {
        setSelectedIndex(0);
    }, [props.items]);

    useImperativeHandle(ref, () => ({
        onKeyDown: ({ event }: { event: KeyboardEvent }) => {
            if (event.key === "ArrowUp") {
                setSelectedIndex((selectedIndex + props.items.length - 1) % props.items.length);
                return true;
            }
            if (event.key === "ArrowDown") {
                setSelectedIndex((selectedIndex + 1) % props.items.length);
                return true;
            }
            if (event.key === "Enter") {
                selectItem(selectedIndex);
                return true;
            }
            return false;
        },
    }));

    if (props.items.length === 0) {
        return <div className="hidden" />;
    }

    return (
        <div className="flex z-50 flex-col overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md animate-in fade-in zoom-in-95 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2">
            <div className="max-h-[300px] overflow-y-auto p-1">
                {props.items.map((item: CommandItemProps, index: number) => (
                    <button
                        key={index}
                        className={cn(
                            "flex w-full select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors",
                            index === selectedIndex ? "bg-accent text-accent-foreground" : "hover:bg-accent hover:text-accent-foreground"
                        )}
                        onClick={() => selectItem(index)}
                    >
                        <div className="flex items-center justify-center border rounded-md h-8 w-8 bg-background">
                            {item.icon}
                        </div>
                        <div className="flex flex-col text-left">
                            <span className="font-medium">{item.title}</span>
                            <span className="text-xs text-muted-foreground">{item.description}</span>
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
});

CommandList.displayName = "CommandList";
