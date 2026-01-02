"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Send,
    Paperclip,
    Smile,
    MoreVertical,
    ArrowLeft,
    Link as LinkIcon,
    Loader2,
} from "lucide-react";
import { ChatMessages } from "./ChatBubble";
import { useMessages } from "@/hooks/useMessages";
import { usePresence } from "@/hooks/usePresence";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

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
    const [sending, setSending] = useState(false);
    const [showPostSelector, setShowPostSelector] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const { messages, loading, sendMessage, markAsRead } = useMessages(
        currentUserId,
        partnerId
    );
    const { isOnline } = usePresence(currentUserId);

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

    // 发送消息
    const handleSend = async () => {
        if (!inputValue.trim() || sending) return;

        setSending(true);
        const result = await sendMessage(partnerId, inputValue.trim());
        setSending(false);

        if (result.success) {
            setInputValue("");
            inputRef.current?.focus();
        } else {
            toast.error(result.error || "发送失败");
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
                />
            )}

            {/* Input Area */}
            <div className="border-t bg-card/50 p-3">
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

                    {/* 附件/分享帖子 */}
                    <Dialog open={showPostSelector} onOpenChange={setShowPostSelector}>
                        <DialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="flex-shrink-0">
                                <LinkIcon className="h-5 w-5 text-muted-foreground" />
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>分享帖子</DialogTitle>
                            </DialogHeader>
                            <PostSelector onSelect={handleSharePost} />
                        </DialogContent>
                    </Dialog>

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
                        disabled={!inputValue.trim() || sending}
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

