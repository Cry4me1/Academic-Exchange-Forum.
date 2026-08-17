"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
    Sparkles, 
    ArrowUpRight, 
    Sigma, 
    Code2, 
    Swords, 
    GitFork, 
    Award, 
    PenTool,
    Atom,
    BrainCircuit,
    Layers,
    Quote
} from "lucide-react";
import { MathText } from "@/components/ui/math-text";

interface ShowcaseItem {
    id: string;
    tag: string;
    title: string;
    highlight: string;
    latex?: string;
    codeSnippet?: string;
    author: {
        name: string;
        institution: string;
        avatarGrad: string;
    };
    accentColor: string;
    badgeIcon: React.ElementType;
}

// 第一排卡片（前沿学者与核心理论）
const TOP_ITEMS: ShowcaseItem[] = [
    {
        id: "c-top-1",
        tag: "理论物理 · 弦论与全息",
        title: "量子纠缠的引力对偶与全息时空重构",
        highlight: "纠缠熵的几何测度确立了弯曲时空的微观引力机制",
        latex: "$$S_{\\text{EE}} = \\frac{\\text{Area}(\\gamma_A)}{4G_N}$$",
        author: {
            name: "沈知远 教授",
            institution: "高能物理研究所",
            avatarGrad: "from-amber-400 to-orange-600",
        },
        accentColor: "#f59e0b",
        badgeIcon: Atom,
    },
    {
        id: "c-top-2",
        tag: "大模型理论 · 记忆机制",
        title: "超长上下文注意力剪枝与无损记忆边界",
        highlight: "稀疏注意力掩码在保持困惑度不变的前提下降低 70% 显存消耗",
        codeSnippet: "scores = (Q @ K.T) * (d_k ** -0.5)\nmask_attn = sparse_topk(scores, k=64)",
        author: {
            name: "Dr. Elena Rostova",
            institution: "Scholarly 智能实验室",
            avatarGrad: "from-purple-400 to-indigo-600",
        },
        accentColor: "#a855f7",
        badgeIcon: BrainCircuit,
    },
    {
        id: "c-top-3",
        tag: "微分流形 · 拓扑学",
        title: "紧致辛流形上的弗洛尔同调与相交几何",
        highlight: "辛拓扑不变量揭示了高维哈密顿系统周期轨道的守恒规律",
        latex: "$$HF_*(L_0, L_1) \\cong H_*(L_0 \\cap L_1)$$",
        author: {
            name: "林承宇 博士",
            institution: "应用数学国际中心",
            avatarGrad: "from-cyan-400 to-blue-600",
        },
        accentColor: "#06b6d4",
        badgeIcon: Sigma,
    },
    {
        id: "c-top-4",
        tag: "凝聚态物理 · 量子物态",
        title: "分数量子反常霍尔效应在魔角石墨烯中的实现",
        highlight: "无外加磁场条件下实现精确量子化霍尔电阻平台的突破",
        latex: "$$\\sigma_{xy} = \\frac{e^2}{h} \\cdot \\mathcal{C}$$",
        author: {
            name: "顾怀安 教授",
            institution: "量子科学国家重点实验室",
            avatarGrad: "from-emerald-400 to-teal-600",
        },
        accentColor: "#10b981",
        badgeIcon: Sparkles,
    },
    {
        id: "c-top-5",
        tag: "天体物理 · 相对论",
        title: "双黑洞并合引力波形的高阶多极矩精确拟合",
        highlight: "通过数值相对论波形库校准引力辐射各向异性能量损耗",
        latex: "$$h_+(t) - i h_\\times(t) = \\sum_{l,m} h_{lm}(t)\\,_{-2}Y_{lm}$$",
        author: {
            name: "Marcus Vance",
            institution: "天体物理观测中心",
            avatarGrad: "from-rose-400 to-pink-600",
        },
        accentColor: "#f43f5e",
        badgeIcon: Layers,
    },
];

// 第二排卡片（平台学术工具与生态）
const BOTTOM_ITEMS: ShowcaseItem[] = [
    {
        id: "c-bot-1",
        tag: "排版引擎 · 实时数学",
        title: "毫秒级 KaTeX 符号公式解析与交互推导",
        highlight: "支持行内与跨行张量公式无缝排版，数学推导清晰可辨",
        latex: "$$\\nabla \\times \\mathbf{B} = \\mu_0 \\mathbf{J} + \\mu_0 \\varepsilon_0 \\frac{\\partial \\mathbf{E}}{\\partial t}$$",
        author: {
            name: "KaTeX 核心系统",
            institution: "Scholarly 排版架构",
            avatarGrad: "from-amber-400 to-yellow-600",
        },
        accentColor: "#f59e0b",
        badgeIcon: Sigma,
    },
    {
        id: "c-bot-2",
        tag: "学术对决 · 假说答辩",
        title: "学术对决 (Duel)：前沿争议假说的同行评判擂台",
        highlight: "实时投票态势与结构化答辩流程，让学术真理越辩越明",
        author: {
            name: "学术对决委员会",
            institution: "Scholarly Duel",
            avatarGrad: "from-rose-400 to-red-600",
        },
        accentColor: "#ef4444",
        badgeIcon: Swords,
    },
    {
        id: "c-bot-3",
        tag: "知识拓扑 · 文献溯源",
        title: "双向文献反向引用 (Backlinks) 与共引网络",
        highlight: "自动构建跨论文与研讨的学科关联图谱，追溯知识衍生脉络",
        author: {
            name: "知识图谱服务",
            institution: "Scholarly Graph",
            avatarGrad: "from-cyan-400 to-indigo-600",
        },
        accentColor: "#06b6d4",
        badgeIcon: GitFork,
    },
    {
        id: "c-bot-4",
        tag: "算法环境 · 代码高亮",
        title: "50+ 编程语言高亮与沙盒代码片段一键运行",
        highlight: "One Dark 现代暗黑主题与行号对齐，专为算法交流打造",
        codeSnippet: "def kl_divergence(p, q):\n    return torch.sum(p * torch.log(p / (q + 1e-9)), dim=-1)",
        author: {
            name: "算法沙盒团队",
            institution: "Scholarly Sandbox",
            avatarGrad: "from-emerald-400 to-green-600",
        },
        accentColor: "#10b981",
        badgeIcon: Code2,
    },
    {
        id: "c-bot-5",
        tag: "声誉体系 · 同行认证",
        title: "基于同行评审与学术贡献度的量化声誉体系",
        highlight: "以严肃学术评价取代娱乐点赞，打造高质量研究者殿堂",
        author: {
            name: "同行评审仲裁组",
            institution: "Scholarly Trust",
            avatarGrad: "from-purple-400 to-amber-500",
        },
        accentColor: "#a855f7",
        badgeIcon: Award,
    },
    {
        id: "c-bot-6",
        tag: "沉浸创作 · 智能编辑",
        title: "Notion 式斜杠指令编辑器：/math、/code 秒级插入",
        highlight: "支持实时草稿同步与版本对比，提升学术输出效率",
        author: {
            name: "Novel 编辑器引擎",
            institution: "Scholarly Editor",
            avatarGrad: "from-orange-400 to-rose-500",
        },
        accentColor: "#f97316",
        badgeIcon: PenTool,
    },
];

// 单个高对比度立体卡片
function SingleCurvedCard({ item }: { item: ShowcaseItem }) {
    const Icon = item.badgeIcon;

    return (
        <div className="relative group shrink-0 w-[310px] sm:w-[330px] h-[375px] rounded-3xl p-6 flex flex-col justify-between overflow-hidden bg-white/95 dark:bg-[#0c121c]/95 border-2 border-slate-200/90 dark:border-white/[0.12] hover:border-orange-500 dark:hover:border-amber-400 shadow-xl dark:shadow-2xl dark:shadow-black/70 transition-all duration-300 select-none hover:-translate-y-2 hover:shadow-orange-500/15">
            {/* 渐变光晕 */}
            <div className="absolute inset-0 bg-gradient-to-b from-slate-500/[0.03] dark:from-white/[0.04] via-transparent to-black/10 dark:to-black/60 pointer-events-none" />
            <div
                className="absolute -top-20 -right-20 w-44 h-44 rounded-full blur-3xl opacity-20 dark:opacity-30 group-hover:opacity-40 transition-opacity duration-300 pointer-events-none"
                style={{ backgroundColor: item.accentColor }}
            />

            {/* 顶部标签与图标 */}
            <div className="relative z-10">
                <div className="flex items-center justify-between mb-3.5">
                    <span className="text-xs font-mono font-bold text-orange-600 dark:text-amber-300 px-3 py-1 rounded-full bg-orange-50 dark:bg-amber-400/10 border border-orange-200 dark:border-amber-400/25 shadow-xs">
                        {item.tag}
                    </span>
                    <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-white/10 flex items-center justify-center border border-slate-200 dark:border-white/15 text-orange-600 dark:text-amber-300 group-hover:scale-110 transition-all">
                        <Icon className="w-4 h-4" />
                    </div>
                </div>

                {/* 核心标题：极高清晰度 */}
                <h4 className="text-lg md:text-xl font-black text-slate-900 dark:text-white leading-snug tracking-tight group-hover:text-orange-600 dark:group-hover:text-amber-300 transition-colors line-clamp-2">
                    {item.title}
                </h4>
            </div>

            {/* 中部公式 / 代码 / 见解 */}
            <div className="relative z-10 my-auto py-1">
                {item.latex && (
                    <div className="py-3 px-2 rounded-2xl bg-slate-50 dark:bg-black/75 border border-slate-200 dark:border-white/15 text-center text-slate-900 dark:text-white overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden my-1 shadow-inner flex items-center justify-center">
                        <MathText text={item.latex} className="text-sm sm:text-base text-slate-900 dark:text-amber-200 font-serif font-bold max-w-full" />
                    </div>
                )}

                {item.codeSnippet && (
                    <div className="p-3 rounded-2xl bg-slate-950 text-slate-200 border border-slate-800 font-mono text-[11px] leading-relaxed overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden my-1 shadow-inner">
                        <pre className="whitespace-pre-wrap font-semibold text-emerald-400">{item.codeSnippet}</pre>
                    </div>
                )}

                {!item.latex && !item.codeSnippet && (
                    <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/[0.05] border border-slate-200 dark:border-white/10 text-xs text-slate-700 dark:text-slate-200 leading-relaxed my-1 font-medium">
                        <Quote className="w-3.5 h-3.5 text-orange-500 dark:text-amber-400 inline mr-1 opacity-90" />
                        {item.highlight}
                    </div>
                )}
            </div>

            {/* 底部作者身份与头像 */}
            <div className="relative z-10 pt-3.5 border-t border-slate-200 dark:border-white/15 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${item.author.avatarGrad} flex items-center justify-center text-white font-extrabold text-xs ring-2 ring-orange-400/40 dark:ring-amber-400/40 shrink-0 shadow-md`}>
                        {item.author.name.slice(0, 1)}
                    </div>
                    <div className="min-w-0">
                        <div className="text-xs font-black text-slate-900 dark:text-white group-hover:text-orange-600 dark:group-hover:text-amber-300 transition-colors truncate">
                            {item.author.name}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-300 font-medium truncate">
                            {item.author.institution}
                        </div>
                    </div>
                </div>

                <div className="w-7 h-7 rounded-full bg-orange-100 dark:bg-amber-400/15 border border-orange-200 dark:border-amber-400/30 flex items-center justify-center text-orange-600 dark:text-amber-300 group-hover:bg-orange-500 dark:group-hover:bg-amber-400 group-hover:text-white dark:group-hover:text-slate-950 transition-all duration-200">
                    <ArrowUpRight className="w-4 h-4 font-bold" />
                </div>
            </div>
        </div>
    );
}

// 具有轻柔、雾透、渐隐消散意境的学术打字机组件
function MistTypewriter() {
    const words = [
        "探索真理",
        "沉淀思想",
        "推导本质",
        "重构认知",
        "启迪智慧",
        "见证突破",
        "溯源求索",
        "叩问未知",
    ];

    const [index, setIndex] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setIndex((prev) => (prev + 1) % words.length);
        }, 3600);
        return () => clearInterval(timer);
    }, [words.length]);

    const currentWord = words[index];

    return (
        <span className="inline-flex items-center text-left">
            <AnimatePresence mode="wait">
                <motion.span
                    key={currentWord}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    variants={{
                        hidden: {},
                        visible: {
                            transition: {
                                staggerChildren: 0.1,
                            },
                        },
                        exit: {
                            opacity: 0,
                            filter: "blur(14px)",
                            y: -10,
                            scale: 1.06,
                            transition: {
                                duration: 0.65,
                                ease: [0.4, 0, 0.2, 1],
                            },
                        },
                    }}
                    className="bg-clip-text text-transparent bg-gradient-to-r from-orange-600 via-amber-500 to-amber-600 dark:from-amber-300 dark:via-orange-300 dark:to-amber-400 inline-block font-black ml-2"
                >
                    {currentWord.split("").map((char, i) => (
                        <motion.span
                            key={i}
                            variants={{
                                hidden: {
                                    opacity: 0,
                                    filter: "blur(10px)",
                                    y: 10,
                                    scale: 0.9,
                                },
                                visible: {
                                    opacity: 1,
                                    filter: "blur(0px)",
                                    y: 0,
                                    scale: 1,
                                    transition: {
                                        duration: 0.5,
                                        ease: [0.22, 1, 0.36, 1],
                                    },
                                },
                            }}
                            className="inline-block"
                        >
                            {char}
                        </motion.span>
                    ))}
                </motion.span>
            </AnimatePresence>
        </span>
    );
}

// 卡片飞入动画变体
const flightContainerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.07,
            delayChildren: 0.15,
        },
    },
};

const flightCardVariants = {
    hidden: (i: number) => ({
        opacity: 0,
        scale: 0.55,
        y: 130,
        rotateX: 26,
        rotateY: i % 2 === 0 ? -18 : 18,
        filter: "blur(14px)",
    }),
    visible: {
        opacity: 1,
        scale: 1,
        y: 0,
        rotateX: 0,
        rotateY: 0,
        filter: "blur(0px)",
        transition: {
            type: "spring" as const,
            damping: 18,
            stiffness: 80,
            mass: 0.9,
        },
    },
};

export function Features() {
    const topRowList = [...TOP_ITEMS, ...TOP_ITEMS, ...TOP_ITEMS];
    const bottomRowList = [...BOTTOM_ITEMS, ...BOTTOM_ITEMS, ...BOTTOM_ITEMS];

    return (
        <section className="relative py-28 overflow-hidden bg-slate-50/70 dark:bg-[#07090e] text-slate-900 dark:text-white transition-colors duration-700">
            {/* === 1. 多层环境极光 === */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[1100px] h-[550px] bg-gradient-to-b from-amber-500/15 via-orange-500/10 to-transparent blur-[140px] rounded-full dark:from-amber-400/15 dark:via-purple-600/10" />
                <div className="absolute bottom-0 left-0 w-[550px] h-[550px] bg-indigo-500/10 dark:bg-indigo-600/12 blur-[150px] rounded-full" />
                <div className="absolute bottom-0 right-0 w-[550px] h-[550px] bg-amber-500/10 dark:bg-orange-600/10 blur-[150px] rounded-full" />
            </div>

            {/* === 2. 精细网格线 === */}
            <div
                className="absolute inset-0 opacity-[0.025] dark:opacity-[0.035] pointer-events-none"
                style={{
                    backgroundImage: `linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)`,
                    backgroundSize: "48px 48px",
                }}
            />

            {/* === 3. 标题区 === */}
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                className="relative z-10 max-w-5xl mx-auto px-6 text-center mb-14"
            >
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold bg-white/80 dark:bg-white/[0.05] text-orange-600 dark:text-amber-300 border border-slate-200/80 dark:border-white/10 mb-4 shadow-xs">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    前沿学术全景 · 思想回响
                </div>
                <h2 className="text-3xl md:text-5xl font-black tracking-tight mb-4 text-slate-900 dark:text-white flex flex-wrap items-center justify-center">
                    <span>在碰撞中演进，在严谨中</span>
                    <MistTypewriter />
                </h2>
                <p className="text-base md:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed font-medium">
                    汇聚各学科前沿学者的深邃洞见与专为严谨交流打造的核心学术生态。
                </p>
            </motion.div>

            {/* === 4. 滚动触发：卡片一张一张破空飞入与 3D 环幕巡航 === */}
            <motion.div
                data-showcase="true"
                variants={flightContainerVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-60px" }}
                className="relative w-full overflow-hidden [perspective:1800px]"
            >
                {/* 左右两侧平滑羽化渐变遮罩 */}
                <div className="pointer-events-none absolute inset-y-0 left-0 w-28 md:w-64 bg-gradient-to-r from-slate-50 dark:from-[#07090e] via-slate-50/90 dark:via-[#07090e]/90 to-transparent z-20" />
                <div className="pointer-events-none absolute inset-y-0 right-0 w-28 md:w-64 bg-gradient-to-l from-slate-50 dark:from-[#07090e] via-slate-50/90 dark:via-[#07090e]/90 to-transparent z-20" />

                {/* 轨道 1：向左平稳滚动（卡片错落飞入） */}
                <div className="flex gap-6 md:gap-8 py-3 w-max animate-track-left hover:[animation-play-state:paused] [transform:rotateX(1.8deg)]">
                    {topRowList.map((item, idx) => (
                        <motion.div
                            key={`top-${item.id}-${idx}`}
                            custom={idx}
                            variants={flightCardVariants}
                        >
                            <SingleCurvedCard item={item} />
                        </motion.div>
                    ))}
                </div>

                {/* 轨道 2：向右平稳滚动（卡片错落飞入） */}
                <div className="flex gap-6 md:gap-8 py-3 w-max animate-track-right hover:[animation-play-state:paused] [transform:rotateX(-1.8deg)] mt-3">
                    {bottomRowList.map((item, idx) => (
                        <motion.div
                            key={`bot-${item.id}-${idx}`}
                            custom={idx + 4}
                            variants={flightCardVariants}
                        >
                            <SingleCurvedCard item={item} />
                        </motion.div>
                    ))}
                </div>
            </motion.div>

            {/* === 5. 纯 GPU 硬件加速无缝平滑关键帧（无扭曲歪斜） === */}
            <style jsx>{`
                @keyframes smooth-marquee-left {
                    0% {
                        transform: rotateX(1.8deg) translate3d(0, 0, 0);
                    }
                    100% {
                        transform: rotateX(1.8deg) translate3d(-33.333%, 0, 0);
                    }
                }

                @keyframes smooth-marquee-right {
                    0% {
                        transform: rotateX(-1.8deg) translate3d(-33.333%, 0, 0);
                    }
                    100% {
                        transform: rotateX(-1.8deg) translate3d(0, 0, 0);
                    }
                }

                .animate-track-left {
                    animation: smooth-marquee-left 52s linear infinite;
                    will-change: transform;
                }

                .animate-track-right {
                    animation: smooth-marquee-right 56s linear infinite;
                    will-change: transform;
                }
            `}</style>
        </section>
    );
}
