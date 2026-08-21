"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { usePresenceContext } from "@/contexts/PresenceContext";
import { useMessages } from "@/hooks/useMessages";
import { ALLOWED_FILE_TYPES, MAX_FILE_SIZE, formatFileSize } from "@/lib/file-utils";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import {
    ArrowLeft,
    Link as LinkIcon,
    Loader2,
    MessageSquare,
    MoreVertical,
    Paperclip,
    Send,
    Smile,
    Type,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { ChatMessages } from "./ChatBubble";
import { ChatEditor, type ChatEditorRef } from "./ChatEditor";
import { uploadMessageFile } from "./FileUploader";

interface ChatWindowProps {
    currentUserId: string;
    partnerId: string;
    partnerName: string;
    partnerEmail: string;
    partnerAvatar?: string | null;
    currentUserName?: string;
    currentUserAvatar?: string | null;
    onBack?: () => void;
    className?: string;
}

export function ChatWindow({
    currentUserId,
    partnerId,
    partnerName,
    partnerEmail,
    partnerAvatar,
    currentUserName,
    currentUserAvatar,
    onBack,
    className,
}: ChatWindowProps) {
    const [inputValue, setInputValue] = useState("");
    const [richContent, setRichContent] = useState("");
    const [sending, setSending] = useState(false);
    const [showPostSelector, setShowPostSelector] = useState(false);
    const [useRichEditor, setUseRichEditor] = useState(false);
    const [pendingFiles, setPendingFiles] = useState<File[]>([]);
    const editorRef = useRef<ChatEditorRef>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const { messages, loading, sendMessage, markAsRead, revokeMessage, canRevoke } = useMessages(
        currentUserId,
        partnerId
    );
    const { isOnline } = usePresenceContext();

    const isPartnerOnline = isOnline(partnerId);
    const partnerInitials = (partnerName || partnerEmail || "?").charAt(0).toUpperCase();

    // 标记消息为已读
    const handleMarkAsRead = useCallback(() => {
        const unreadMessages = messages
            .filter((m) => m.receiver_id === currentUserId && !m.is_read)
            .map((m) => m.id);
        if (unreadMessages.length > 0) {
            markAsRead(unreadMessages);
        }
    }, [messages, currentUserId, markAsRead]);

    // 发送消息（支持富文本和附件）
    const handleSend = async () => {
        let content = useRichEditor ? richContent : inputValue.trim();

        // 如果内容为空但有文件，设置默认提示文本
        if ((!content || content === "<p></p>") && pendingFiles.length > 0) {
            const isAllImages = pendingFiles.every(f => f.type?.startsWith("image/"));
            content = isAllImages ? "[图片]" : "[文件]";
        }

        if ((!content || content === "<p></p>") && pendingFiles.length === 0) return;

        if (sending) return;

        setSending(true);

        try {
            // 发送文本消息
            const contentType = useRichEditor ? "rich_text" : "text";
            const result = await sendMessage(partnerId, content, contentType);

            if (!result.success) {
                toast.error(result.error || "发送失败");
                setSending(false);
                return;
            }

            // 如果有待上传的文件，上传附件
            if (pendingFiles.length > 0 && result.messageId) {
                for (const file of pendingFiles) {
                    try {
                        await uploadMessageFile(file, result.messageId);
                    } catch (error) {
                        console.error("文件上传失败:", error);
                        toast.error(`${file.name} 上传失败`);
                    }
                }
            }

            // 清空输入
            if (useRichEditor) {
                editorRef.current?.clear();
                setRichContent("");
            } else {
                setInputValue("");
                inputRef.current?.focus();
            }
            setPendingFiles([]);
        } catch (error) {
            toast.error("发送失败");
        } finally {
            setSending(false);
        }
    };

    // 发送帖子引用
    const handleSharePost = async (postId: string, postTitle: string) => {
        setSending(true);
        const result = await sendMessage(
            partnerId,
            `分享了帖子：${postTitle}`,
            "post_reference",
            postId
        );
        setSending(false);
        setShowPostSelector(false);

        if (result.success) {
            toast.success("帖子已分享");
        } else {
            toast.error(result.error || "分享失败");
        }
    };

    // 处理文件选择
    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;

        const validFiles: File[] = [];
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            if (file.size > MAX_FILE_SIZE) {
                toast.error(`${file.name} 超过 10MB 限制`);
                continue;
            }
            if (!ALLOWED_FILE_TYPES.includes(file.type)) {
                toast.error(`${file.name} 不支持的文件类型`);
                continue;
            }
            validFiles.push(file);
        }

        setPendingFiles((prev) => [...prev, ...validFiles]);
        e.target.value = ""; // 重置 input
    };

    // 移除待上传文件
    const removePendingFile = (index: number) => {
        setPendingFiles((prev) => prev.filter((_, i) => i !== index));
    };

    return (
        <div className={cn("flex flex-col h-full bg-background", className)}>
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3 border-b bg-card/50">
                {onBack && (
                    <Button variant="ghost" size="icon" onClick={onBack} className="md:hidden">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                )}

                <Avatar className="h-10 w-10 border-2 border-background shadow-sm">
                    <AvatarImage src={partnerAvatar || undefined} />
                    <AvatarFallback className="bg-gradient-to-br from-primary/30 to-primary/10 text-primary font-semibold">
                        {partnerInitials}
                    </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground truncate">{partnerName}</p>
                    <div className="flex items-center gap-1.5">
                        <span
                            className={cn(
                                "h-2 w-2 rounded-full",
                                isPartnerOnline
                                    ? "bg-green-500 animate-pulse"
                                    : "bg-gray-400"
                            )}
                        />
                        <span className="text-xs text-muted-foreground">
                            {isPartnerOnline ? "在线" : "离线"}
                        </span>
                    </div>
                </div>

                <Button variant="ghost" size="icon">
                    <MoreVertical className="h-5 w-5" />
                </Button>
            </div>

            {/* Messages */}
            {loading ? (
                <div className="flex-1 flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            ) : (
                <ChatMessages
                    messages={messages}
                    currentUserId={currentUserId}
                    partnerName={partnerName}
                    partnerAvatar={partnerAvatar}
                    currentUserName={currentUserName}
                    currentUserAvatar={currentUserAvatar}
                    canRevoke={canRevoke}
                    onRevoke={revokeMessage}
                />
            )}

            {/* 待上传文件预览 */}
            {pendingFiles.length > 0 && (
                <div className="px-4 py-2 border-t bg-muted/30">
                    <div className="flex flex-wrap gap-2">
                        {pendingFiles.map((file, index) => (
                            <div
                                key={index}
                                className="flex items-center gap-2 px-3 py-1.5 bg-card rounded-lg border"
                            >
                                <Paperclip className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm truncate max-w-[120px]">{file.name}</span>
                                <span className="text-xs text-muted-foreground">
                                    {formatFileSize(file.size)}
                                </span>
                                <button
                                    onClick={() => removePendingFile(index)}
                                    className="ml-1 text-muted-foreground hover:text-destructive"
                                >
                                    ×
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Input Area */}
            <div className="border-t bg-card/50 p-3">
                {useRichEditor ? (
                    // 富文本编辑器模式
                    <div className="space-y-2">
                        <ChatEditor
                            ref={editorRef}
                            onChange={(html) => setRichContent(html)}
                            onSubmit={handleSend}
                            placeholder="输入消息... 支持 Markdown 格式"
                        />
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1">
                                {/* 切换到普通模式 */}
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setUseRichEditor(false)}
                                    className="text-xs"
                                >
                                    <MessageSquare className="h-4 w-4 mr-1" />
                                    简单模式
                                </Button>

                                {/* 文件上传 */}
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    multiple
                                    className="hidden"
                                    accept={ALLOWED_FILE_TYPES.join(",")}
                                    onChange={handleFileSelect}
                                />
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <Paperclip className="h-4 w-4 mr-1" />
                                    附件
                                </Button>

                                {/* 分享帖子 */}
                                <Dialog open={showPostSelector} onOpenChange={setShowPostSelector}>
                                    <DialogTrigger asChild>
                                        <Button variant="ghost" size="sm">
                                            <LinkIcon className="h-4 w-4 mr-1" />
                                            分享帖子
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent aria-describedby={undefined}>
                                        <DialogHeader>
                                            <DialogTitle>分享帖子</DialogTitle>
                                        </DialogHeader>
                                        <PostSelector onSelect={handleSharePost} />
                                    </DialogContent>
                                </Dialog>
                            </div>

                            <Button
                                onClick={handleSend}
                                disabled={(!richContent || richContent === "<p></p>") && pendingFiles.length === 0 || sending}
                                size="sm"
                            >
                                {sending ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <>
                                        <Send className="h-4 w-4 mr-1" />
                                        发送
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                ) : (
                    // 简单输入模式
                    <div className="flex items-center gap-2">
                        {/* 表情按钮 */}
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="ghost" size="icon" className="flex-shrink-0">
                                    <Smile className="h-5 w-5 text-muted-foreground" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <EmojiPicker
                                    onSelect={(emoji) => {
                                        setInputValue((prev) => prev + emoji);
                                        inputRef.current?.focus();
                                    }}
                                />
                            </PopoverContent>
                        </Popover>

                        {/* 附件按钮 */}
                        <input
                            ref={fileInputRef}
                            type="file"
                            multiple
                            className="hidden"
                            accept={ALLOWED_FILE_TYPES.join(",")}
                            onChange={handleFileSelect}
                        />
                        <Button
                            variant="ghost"
                            size="icon"
                            className="flex-shrink-0"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <Paperclip className="h-5 w-5 text-muted-foreground" />
                        </Button>

                        {/* 分享帖子 */}
                        <Dialog open={showPostSelector} onOpenChange={setShowPostSelector}>
                            <DialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="flex-shrink-0">
                                    <LinkIcon className="h-5 w-5 text-muted-foreground" />
                                </Button>
                            </DialogTrigger>
                            <DialogContent aria-describedby={undefined}>
                                <DialogHeader>
                                    <DialogTitle>分享帖子</DialogTitle>
                                </DialogHeader>
                                <PostSelector onSelect={handleSharePost} />
                            </DialogContent>
                        </Dialog>

                        {/* 切换富文本模式 */}
                        <Button
                            variant="ghost"
                            size="icon"
                            className="flex-shrink-0"
                            onClick={() => setUseRichEditor(true)}
                            title="富文本模式"
                        >
                            <Type className="h-5 w-5 text-muted-foreground" />
                        </Button>

                        {/* 输入框 */}
                        <Input
                            ref={inputRef}
                            placeholder="输入消息..."
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSend();
                                }
                            }}
                            onFocus={handleMarkAsRead}
                            className="flex-1"
                        />

                        {/* 发送按钮 */}
                        <Button
                            onClick={handleSend}
                            disabled={(!inputValue.trim() && pendingFiles.length === 0) || sending}
                            size="icon"
                            className="flex-shrink-0"
                        >
                            {sending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Send className="h-4 w-4" />
                            )}
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}

// 帖子选择器（用于分享帖子）
function PostSelector({
    onSelect,
}: {
    onSelect: (postId: string, postTitle: string) => void;
}) {
    const [posts, setPosts] = useState<{ id: string; title: string }[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        const fetchPosts = async () => {
            setLoading(true);
            const supabase = createClient();
            const { data } = await supabase
                .from("posts")
                .select("id, title")
                .eq("is_published", true)
                .order("created_at", { ascending: false })
                .limit(20);

            setPosts(data || []);
            setLoading(false);
        };
        fetchPosts();
    }, []);

    const filteredPosts = posts.filter((post) =>
        post.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="space-y-3">
            <Input
                placeholder="搜索帖子..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
            />
            <ScrollArea className="max-h-[300px]">
                <div className="space-y-2">
                    {filteredPosts.length > 0 ? (
                        filteredPosts.map((post) => (
                            <div
                                key={post.id}
                                onClick={() => onSelect(post.id, post.title)}
                                className="p-3 rounded-lg hover:bg-muted cursor-pointer transition-colors"
                            >
                                <p className="font-medium text-sm line-clamp-2">{post.title}</p>
                            </div>
                        ))
                    ) : (
                        <p className="text-center text-sm text-muted-foreground py-4">
                            暂无帖子
                        </p>
                    )}
                </div>
            </ScrollArea>
        </div>
    );
}

// 表情选择器
const EMOJI_LIST = [
    "😀", "😃", "😄", "😁", "😆", "😅", "🤣", "😂",
    "🙂", "🙃", "😉", "😊", "😇", "🥰", "😍", "🤩",
    "😘", "😗", "😚", "😙", "🥲", "😋", "😛", "😜",
    "👍", "👎", "👏", "🙌", "🤝", "🙏", "✨", "🔥",
    "💯", "❤️", "🧡", "💛", "💚", "💙", "💜", "🖤",
];

function EmojiPicker({
    onSelect,
}: {
    onSelect: (emoji: string) => void;
}) {
    return (
        <div className="grid grid-cols-8 gap-1 p-2">
            {EMOJI_LIST.map((emoji) => (
                <button
                    key={emoji}
                    onClick={() => onSelect(emoji)}
                    className="h-8 w-8 flex items-center justify-center text-lg hover:bg-muted rounded transition-colors"
                >
                    {emoji}
                </button>
            ))}
        </div>
    );
}
