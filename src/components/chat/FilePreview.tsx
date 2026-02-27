"use client";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    formatFileSize,
    getFileCategory,
    getRemainingTime,
    isFileExpired,
    isImage,
    isVideo,
    type MessageAttachment,
} from "@/lib/file-utils";
import { cn } from "@/lib/utils";
import {
    AlertCircle,
    Archive,
    Code,
    Download,
    ExternalLink,
    File,
    FileText,
    Image as ImageIcon,
    Play,
    Video,
    X,
} from "lucide-react";
import { useState } from "react";

interface FilePreviewProps {
    attachment: MessageAttachment;
    className?: string;
}

// 文件类型图标映射
const FileIconMap: Record<string, React.ComponentType<{ className?: string }>> = {
    image: ImageIcon,
    video: Video,
    document: FileText,
    archive: Archive,
    code: Code,
    other: File,
};

export function FilePreview({ attachment, className }: FilePreviewProps) {
    const [showPreview, setShowPreview] = useState(false);
    const [imageError, setImageError] = useState(false);

    const category = getFileCategory(attachment.fileType);
    const IconComponent = FileIconMap[category] || File;
    const expired = attachment.isExpired || isFileExpired(attachment.expiresAt);

    // 处理文件下载
    // 处理文件下载
    const handleDownload = () => {
        if (expired) return;

        // 使用代理接口下载，解决 CORS 问题
        const downloadUrl = `/api/messages/download?attachmentId=${attachment.id}`;

        const a = document.createElement("a");
        a.href = downloadUrl;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    // 过期文件显示
    if (expired) {
        return (
            <div
                className={cn(
                    "flex items-center gap-2 p-3 rounded-lg bg-muted/50 border border-dashed border-muted-foreground/30",
                    className
                )}
            >
                <AlertCircle className="h-5 w-5 text-muted-foreground" />
                <div className="flex-1 min-w-0">
                    <p className="text-sm text-muted-foreground line-through truncate">
                        {attachment.fileName}
                    </p>
                    <p className="text-xs text-muted-foreground/70">文件已过期</p>
                </div>
            </div>
        );
    }

    // 图片预览
    if (isImage(attachment.fileType) && !imageError) {
        return (
            <>
                <div
                    className={cn(
                        "relative group cursor-pointer rounded-lg overflow-hidden max-w-xs",
                        className
                    )}
                    onClick={() => setShowPreview(true)}
                >
                    <img
                        src={attachment.publicUrl}
                        alt={attachment.fileName}
                        className="w-full h-auto max-h-48 object-cover rounded-lg"
                        onError={() => setImageError(true)}
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                        <ExternalLink className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/50 to-transparent">
                        <p className="text-xs text-white truncate">{attachment.fileName}</p>
                    </div>
                </div>

                {/* 图片预览对话框 */}
                <Dialog open={showPreview} onOpenChange={setShowPreview}>
                    <DialogContent className="max-w-4xl p-0 overflow-hidden" aria-describedby={undefined}>
                        <DialogHeader className="absolute top-2 right-2 z-10">
                            <DialogTitle className="sr-only">{attachment.fileName}</DialogTitle>
                            <Button
                                variant="secondary"
                                size="icon"
                                className="h-8 w-8 rounded-full"
                                onClick={() => setShowPreview(false)}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </DialogHeader>
                        <div className="relative">
                            <img
                                src={attachment.publicUrl}
                                alt={attachment.fileName}
                                className="w-full h-auto max-h-[80vh] object-contain"
                            />
                        </div>
                        <div className="p-4 flex items-center justify-between bg-card">
                            <div>
                                <p className="font-medium truncate">{attachment.fileName}</p>
                                <p className="text-sm text-muted-foreground">
                                    {formatFileSize(attachment.fileSize)} · {getRemainingTime(attachment.expiresAt)}
                                </p>
                            </div>
                            <Button onClick={handleDownload}>
                                <Download className="h-4 w-4 mr-2" />
                                下载
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </>
        );
    }

    // 视频预览
    if (isVideo(attachment.fileType)) {
        return (
            <>
                <div
                    className={cn(
                        "relative group cursor-pointer rounded-lg overflow-hidden max-w-xs bg-muted",
                        className
                    )}
                    onClick={() => setShowPreview(true)}
                >
                    <video
                        src={attachment.publicUrl}
                        className="w-full h-auto max-h-48 object-cover rounded-lg"
                        preload="metadata"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                        <div className="h-12 w-12 rounded-full bg-white/90 flex items-center justify-center">
                            <Play className="h-6 w-6 text-foreground ml-1" />
                        </div>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/50 to-transparent">
                        <p className="text-xs text-white truncate">{attachment.fileName}</p>
                    </div>
                </div>

                {/* 视频预览对话框 */}
                <Dialog open={showPreview} onOpenChange={setShowPreview}>
                    <DialogContent className="max-w-4xl p-0 overflow-hidden" aria-describedby={undefined}>
                        <DialogHeader className="p-4 pb-0">
                            <DialogTitle className="truncate">{attachment.fileName}</DialogTitle>
                        </DialogHeader>
                        <div className="p-4">
                            <video
                                src={attachment.publicUrl}
                                controls
                                autoPlay
                                className="w-full h-auto max-h-[70vh] rounded-lg"
                            />
                        </div>
                        <div className="p-4 pt-0 flex items-center justify-between">
                            <p className="text-sm text-muted-foreground">
                                {formatFileSize(attachment.fileSize)} · {getRemainingTime(attachment.expiresAt)}
                            </p>
                            <Button onClick={handleDownload}>
                                <Download className="h-4 w-4 mr-2" />
                                下载
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </>
        );
    }

    // 其他文件类型
    return (
        <div
            className={cn(
                "flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors max-w-xs",
                className
            )}
        >
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <IconComponent className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{attachment.fileName}</p>
                <p className="text-xs text-muted-foreground">
                    {formatFileSize(attachment.fileSize)} · {getRemainingTime(attachment.expiresAt)}
                </p>
            </div>
            <Button
                variant="ghost"
                size="icon"
                className="flex-shrink-0"
                onClick={handleDownload}
            >
                <Download className="h-4 w-4" />
            </Button>
        </div>
    );
}

// 简化的附件列表预览
interface AttachmentListProps {
    attachments: MessageAttachment[];
    className?: string;
}

export function AttachmentList({ attachments, className }: AttachmentListProps) {
    if (!attachments || attachments.length === 0) return null;

    return (
        <div className={cn("space-y-2 mt-2", className)}>
            {attachments.map((attachment) => (
                <FilePreview key={attachment.id} attachment={attachment} />
            ))}
        </div>
    );
}
