"use client";

import { CommandGroup, CommandItem } from "@/components/ui/command";
import { Languages } from "lucide-react";

interface TranslateSubMenuProps {
    onSelect: (language: string) => void;
    onBack: () => void;
}

const languages = [
    { value: "chinese", label: "中文" },
    { value: "english", label: "English" },
    { value: "japanese", label: "日本語" },
    { value: "korean", label: "한국어" },
    { value: "french", label: "Français" },
    { value: "german", label: "Deutsch" },
    { value: "spanish", label: "Español" },
    { value: "italian", label: "Italiano" },
    { value: "russian", label: "Русский" },
    { value: "portuguese", label: "Português" },
];

export const TranslateSubMenu = ({ onSelect, onBack }: TranslateSubMenuProps) => {
    return (
        <CommandGroup heading="翻译为...">
            <CommandItem
                onSelect={onBack}
                value="back_to_menu"
                className="flex gap-2 px-4 text-muted-foreground"
            >
                ← 返回
            </CommandItem>
            {languages.map((lang) => (
                <CommandItem
                    key={lang.value}
                    onSelect={() => onSelect(lang.label)} // 传递语言标签给 prompt
                    value={lang.value}
                    className="flex gap-2 px-4"
                >
                    <Languages className="h-4 w-4 text-purple-500" />
                    {lang.label}
                </CommandItem>
            ))}
        </CommandGroup>
    );
};
