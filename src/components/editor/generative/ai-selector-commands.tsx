"use client";

import {
    ArrowDownWideNarrow,
    CheckCheck,
    RefreshCcwDot,
    StepForward,
    WrapText,
    MessageSquarePlus,
    Smile,
    FileText,
    Languages,
    Mic,
    MoreHorizontal
} from "lucide-react";
import { useEditor } from "novel";
import { CommandGroup, CommandItem, CommandSeparator } from "@/components/ui/command";
import { useState } from "react";
import { ToneSubMenu } from "./tone-submenu";
import { TranslateSubMenu } from "./translate-submenu";

const options = [
    {
        value: "improve",
        label: "改进写作",
        icon: RefreshCcwDot,
        group: "edit"
    },
    {
        value: "fix",
        label: "修复语法",
        icon: CheckCheck,
        group: "edit"
    },
    {
        value: "shorter",
        label: "缩短文本",
        icon: ArrowDownWideNarrow,
        group: "edit"
    },
    {
        value: "longer",
        label: "扩展文本",
        icon: WrapText,
        group: "edit"
    },
    {
        value: "simplify",
        label: "简化文本",
        icon: MoreHorizontal,
        group: "edit"
    },
    {
        value: "emojify",
        label: "添加表情符号",
        icon: Smile,
        group: "edit"
    },
    {
        value: "complete_sentence",
        label: "补全句子",
        icon: MessageSquarePlus,
        group: "ai"
    },
    {
        value: "summarize",
        label: "总结",
        icon: FileText,
        group: "ai"
    },
];

interface AISelectorCommandsProps {
    onSelect: (value: string, option: string, command?: string) => void;
}

// Helper function to get selected text from editor
function getSelectedText(editor: ReturnType<typeof useEditor>["editor"]): string {
    if (!editor) return "";
    const { from, to } = editor.state.selection;
    return editor.state.doc.textBetween(from, to, " ");
}

// Helper function to get previous text before cursor
function getPreviousText(editor: ReturnType<typeof useEditor>["editor"], maxLength = 500): string {
    if (!editor) return "";
    const pos = editor.state.selection.from;
    const start = Math.max(0, pos - maxLength);
    return editor.state.doc.textBetween(start, pos, " ");
}

const AISelectorCommands = ({ onSelect }: AISelectorCommandsProps) => {
    const { editor } = useEditor();
    const [view, setView] = useState<"root" | "tone" | "translate">("root");

    if (!editor) return null;

    const handleSelect = (optionValue: string, param?: string) => {
        const text = getSelectedText(editor);
        if (text) {
            // 如果只有 text 参数，说明是普通命令
            // 如果有 param 参数（如 tone 或 language），则使用 param
            onSelect(text, optionValue);
        } else {
            // 如果没有选中文本，尝试获取光标前的文本（主要用于 continue）
            const prevText = getPreviousText(editor);
            onSelect(prevText, optionValue);
        }
    };

    if (view === "tone") {
        return (
            <ToneSubMenu
                onSelect={(tone) => {
                    const text = getSelectedText(editor) || getPreviousText(editor);
                    // 特殊处理：将 option 设置为 adjust_tone，将 tone 作为 command 传递
                    // 注意：这里我们需要一种方式将 command 传递回去。
                    // 目前的 onSelect 签名是 (value: string, option: string)
                    // value 是 prompt 内容，option 是操作类型。
                    // 我们需要修改调用方式，这里我们直接约定：
                    // 当需要传递额外参数时，我们在组件外部处理，或者简单地利用 onSelect 传递
                    // 但该组件只负责 UI。
                    // 实际上 ai-selector.tsx 里的 complete 函数接收 (prompt, options)
                    // 我们这里可以把 tone 作为 prompt 的一部分或者...

                    // 更好的方式：onSelect 应该更灵活，但在不改动接口的情况下：
                    // ai-selector.tsx 中调用 complete(value, { body: { option } })
                    // 我们可以传入 option = "adjust_tone", 然后 value = text (prompt)
                    // 但是 command 呢？

                    // 让我们修改 AISelectorCommandsProps 接口不太好改动太大
                    // 实际上 ai-selector.tsx 里是： onSelect={(value, option) => complete(value, { body: { option } })}

                    // 临时解决方案：我们无法直接传 command。
                    // 需要在 ai-selector.tsx 层面支持 command 参数。
                    // 让我们先暂时在这里直接调用闭包中的 onSelect，我们假设上层会修改。
                    // 等下我们需要去改 ai-selector.tsx 的 onSelect 签名。

                    // 现阶段，我们用一种 hack：把 tone 拼接到 option 里？ 不行。
                    // 看来必须改 ai-selector.tsx。我们先按"需要改"来写。

                    // 在这里我们假设 onSelect 可以接受第三个参数 command?
                    // 或者我们这里直接调用 onSelect(text, "adjust_tone", tone) 
                    // 现在的接口定义是 (value, option)

                    // 让我们把 onSelect 扩展一下：
                    // (value: string, option: string, command?: string) => void

                    // 这里的代码将报错直到我们修改接口。
                    onSelect(text, "adjust_tone", tone);
                }}
                onBack={() => setView("root")}
            />
        );
    }

    if (view === "translate") {
        return (
            <TranslateSubMenu
                onSelect={(language) => {
                    const text = getSelectedText(editor) || getPreviousText(editor);
                    onSelect(text, "translate", language);
                }}
                onBack={() => setView("root")}
            />
        );
    }

    return (
        <>
            <CommandGroup heading="使用 AI 编辑或审阅">
                {options.filter(o => o.group === "edit").map((option) => (
                    <CommandItem
                        onSelect={() => handleSelect(option.value)}
                        className="flex gap-2 px-4"
                        key={option.value}
                        value={option.value}
                    >
                        <option.icon className="h-4 w-4 text-purple-500" />
                        {option.label}
                    </CommandItem>
                ))}

                <CommandItem
                    onSelect={() => setView("tone")}
                    className="flex gap-2 px-4"
                    value="tone"
                >
                    <Mic className="h-4 w-4 text-purple-500" />
                    更改语气...
                </CommandItem>

                <CommandItem
                    onSelect={() => setView("translate")}
                    className="flex gap-2 px-4"
                    value="translate"
                >
                    <Languages className="h-4 w-4 text-purple-500" />
                    翻译...
                </CommandItem>
            </CommandGroup>

            <CommandSeparator />

            <CommandGroup heading="使用 AI 生成">
                <CommandItem
                    onSelect={() => {
                        const text = getPreviousText(editor);
                        onSelect(text, "continue");
                    }}
                    value="continue"
                    className="gap-2 px-4"
                >
                    <StepForward className="h-4 w-4 text-purple-500" />
                    继续写作
                </CommandItem>

                {options.filter(o => o.group === "ai").map((option) => (
                    <CommandItem
                        onSelect={() => handleSelect(option.value)}
                        className="flex gap-2 px-4"
                        key={option.value}
                        value={option.value}
                    >
                        <option.icon className="h-4 w-4 text-purple-500" />
                        {option.label}
                    </CommandItem>
                ))}
            </CommandGroup>
        </>
    );
};

export default AISelectorCommands;
