"use client";

import { CommandGroup, CommandItem } from "@/components/ui/command";
import { Mic } from "lucide-react";

interface ToneSubMenuProps {
    onSelect: (tone: string) => void;
    onBack: () => void;
}

const tones = [
    { value: "academic", label: "学术" },
    { value: "business", label: "商务" },
    { value: "casual", label: "随意" },
    { value: "child_friendly", label: "儿童友好" },
    { value: "confident", label: "自信" },
    { value: "conversational", label: "对话式" },
    { value: "creative", label: "创意" },
    { value: "emotional", label: "情感化" },
    { value: "excited", label: "兴奋" },
    { value: "formal", label: "正式" },
    { value: "friendly", label: "友好" },
    { value: "funny", label: "滑稽" },
    { value: "humorous", label: "幽默" },
    { value: "informative", label: "信息量大" },
    { value: "inspirational", label: "励志" },
    { value: "memeify", label: "表情包式" },
    { value: "narrative", label: "叙述性" },
    { value: "objective", label: "客观" },
    { value: "persuasive", label: "说服性" },
    { value: "poetic", label: "诗意" },
];

export const ToneSubMenu = ({ onSelect, onBack }: ToneSubMenuProps) => {
    return (
        <CommandGroup heading="选择语气">
            <CommandItem
                onSelect={onBack}
                value="back_to_menu"
                className="flex gap-2 px-4 text-muted-foreground"
            >
                ← 返回
            </CommandItem>
            {tones.map((tone) => (
                <CommandItem
                    key={tone.value}
                    onSelect={() => onSelect(tone.label)} // 传递中文标签给 prompt
                    value={tone.value}
                    className="flex gap-2 px-4"
                >
                    <Mic className="h-4 w-4 text-purple-500" />
                    {tone.label}
                </CommandItem>
            ))}
        </CommandGroup>
    );
};
