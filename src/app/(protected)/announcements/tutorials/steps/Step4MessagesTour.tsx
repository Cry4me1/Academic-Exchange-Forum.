"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    MessageSquare,
    Search,
    Send,
    Paperclip,
    Smile,
    Type,
    Clock,
    FileCode,
    Lock,
    ArrowLeft,
    ArrowRight,
    CheckCircle2,
    Shield,
} from "lucide-react";
import { toast } from "sonner";
import { TutorialTaskChecklist, TaskItem } from "@/components/tutorials/TutorialTaskChecklist";

interface Step4MessagesTourProps {
    onPrev: () => void;
    onNext: () => void;
}

interface MessageItem {
    id: string;
    sender: "other" | "me";
    text: string;
    hasFile?: boolean;
    fileName?: string;
    fileSize?: string;
    createdAt: string;
}

const initialTasks: TaskItem[] = [
    {
        id: "switch-chat",
        title: "1. 在左侧会话列表中切换联系人",
        description: "点击左侧联系人列表中的‘李院士’或‘张教授’，切换与不同同行学者的实时对话窗口。",
        isCompleted: false,
    },
    {
        id: "send-message",
        title: "2. 发送一条学术研讨文字消息",
        description: "在右侧真实聊天输入框中输入内容并点击发送，体验即时通讯与文字永久加密留存。",
        isCompleted: false,
    },
    {
        id: "inspect-7day-file",
        title: "3. 查看附件 7 天自动销毁机制",
        description: "查阅聊天记录中大文件附件的‘剩余 6 天 22 小时自动清理’倒计时标签与数据安全保护规则。",
        isCompleted: false,
    },
];

const mockContacts = [
    {
        id: "c1",
        name: "李院士",
        title: "拓扑量子物理学者",
        avatar: "李",
        isOnline: true,
        lastMessage: "拓扑相变原始仿真数据包已上传，请查收...",
        time: "14:32",
        unread: 1,
    },
    {
        id: "c2",
        name: "张教授",
        title: "分布式共识系统研究员",
        avatar: "张",
        isOnline: false,
        lastMessage: "关于 Raft 协议在跨地域网络中的延迟推演...",
        time: "昨天",
        unread: 0,
    },
    {
        id: "c3",
        name: "王研究员",
        title: "AI 多模态审校组",
        avatar: "王",
        isOnline: true,
        lastMessage: "您的论文复核已通过，详见 Peer Review...",
        time: "周三",
        unread: 0,
    },
];

export function Step4MessagesTour({ onPrev, onNext }: Step4MessagesTourProps) {
    const [tasks, setTasks] = useState<TaskItem[]>(initialTasks);
    const [selectedContactId, setSelectedContactId] = useState("c1");
    const [inputText, setInputText] = useState("");
    const [messages, setMessages] = useState<MessageItem[]>([
        {
            id: "m1",
            sender: "other",
            text: "您好！附录中的拓扑超导相变原始仿真数据已生成完毕，已打包上传在下方。请注意在 7 天有效期内下载备份。",
            hasFile: true,
            fileName: "quantum_topological_simulation.h5",
            fileSize: "18.4 MB",
            createdAt: "14:30",
        },
        {
            id: "m2",
            sender: "me",
            text: "收到，十分感谢李院士！我正在使用站内的 Nature 双栏阅读器做要素对比分析。",
            createdAt: "14:32",
        },
    ]);

    const currentContact = mockContacts.find((c) => c.id === selectedContactId) || mockContacts[0];

    const markTaskDone = (id: string) => {
        setTasks((prev) =>
            prev.map((t) => (t.id === id ? { ...t, isCompleted: true } : t))
        );
    };

    const handleSelectContact = (id: string) => {
        setSelectedContactId(id);
        markTaskDone("switch-chat");
    };

    const handleSendMessage = () => {
        if (!inputText.trim()) {
            toast.error("请输入研讨消息内容");
            return;
        }

        const newMsg: MessageItem = {
            id: `msg-${Date.now()}`,
            sender: "me",
            text: inputText,
            createdAt: "刚刚",
        };

        setMessages((prev) => [...prev, newMsg]);
        setInputText("");
        markTaskDone("send-message");
        markTaskDone("inspect-7day-file");
        toast.success("消息已加密发送并永久留存于 Scholarly 知识库");
    };

    return (
        <div className="space-y-6">
            {/* 顶栏实操任务清单卡片 */}
            <TutorialTaskChecklist
                tasks={tasks}
                stepTitle="Step 4 · 真实私信聊天 (Messages) 与 7 天数据时效"
                stepBadge="3 大实操子任务"
                hintText="本界面 1:1 采用平台正式私信聊天系统 (ChatList + ChatWindow) 架构，支持即时打字互动。"
            />

            {/* 1:1 真实私聊双栏全景容器 */}
            <div className="rounded-3xl border border-border/80 bg-card/90 backdrop-blur-2xl shadow-xl overflow-hidden">
                <div className="grid grid-cols-1 md:grid-cols-12 h-[520px]">
                    {/* 左侧：真实 ChatList 会话列表 (4 列) */}
                    <div className="md:col-span-4 border-r border-border/50 flex flex-col bg-muted/20">
                        {/* 搜索栏 */}
                        <div className="p-3.5 border-b border-border/40">
                            <div className="relative">
                                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                                <Input
                                    placeholder="搜索联系人与学术研讨..."
                                    className="h-8 pl-8 text-xs bg-background/80 rounded-xl"
                                />
                            </div>
                        </div>

                        {/* 联系人列表 */}
                        <div className="flex-1 overflow-y-auto p-2 space-y-1">
                            {mockContacts.map((contact) => {
                                const isSelected = selectedContactId === contact.id;

                                return (
                                    <button
                                        key={contact.id}
                                        type="button"
                                        onClick={() => handleSelectContact(contact.id)}
                                        className={`w-full flex items-start gap-3 p-2.5 rounded-2xl text-left transition-all ${
                                            isSelected
                                                ? "bg-primary/10 text-primary font-semibold shadow-xs"
                                                : "hover:bg-muted/60 text-foreground/80"
                                        }`}
                                    >
                                        <div className="relative shrink-0">
                                            <Avatar className="h-10 w-10 border border-border">
                                                <AvatarFallback className="bg-primary/15 text-primary font-bold text-xs">
                                                    {contact.avatar}
                                                </AvatarFallback>
                                            </Avatar>
                                            {/* 在线绿点 */}
                                            {contact.isOnline ? (
                                                <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-emerald-500 border-2 border-background" />
                                            ) : (
                                                <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-muted-foreground/40 border-2 border-background" />
                                            )}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between">
                                                <h4 className="text-xs font-bold truncate text-foreground">
                                                    {contact.name}
                                                </h4>
                                                <span className="text-[10px] text-muted-foreground">
                                                    {contact.time}
                                                </span>
                                            </div>
                                            <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                                                {contact.lastMessage}
                                            </p>
                                        </div>

                                        {contact.unread > 0 && (
                                            <div className="h-4 w-4 rounded-full bg-primary text-white text-[9px] font-bold flex items-center justify-center shrink-0 mt-1">
                                                {contact.unread}
                                            </div>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* 右侧：真实 ChatWindow 聊天窗口 (8 列) */}
                    <div className="md:col-span-8 flex flex-col bg-background/60">
                        {/* 顶栏 Header */}
                        <div className="px-5 py-3.5 border-b border-border/40 flex items-center justify-between bg-card/40">
                            <div className="flex items-center gap-3">
                                <div className="relative">
                                    <Avatar className="h-9 w-9 border border-border">
                                        <AvatarFallback className="bg-primary/20 text-primary font-bold text-xs">
                                            {currentContact.avatar}
                                        </AvatarFallback>
                                    </Avatar>
                                    {currentContact.isOnline && (
                                        <div className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 border-2 border-background" />
                                    )}
                                </div>
                                <div>
                                    <h4 className="text-xs font-bold text-foreground flex items-center gap-2">
                                        {currentContact.name}
                                        <Badge variant="outline" className="text-[9px] py-0 px-1.5 border-border/60">
                                            {currentContact.title}
                                        </Badge>
                                    </h4>
                                    <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                                        {currentContact.isOnline ? "🟢 正在学术在线" : "⚪ 离线"}
                                    </p>
                                </div>
                            </div>

                            <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30 text-[10px] gap-1">
                                <Lock className="h-3 w-3" />
                                端到端加密存档
                            </Badge>
                        </div>

                        {/* 消息气泡流 */}
                        <div className="flex-1 p-4 overflow-y-auto space-y-4">
                            {messages.map((msg) => (
                                <div
                                    key={msg.id}
                                    className={`flex flex-col gap-1 ${
                                        msg.sender === "me" ? "items-end" : "items-start"
                                    }`}
                                >
                                    <div
                                        className={`max-w-md p-3.5 rounded-2xl text-xs leading-relaxed space-y-2 shadow-xs ${
                                            msg.sender === "me"
                                                ? "bg-gradient-to-r from-primary to-violet-600 text-white rounded-br-xs"
                                                : "bg-muted/70 text-foreground rounded-bl-xs border border-border/50"
                                        }`}
                                    >
                                        <p>{msg.text}</p>

                                        {/* 真实大文件附件预览卡片 + 7 天销毁倒计时 */}
                                        {msg.hasFile && (
                                            <div
                                                onClick={() => markTaskDone("inspect-7day-file")}
                                                className="p-2.5 rounded-xl bg-background/95 text-foreground border border-border/60 flex items-center justify-between gap-3 shadow-xs cursor-pointer hover:border-amber-500/50 transition-colors"
                                            >
                                                <div className="flex items-center gap-2 min-w-0">
                                                    <FileCode className="h-5 w-5 text-primary shrink-0" />
                                                    <div className="min-w-0">
                                                        <p className="font-mono text-xs font-bold truncate">
                                                            {msg.fileName}
                                                        </p>
                                                        <span className="text-[10px] text-muted-foreground">
                                                            {msg.fileSize}
                                                        </span>
                                                    </div>
                                                </div>

                                                <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/30 text-[10px] gap-1 shrink-0">
                                                    <Clock className="h-3 w-3" />
                                                    剩余 6 天 22 小时销毁
                                                </Badge>
                                            </div>
                                        )}
                                    </div>

                                    <span className="text-[10px] text-muted-foreground px-1">
                                        {msg.createdAt}
                                    </span>
                                </div>
                            ))}
                        </div>

                        {/* 底部真实输入栏 */}
                        <div className="p-3 border-t border-border/40 bg-card/40 space-y-2">
                            <div className="flex items-center gap-2">
                                <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground">
                                    <Paperclip className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground">
                                    <Smile className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground">
                                    <Type className="h-4 w-4" />
                                </Button>

                                <Input
                                    value={inputText}
                                    onChange={(e) => setInputText(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") handleSendMessage();
                                    }}
                                    placeholder="输入学术研讨内容，按 Enter 键发送..."
                                    className="flex-1 h-9 text-xs bg-background/90 rounded-xl"
                                />

                                <Button
                                    size="sm"
                                    onClick={handleSendMessage}
                                    className="h-9 px-4 rounded-xl bg-gradient-to-r from-primary to-violet-600 text-white gap-1 shadow-sm shrink-0"
                                >
                                    <Send className="h-3.5 w-3.5" />
                                    发送
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 底部导航操作条 */}
            <div className="flex items-center justify-between pt-2">
                <Button
                    variant="ghost"
                    size="lg"
                    onClick={onPrev}
                    className="h-11 px-5 rounded-2xl text-muted-foreground hover:text-foreground gap-2 cursor-pointer"
                >
                    <ArrowLeft className="h-4 w-4" />
                    上一步：学术决斗场
                </Button>

                <Button
                    size="lg"
                    onClick={onNext}
                    className="h-11 px-6 rounded-2xl bg-gradient-to-r from-primary to-violet-600 text-white font-bold shadow-lg shadow-primary/25 gap-2 hover:opacity-95 cursor-pointer"
                >
                    下一步：积分流转与学者特权
                    <ArrowRight className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}
