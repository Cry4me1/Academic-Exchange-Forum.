"use client";

import { CreateCollectionDialog } from "@/components/collections";
import NovelEditor from "@/components/editor/NovelEditor";
import PeerReviewPanel from "@/components/editor/peer-review-panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getMyCollections, syncPostCollections } from "@/app/(protected)/collections/actions";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, BookOpen, HelpCircle, Plus, Send, Sparkles, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type JSONContent } from "novel";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { createPost } from "../actions";

const AVAILABLE_TAGS = [
    "Computer Science",
    "Mathematics",
    "Physics",
    "Biology",
    "Economics",
    "Philosophy",
    "AI",
    "Chemistry",
    "Engineering",
];

// 动画变体
const pageVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1,
            delayChildren: 0.1,
        },
    },
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.5,
            ease: [0.22, 1, 0.36, 1] as const,
        },
    },
};

const DRAFT_STORAGE_KEY = "scholarly_new_post_draft_v1";

export default function NewPostPage() {
    const router = useRouter();
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [contentJson, setContentJson] = useState<JSONContent | undefined>(undefined);
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [isHelpWanted, setIsHelpWanted] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [myCollections, setMyCollections] = useState<Array<{ id: string; name: string; post_count?: number }>>([]);
    const [selectedCollectionIds, setSelectedCollectionIds] = useState<string[]>([]);
    const [isCreateCollectionOpen, setIsCreateCollectionOpen] = useState(false);
    const [hasRestoredDraft, setHasRestoredDraft] = useState(false);

    const loadCollectionsData = useCallback(async () => {
        const { collections } = await getMyCollections();
        setMyCollections(collections || []);
    }, []);

    // 页面加载：恢复未发布的本地草稿
    useEffect(() => {
        loadCollectionsData();

        try {
            const savedDraft = localStorage.getItem(DRAFT_STORAGE_KEY);
            if (savedDraft) {
                const parsed = JSON.parse(savedDraft);
                if (parsed.title) setTitle(parsed.title);
                if (parsed.tags) setSelectedTags(parsed.tags);
                if (parsed.isHelpWanted) setIsHelpWanted(parsed.isHelpWanted);
                if (parsed.contentJson) {
                    setContentJson(parsed.contentJson);
                    setContent("valid");
                }
                setHasRestoredDraft(true);
                toast.info("已自动恢复您上次未发布的草稿内容");
            }
        } catch (e) {
            console.error("Failed to restore draft from localStorage:", e);
        }
    }, [loadCollectionsData]);

    // 自动暂存草稿到 localStorage (防抖)
    useEffect(() => {
        if (!title && !contentJson && selectedTags.length === 0) return;

        const timer = setTimeout(() => {
            try {
                localStorage.setItem(
                    DRAFT_STORAGE_KEY,
                    JSON.stringify({
                        title,
                        contentJson,
                        tags: selectedTags,
                        isHelpWanted,
                        updatedAt: Date.now(),
                    })
                );
            } catch (e) {
                console.error("Failed to save draft:", e);
            }
        }, 1000);

        return () => clearTimeout(timer);
    }, [title, contentJson, selectedTags, isHelpWanted]);

    const handleClearDraft = () => {
        if (confirm("确定要清空当前草稿内容吗？")) {
            localStorage.removeItem(DRAFT_STORAGE_KEY);
            setTitle("");
            setContent("");
            setContentJson(undefined);
            setSelectedTags([]);
            setIsHelpWanted(false);
            setHasRestoredDraft(false);
            toast.success("草稿已清空");
        }
    };

    const handleTagToggle = (tag: string) => {
        if (selectedTags.includes(tag)) {
            setSelectedTags(selectedTags.filter((t) => t !== tag));
        } else if (selectedTags.length < 3) {
            setSelectedTags([...selectedTags, tag]);
        } else {
            toast.error("最多只能选择 3 个标签");
        }
    };

    const handleSubmit = async () => {
        if (!title.trim()) {
            toast.error("请输入标题");
            return;
        }

        if (!content.trim() || content === "<p></p>") {
            toast.error("请输入内容");
            return;
        }

        if (selectedTags.length === 0) {
            toast.error("请至少选择一个标签");
            return;
        }

        if (!contentJson) {
            toast.error("内容格式错误");
            return;
        }

        setIsSubmitting(true);

        try {
            // Deep copy to ensure no socialization issues with Server Actions
            const cleanedContent = JSON.parse(JSON.stringify(contentJson));

            const result = await createPost({
                title: title.trim(),
                content: cleanedContent,
                tags: selectedTags,
                is_help_wanted: isHelpWanted,
            });

            if (result.error) {
                toast.error(result.error);
                return;
            }

            // 发帖成功，清除本地草稿
            try {
                localStorage.removeItem(DRAFT_STORAGE_KEY);
            } catch (e) {
                console.error("Clear draft error:", e);
            }

            // 同步帖子的专栏归属
            if (result.data?.id && selectedCollectionIds.length > 0) {
                await syncPostCollections(result.data.id, selectedCollectionIds).catch((err) => {
                    console.error("Sync post collections error:", err);
                });
            }

            if (result.reviewStatus === "pending") {
                toast.warning("帖子已提交！由于包含学术敏感探讨，已进入人工审核队列，审核通过后将对全站公开展示。", {
                    duration: 5000,
                });
            } else {
                toast.success("发布成功！");
            }

            router.push(`/posts/${result.data?.id}`);
        } catch (error) {
            toast.error("发布失败，请重试");
            console.error("Submit error:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <motion.div
            variants={pageVariants}
            initial="hidden"
            animate="visible"
            className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20"
        >
            {/* 顶部导航 */}
            <motion.header
                variants={itemVariants}
                className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50"
            >
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center gap-4">
                            <Link href="/dashboard">
                                <Button variant="ghost" size="sm" className="gap-2">
                                    <ArrowLeft className="h-4 w-4" />
                                    返回
                                </Button>
                            </Link>
                            <h1 className="text-lg font-semibold text-foreground">发布新帖子</h1>
                        </div>

                        <div className="flex items-center gap-2">
                            <Button
                                variant={isHelpWanted ? "default" : "outline"}
                                size="sm"
                                onClick={() => setIsHelpWanted(!isHelpWanted)}
                                className={`gap-2 ${isHelpWanted ? "bg-amber-500 hover:bg-amber-600 text-white border-transparent" : "text-muted-foreground"}`}
                            >
                                <HelpCircle className="h-4 w-4" />
                                {isHelpWanted ? "高亮求助" : "设为求助"}
                            </Button>

                            <Button
                                onClick={handleSubmit}
                                disabled={isSubmitting}
                                className="gap-2"
                            >
                                {isSubmitting ? (
                                    <>
                                        <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                        发布中...
                                    </>
                                ) : (
                                    <>
                                        <Send className="h-4 w-4" />
                                        发布
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            </motion.header>

            {/* 主内容 */}
            <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="space-y-8">
                    {/* 标题输入 */}
                    <motion.div variants={itemVariants} className="space-y-2">
                        <Label htmlFor="title" className="text-sm font-medium">
                            标题 <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            id="title"
                            placeholder="输入一个吸引人的标题..."
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="text-lg h-12"
                            maxLength={100}
                        />
                        <p className="text-xs text-muted-foreground text-right">
                            {title.length}/100
                        </p>
                    </motion.div>

                    {/* 标签选择 */}
                    <motion.div variants={itemVariants} className="space-y-3">
                        <Label className="text-sm font-medium">
                            标签 <span className="text-destructive">*</span>
                            <span className="text-muted-foreground font-normal ml-2">
                                (选择 1-3 个)
                            </span>
                        </Label>

                        {/* 已选标签 */}
                        {selectedTags.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-2">
                                {selectedTags.map((tag) => (
                                    <Badge
                                        key={tag}
                                        variant="default"
                                        className="gap-1 pr-1 cursor-pointer"
                                        onClick={() => handleTagToggle(tag)}
                                    >
                                        {tag}
                                        <X className="h-3 w-3" />
                                    </Badge>
                                ))}
                            </div>
                        )}

                        {/* 可选标签 */}
                        <div className="flex flex-wrap gap-2">
                            {AVAILABLE_TAGS.filter((tag) => !selectedTags.includes(tag)).map(
                                (tag) => (
                                    <Badge
                                        key={tag}
                                        variant="outline"
                                        className="cursor-pointer hover:bg-primary/10 transition-colors"
                                        onClick={() => handleTagToggle(tag)}
                                    >
                                        <Plus className="h-3 w-3 mr-1" />
                                        {tag}
                                    </Badge>
                                )
                            )}
                        </div>
                    </motion.div>

                    {/* 专栏选择（可选） */}
                    <motion.div variants={itemVariants} className="space-y-3">
                        <div className="flex items-center justify-between">
                            <Label className="text-sm font-medium flex items-center gap-1.5">
                                <BookOpen className="h-4 w-4 text-primary" />
                                归入专栏
                                <span className="text-muted-foreground font-normal text-xs ml-1">
                                    （作者专栏，可选）
                                </span>
                            </Label>
                            <div className="flex items-center gap-3">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setIsCreateCollectionOpen(true)}
                                    className="h-7 text-xs text-primary hover:text-primary hover:bg-primary/10 gap-1 px-2"
                                >
                                    <Plus className="h-3 w-3" />
                                    新建专栏
                                </Button>
                                {myCollections.length > 0 && (
                                    <Link
                                        href="/collections/manage"
                                        target="_blank"
                                        className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                                    >
                                        管理专栏
                                    </Link>
                                )}
                            </div>
                        </div>

                        {myCollections.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {myCollections.map((col) => {
                                    const isSelected = selectedCollectionIds.includes(col.id);
                                    return (
                                        <label
                                            key={col.id}
                                            className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                                                isSelected
                                                    ? "border-primary bg-primary/5 shadow-sm ring-1 ring-primary/20"
                                                    : "border-border/60 hover:border-border hover:bg-muted/40"
                                            }`}
                                        >
                                            <Checkbox
                                                checked={isSelected}
                                                onCheckedChange={(checked) => {
                                                    setSelectedCollectionIds(
                                                        checked
                                                            ? [...selectedCollectionIds, col.id]
                                                            : selectedCollectionIds.filter((id) => id !== col.id)
                                                    );
                                                }}
                                            />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium truncate text-foreground">{col.name}</p>
                                                <p className="text-xs text-muted-foreground">{col.post_count ?? 0} 篇文章</p>
                                            </div>
                                        </label>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="flex items-center justify-between p-3.5 rounded-lg border border-dashed border-border/80 bg-muted/20">
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Sparkles className="h-4 w-4 text-amber-500/80" />
                                    <span>暂未创建任何专栏，可将文章系列化整理归类</span>
                                </div>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setIsCreateCollectionOpen(true)}
                                    className="h-8 gap-1.5 text-xs font-medium"
                                >
                                    <Plus className="h-3.5 w-3.5" />
                                    立即创建专栏
                                </Button>
                            </div>
                        )}
                    </motion.div>

                    {/* 内容编辑器 */}
                    <motion.div variants={itemVariants} className="space-y-3">
                        <div className="flex items-center justify-between">
                            <Label className="text-sm font-medium">
                                内容 <span className="text-destructive">*</span>
                            </Label>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <kbd className="px-1.5 py-0.5 bg-muted rounded border border-border font-mono">/</kbd>
                                <span>唤起命令菜单</span>
                            </div>
                        </div>
                        <div className="relative group">
                            {/* 渐变边框效果 */}
                            <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/50 via-primary/25 to-primary/50 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm" />
                            <div className="relative min-h-[500px] bg-background rounded-lg border border-border/50 shadow-lg flex flex-col">
                                {/* 顶部装饰条 */}
                                <div className="h-10 bg-muted/30 border-b border-border/50 flex items-center px-4 gap-2">
                                    <div className="flex gap-1.5">
                                        <div className="w-3 h-3 rounded-full bg-red-500/80" />
                                        <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                                        <div className="w-3 h-3 rounded-full bg-green-500/80" />
                                    </div>
                                    <span className="text-xs text-muted-foreground ml-2">富文本编辑器</span>
                                </div>
                                <NovelEditor
                                    initialValue={contentJson}
                                    onChange={(json) => {
                                        setContentJson(json);
                                        // Simple validation for "empty" content
                                        // Check if there is at least one node with content
                                        const hasContent = json?.content?.some((node: any) =>
                                            node.content?.length > 0 || (node.type === 'image') || (node.type === 'codeBlock')
                                        );
                                        setContent(hasContent ? "valid" : "");
                                    }}
                                />
                            </div>
                        </div>
                    </motion.div>

                    {/* AI 同行评审面板 */}
                    <AnimatePresence>
                        {title.trim() && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ duration: 0.3 }}
                            >
                                <PeerReviewPanel
                                    content={contentJson}
                                    title={title}
                                    tags={selectedTags}
                                    isAuthor={true}
                                />
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* 提示信息 */}
                    <motion.div
                        variants={itemVariants}
                        className="bg-muted/50 rounded-lg p-4 border border-border/50"
                    >
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-sm font-medium text-foreground">发布提示与社区规范</h3>
                            <Link href="/rules" target="_blank" className="text-xs text-primary hover:underline">
                                查看社区公约 ↗
                            </Link>
                        </div>
                        <ul className="text-sm text-muted-foreground space-y-1.5">
                            <li>• 请确保内容符合学术规范，尊重他人知识产权</li>
                            <li>• <strong>图片内容责任</strong>：<strong className="text-foreground">用户上传的图片需由本人承担全部内容与版权法律责任</strong>，严禁上传侵权或违规图片</li>
                            <li>• <strong>数学公式</strong>：输入 LaTeX 文本后，选中并点击工具栏 <span className="font-mono bg-muted px-1 rounded">Σ</span> 按钮渲染</li>
                            <li>• <strong>代码块</strong>：输入 <span className="font-mono bg-muted px-1 rounded">/代码块</span> 插入，支持语法高亮</li>
                            <li>• <strong>图片上传</strong>：输入 <span className="font-mono bg-muted px-1 rounded">/上传图片</span> 或直接粘贴/拖放（限制 2MB，支持 JPEG、PNG、GIF、WebP）</li>
                        </ul>
                    </motion.div>
                </div>
            </main>

            {/* 新建专栏弹窗 */}
            <CreateCollectionDialog
                open={isCreateCollectionOpen}
                onOpenChange={setIsCreateCollectionOpen}
                onSuccess={async (newCol) => {
                    await loadCollectionsData();
                    if (newCol?.id) {
                        setSelectedCollectionIds((prev) => Array.from(new Set([...prev, newCol.id])));
                    }
                }}
            />
        </motion.div>
    );
}
