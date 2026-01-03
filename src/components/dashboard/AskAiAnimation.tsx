"use client";

import React, { useEffect, useState, useRef } from 'react';

// Animation phases
enum Phase {
    IDLE = 0,
    SELECT_TEXT = 1,        // Cursor moves to select text
    MENU_APPEAR = 2,        // Main menu pops up
    HOVER_TONE = 3,         // Cursor hovers "Change Tone"
    HOVER_TRANSLATE = 4,    // Cursor hovers "Translate"
    CLICK_ENGLISH = 5,      // Cursor clicks "English"
    PROCESSING = 6,         // AI Thinking
    RESULT_APPEAR = 7,      // Result menu pops up
    CLICK_INSERT = 8,       // Click "Insert Below"
    TEXT_UPDATE = 9,        // Text is inserted
    COMPLETE = 10           // Reset
}

const AskAiAnimation: React.FC = () => {
    const [phase, setPhase] = useState<Phase>(Phase.IDLE);
    const [typedText, setTypedText] = useState("");

    // Refs
    const timeouts = useRef<ReturnType<typeof setTimeout>[]>([]);

    // Coordinates & Layout
    const textLineStart = { x: 100, y: 130 };
    const textLineEnd = { x: 460, y: 130 }; // End of selection

    // Menu Positions
    const menuPos = { x: 140, y: 190 };
    const subMenuPos = { x: 435, y: 220 }; // Adjusted for Tone/Translate vertical positions

    // Cursor Targets (Relative to SVG)
    // Menu Item Heights: Item 1 (Improve) ~265+32*0, Item 4 (Tone) ~265+32*3, Item 5 (Translate) ~265+32*4
    // Main Menu Y start = 190. List starts at +65. Items start at +25. Item Height 36.

    // Hover "Change Tone" (Item index 3)
    // Y = 190 + 65 + 25 + (3 * 36) + 16 (center) = 404
    const targetTone = { x: 280, y: 404 };

    // Hover "Translate" (Item index 4)
    // Y = 190 + 65 + 25 + (4 * 36) + 16 (center) = 440
    const targetTranslate = { x: 280, y: 440 };

    // Submenu Targets
    // Translate Submenu starts at menuPos.y + 150 = 340 (to avoid clipping at bottom)
    // English item is at index 0 inside submenu.
    // Y = 340 + 10 (padding) + 16 (center) = 366
    const targetEnglish = { x: 515, y: 366 };

    // Result Actions
    // Result Menu starts at 190. Insert button at +75.
    // Y = 190 + 75 + 18 (center) = 283
    const targetInsert = { x: 290, y: 283 };

    const addTimeout = (fn: () => void, delay: number) => {
        const id = setTimeout(fn, delay);
        timeouts.current.push(id);
    };

    useEffect(() => {
        const runAnimation = () => {
            setPhase(Phase.IDLE);
            setTypedText("");

            // 1. Select Text
            addTimeout(() => setPhase(Phase.SELECT_TEXT), 1000);

            // 2. Menu Appears
            addTimeout(() => setPhase(Phase.MENU_APPEAR), 2500);

            // 3. Hover Tone (Show Tone Submenu)
            addTimeout(() => setPhase(Phase.HOVER_TONE), 3500);

            // 4. Hover Translate (Switch to Translate Submenu)
            addTimeout(() => setPhase(Phase.HOVER_TRANSLATE), 5000);

            // 5. Click English
            addTimeout(() => setPhase(Phase.CLICK_ENGLISH), 6000);

            // 6. Processing
            addTimeout(() => setPhase(Phase.PROCESSING), 6500);

            // 7. Result Appears
            addTimeout(() => setPhase(Phase.RESULT_APPEAR), 8000);

            // 8. Click Insert
            addTimeout(() => setPhase(Phase.CLICK_INSERT), 9000);

            // 9. Update Text
            addTimeout(() => setPhase(Phase.TEXT_UPDATE), 9500);

            // 10. Complete & Loop
            addTimeout(() => setPhase(Phase.COMPLETE), 12000);
            addTimeout(runAnimation, 14000);
        };

        runAnimation();

        return () => {
            timeouts.current.forEach(clearTimeout);
            timeouts.current = [];
        };
    }, []);

    // --- Visual Helper Calculation ---

    const getCursorPosition = () => {
        switch (phase) {
            case Phase.IDLE: return { x: 480, y: 320 }; // Resting
            case Phase.SELECT_TEXT: return textLineEnd;
            case Phase.MENU_APPEAR: return textLineEnd; // Stay put
            case Phase.HOVER_TONE: return targetTone;
            case Phase.HOVER_TRANSLATE: return targetTranslate;
            case Phase.CLICK_ENGLISH: return targetEnglish;
            case Phase.PROCESSING: return { x: 600, y: 350 }; // Move away
            case Phase.RESULT_APPEAR: return { x: 600, y: 350 };
            case Phase.CLICK_INSERT: return targetInsert;
            case Phase.TEXT_UPDATE: return { x: 600, y: 400 };
            case Phase.COMPLETE: return { x: 600, y: 400 };
            default: return { x: 0, y: 0 };
        }
    };

    const cursorPos = getCursorPosition();

    // State booleans
    const isTextSelected = phase >= Phase.SELECT_TEXT && phase < Phase.COMPLETE;
    const showMainMenu = phase >= Phase.MENU_APPEAR && phase < Phase.PROCESSING;
    const showToneMenu = phase === Phase.HOVER_TONE;
    const showTranslateMenu = phase >= Phase.HOVER_TRANSLATE && phase < Phase.PROCESSING;
    const showProcessing = phase === Phase.PROCESSING;
    const showResultMenu = phase >= Phase.RESULT_APPEAR && phase < Phase.TEXT_UPDATE;
    const isTextInserted = phase >= Phase.TEXT_UPDATE && phase < Phase.COMPLETE;

    // Icons
    const ArrowRightIcon = () => (
        <path d="M1 1L5 5L1 9" stroke="#94a3b8" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    );

    const CheckIcon = () => (
        <path d="M2 6L6 10L14 2" stroke="#a855f7" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    );

    return (
        <div className="w-full aspect-[8/5] bg-slate-50 relative select-none overflow-hidden rounded-lg cursor-default border border-slate-100 dark:bg-slate-900 dark:border-slate-800">
            <svg
                viewBox="0 0 800 500"
                className="w-full h-full"
                preserveAspectRatio="xMidYMid meet"
            >
                <defs>
                    <filter id="shadow-lg" x="-20%" y="-20%" width="140%" height="140%">
                        <feDropShadow dx="0" dy="8" stdDeviation="12" floodColor="#000000" floodOpacity="0.1" />
                    </filter>
                    <clipPath id="doc-clip">
                        <rect x="50" y="40" width="700" height="420" rx="8" />
                    </clipPath>
                    <linearGradient id="gradient-highlight" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#ddd6fe" />
                        <stop offset="100%" stopColor="#e9d5ff" />
                    </linearGradient>
                </defs>

                {/* --- Document Background (White Paper) --- */}
                <g clipPath="url(#doc-clip)">
                    <rect x="50" y="40" width="700" height="420" fill="#ffffff" />

                    {/* Document Content */}
                    <g transform="translate(100, 90)">
                        <text x="0" y="0" fontSize="24" fontWeight="bold" fill="#1e293b" fontFamily="sans-serif">人工智能在现代学术研究中的应用</text>

                        {/* Text Paragraph */}
                        <g transform="translate(0, 40)">
                            {/* Selection Highlight */}
                            <rect
                                x="-4" y="-14"
                                width={isTextSelected ? "360" : "0"}
                                height="24"
                                fill="url(#gradient-highlight)"
                                opacity={0.5}
                                className="transition-all duration-700 ease-out"
                            />

                            {/* Line 1 */}
                            <text x="0" y="0" fontSize="16" fill="#334155" fontFamily="sans-serif">
                                本研究旨在探讨生成式预训练变换模型
                            </text>

                            {/* Line 2 */}
                            <text x="0" y="30" fontSize="16" fill="#334155" fontFamily="sans-serif">
                                在自然语言处理任务中的表现及其优化策略。
                            </text>

                            {/* Inserted Translation Text (Animated) */}
                            <g
                                transform="translate(0, 70)"
                                opacity={isTextInserted ? 1 : 0}
                                className="transition-opacity duration-500"
                            >
                                <rect x="-10" y="-15" width="600" height="40" rx="4" fill="#f8fafc" stroke="#e2e8f0" strokeDasharray="4" />
                                <text x="0" y="10" fontSize="15" fill="#475569" fontFamily="sans-serif" fontStyle="italic">
                                    This study aims to explore the performance of GPT models...
                                </text>
                            </g>
                        </g>

                        {/* Placeholder Lines */}
                        <g transform={`translate(0, ${isTextInserted ? 180 : 130})`} className="transition-all duration-500">
                            <rect x="0" y="0" width="500" height="10" rx="2" fill="#f1f5f9" />
                            <rect x="0" y="25" width="480" height="10" rx="2" fill="#f1f5f9" />
                            <rect x="0" y="50" width="520" height="10" rx="2" fill="#f1f5f9" />
                        </g>
                    </g>
                </g>

                {/* --- Main Menu --- */}
                <g
                    transform={`translate(${menuPos.x}, ${menuPos.y})`}
                    opacity={showMainMenu ? 1 : 0}
                    className="transition-opacity duration-300"
                    style={{ pointerEvents: 'none' }}
                >
                    <rect x="0" y="0" width="300" height="270" rx="12" fill="white" filter="url(#shadow-lg)" stroke="#e2e8f0" strokeWidth="1" />

                    {/* Search Input */}
                    <g transform="translate(12, 12)">
                        <rect x="0" y="0" width="276" height="40" rx="8" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="1" />
                        <circle cx="20" cy="20" r="5" stroke="#94a3b8" strokeWidth="1.5" fill="none" />
                        <line x1="24" y1="24" x2="28" y2="28" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" />
                        <text x="40" y="25" fontSize="14" fill="#64748b" fontFamily="sans-serif">让 AI 编辑或生成...</text>

                        {/* Send Button */}
                        <circle cx="250" cy="20" r="14" fill="#a855f7" />
                        <path d="M250 14 L250 26 M250 14 L246 18 M250 14 L254 18" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </g>

                    {/* Menu List */}
                    <g transform="translate(0, 65)">
                        <text x="16" y="10" fontSize="12" fill="#94a3b8" fontFamily="sans-serif">AI 编辑功能</text>

                        {/* List Items */}
                        {[
                            { text: "改进写作", icon: "✨" },
                            { text: "修复语法", icon: "📝" },
                            { text: "缩短文本", icon: "📉" },
                            { text: "更改语气...", icon: "🎙️", hasSub: true, active: showToneMenu },
                            { text: "翻译...", icon: "🌐", hasSub: true, active: showTranslateMenu },
                        ].map((item, i) => (
                            <g key={i} transform={`translate(8, ${25 + i * 36})`}>
                                {item.active && <rect x="0" y="0" width="284" height="32" rx="6" fill="#f3f4f6" />}
                                <text x="10" y="20" fontSize="14" fill={item.active ? "#1e293b" : "#475569"}>{item.icon}</text>
                                <text x="36" y="20" fontSize="14" fill={item.active ? "#1e293b" : "#334155"} fontFamily="sans-serif" fontWeight={item.active ? "500" : "400"}>
                                    {item.text}
                                </text>
                                {item.hasSub && (
                                    <g transform="translate(260, 14)">
                                        <ArrowRightIcon />
                                    </g>
                                )}
                            </g>
                        ))}
                    </g>
                </g>

                {/* --- Submenu: Tone --- */}
                <g
                    transform={`translate(${subMenuPos.x}, ${menuPos.y + 110})`} // Positioned next to "Tone" item
                    opacity={showToneMenu ? 1 : 0}
                    className="transition-all duration-200"
                >
                    <rect x="0" y="0" width="160" height="140" rx="8" fill="white" filter="url(#shadow-lg)" stroke="#e2e8f0" strokeWidth="1" />
                    <g transform="translate(0, 10)">
                        {["学术 (Academic)", "自信 (Confident)", "友好 (Friendly)", "专业 (Professional)"].map((tone, i) => (
                            <g key={i} transform={`translate(8, ${i * 32})`}>
                                <text x="10" y="20" fontSize="13" fill="#334155" fontFamily="sans-serif">{tone}</text>
                            </g>
                        ))}
                    </g>
                </g>

                {/* --- Submenu: Translate --- */}
                <g
                    transform={`translate(${subMenuPos.x}, ${menuPos.y + 150})`} // Positioned next to "Translate" item
                    opacity={showTranslateMenu ? 1 : 0}
                    className="transition-all duration-200"
                >
                    <rect x="0" y="0" width="160" height="140" rx="8" fill="white" filter="url(#shadow-lg)" stroke="#e2e8f0" strokeWidth="1" />
                    <g transform="translate(0, 10)">
                        {/* English (Selected) */}
                        <g transform="translate(8, 0)">
                            {phase >= Phase.CLICK_ENGLISH && <rect x="0" y="0" width="144" height="32" rx="4" fill="#f3f4f6" />}
                            <text x="10" y="20" fontSize="13" fill="#334155" fontFamily="sans-serif">英语 (English)</text>
                            {phase >= Phase.CLICK_ENGLISH && <g transform="translate(120, 14)"><CheckIcon /></g>}
                        </g>

                        {["日语 (Japanese)", "法语 (French)", "德语 (German)"].map((lang, i) => (
                            <g key={i} transform={`translate(8, ${(i + 1) * 32})`}>
                                <text x="10" y="20" fontSize="13" fill="#334155" fontFamily="sans-serif">{lang}</text>
                            </g>
                        ))}
                    </g>
                </g>

                {/* --- Processing State --- */}
                <g
                    transform={`translate(${menuPos.x}, ${menuPos.y})`}
                    opacity={showProcessing ? 1 : 0}
                    className="transition-opacity duration-300"
                >
                    <rect x="0" y="0" width="300" height="56" rx="12" fill="white" filter="url(#shadow-lg)" stroke="#e2e8f0" strokeWidth="1" />
                    <g transform="translate(20, 18)">
                        <path d="M10 0L12 5L17 7L12 9L10 14L8 9L3 7L8 5Z" fill="#a855f7" />
                        <text x="30" y="14" fontSize="14" fill="#a855f7" fontFamily="sans-serif" fontWeight="600">AI 正在翻译...</text>

                        {/* Loading Dots */}
                        <circle cx="130" cy="10" r="2.5" fill="#a855f7">
                            <animate attributeName="opacity" values="0.3;1;0.3" dur="1s" repeatCount="indefinite" begin="0s" />
                        </circle>
                        <circle cx="138" cy="10" r="2.5" fill="#a855f7">
                            <animate attributeName="opacity" values="0.3;1;0.3" dur="1s" repeatCount="indefinite" begin="0.2s" />
                        </circle>
                        <circle cx="146" cy="10" r="2.5" fill="#a855f7">
                            <animate attributeName="opacity" values="0.3;1;0.3" dur="1s" repeatCount="indefinite" begin="0.4s" />
                        </circle>
                    </g>
                </g>

                {/* --- Result Menu --- */}
                <g
                    transform={`translate(${menuPos.x}, ${menuPos.y})`}
                    opacity={showResultMenu ? 1 : 0}
                    className="transition-opacity duration-300"
                >
                    <rect x="0" y="0" width="300" height="200" rx="12" fill="white" filter="url(#shadow-lg)" stroke="#e2e8f0" strokeWidth="1" />

                    {/* Header: Translated Content */}
                    <g transform="translate(16, 20)">
                        <text x="0" y="0" fontSize="12" fill="#94a3b8" fontFamily="sans-serif">翻译结果 (英语)</text>
                        <text x="0" y="25" fontSize="14" fill="#1e293b" fontFamily="sans-serif" width="260">
                            This study aims to explore...
                        </text>
                    </g>

                    <line x1="0" y1="65" x2="300" y2="65" stroke="#e2e8f0" strokeWidth="1" />

                    {/* Action 1: Insert Below */}
                    <g transform="translate(8, 75)">
                        <rect x="0" y="0" width="284" height="36" rx="6" fill="#f8fafc" stroke="#e2e8f0" />
                        <text x="40" y="23" fontSize="14" fill="#1e293b" fontFamily="sans-serif" fontWeight="500">在下方插入</text>
                        <path transform="translate(16, 12) scale(0.8)" d="M12 4V20M4 12H20" stroke="#1e293b" strokeWidth="2" strokeLinecap="round" />
                    </g>

                    {/* Action 2: Replace */}
                    <g transform="translate(8, 118)">
                        <text x="40" y="23" fontSize="14" fill="#475569" fontFamily="sans-serif">替换原文</text>
                        <path transform="translate(16, 12) scale(0.8)" d="M4 4L20 20M20 4L4 20" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" opacity="0" />
                        <path transform="translate(16, 12) scale(0.8)" d="M20 12L4 12M16 16L20 12L16 8" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                    </g>

                    {/* Action 3: Copy */}
                    <g transform="translate(8, 154)">
                        <text x="40" y="23" fontSize="14" fill="#475569" fontFamily="sans-serif">复制</text>
                        <rect x="18" y="14" width="10" height="12" rx="2" stroke="#64748b" strokeWidth="1.5" fill="none" />
                    </g>
                </g>

                {/* --- Cursor --- */}
                <g
                    className="transition-transform duration-[700ms] ease-in-out will-change-transform"
                    style={{
                        transform: `translate(${cursorPos.x}px, ${cursorPos.y}px)`,
                        zIndex: 50
                    }}
                >
                    <path
                        d="M0 0L8.5 24.5L12.5 15.5L21.5 15.5L0 0Z"
                        fill="black"
                        stroke="white"
                        strokeWidth="1.5"
                        filter="drop-shadow(2px 2px 2px rgba(0,0,0,0.2))"
                    />
                </g>
            </svg>
        </div>
    );
};

export default AskAiAnimation;
