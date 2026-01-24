"use client";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
    ALLOWED_FILE_TYPES,
    formatFileSize,
    getFileCategory,
    MAX_FILE_SIZE,
    type FileCategory
} from "@/lib/file-utils";
import { cn } from "@/lib/utils";
import {
    Archive,
    Code,
    File,
    FileText,
    Image as ImageIcon,
    Loader2,
    Paperclip,
    Upload,
    Video,
    X,
} from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";

interface FileUploaderProps {
    messageId?: string;
    onUploadComplete?: (attachment: UploadedAttachment) => void;
    onUploadStart?: () => void;
    disabled?: boolean;
    className?: string;
}

export interface UploadedAttachment {
    id: string;
    fileName: string;
    fileType: string;
    fileSize: number;
    category: FileCategory;
    publicUrl: string;
    expiresAt: string;
}

interface PendingFile {
    file: File;
    id: string;
    progress: number;
    status: "pending" | "uploading" | "done" | "error";
    error?: string;
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

export function FileUploader({
    messageId,
    onUploadComplete,
    onUploadStart,
    disabled = false,
    className,
}: FileUploaderProps) {
    const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // 处理文件选择
    const handleFileSelect = useCallback((files: FileList | null) => {
        if (!files || files.length === 0) return;

        const newPendingFiles: PendingFile[] = [];

        for (let i = 0; i < files.length; i++) {
            const file = files[i];

            // 验证文件大小
            if (file.size > MAX_FILE_SIZE) {
                toast.error(`${file.name} 超过 10MB 限制`);
                continue;
            }

            // 验证文件类型
            if (!ALLOWED_FILE_TYPES.includes(file.type)) {
                toast.error(`${file.name} 不支持的文件类型`);
                continue;
            }

            newPendingFiles.push({
                file,
                id: Math.random().toString(36).substring(2, 10),
                progress: 0,
                status: "pending",
            });
        }

        if (newPendingFiles.length > 0) {
            setPendingFiles((prev) => [...prev, ...newPendingFiles]);
        }
    }, []);

    // 上传单个文件
    const uploadFile = useCallback(async (pendingFile: PendingFile, msgId: string) => {
        setPendingFiles((prev) =>
            prev.map((f) =>
                f.id === pendingFile.id ? { ...f, status: "uploading" as const, progress: 10 } : f
            )
        );

        try {
            const formData = new FormData();
            formData.append("file", pendingFile.file);
            formData.append("messageId", msgId);

            const response = await fetch("/api/messages/upload", {
                method: "POST",
                body: formData,
            });

            // 模拟进度
            setPendingFiles((prev) =>
                prev.map((f) =>
                    f.id === pendingFile.id ? { ...f, progress: 70 } : f
                )
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "上传失败");
            }

            setPendingFiles((prev) =>
                prev.map((f) =>
                    f.id === pendingFile.id ? { ...f, status: "done" as const, progress: 100 } : f
                )
            );

            onUploadComplete?.(data.attachment);

            // 短暂显示完成状态后移除
            setTimeout(() => {
                setPendingFiles((prev) => prev.filter((f) => f.id !== pendingFile.id));
            }, 1000);
        } catch (error) {
            setPendingFiles((prev) =>
                prev.map((f) =>
                    f.id === pendingFile.id
                        ? {
                            ...f,
                            status: "error" as const,
                            error: error instanceof Error ? error.message : "上传失败",
                        }
                        : f
                )
            );
            toast.error(error instanceof Error ? error.message : "上传失败");
        }
    }, [onUploadComplete]);

    // 上传所有待处理文件
    const uploadAllFiles = useCallback(async (msgId: string) => {
        const pendingToUpload = pendingFiles.filter((f) => f.status === "pending");
        if (pendingToUpload.length === 0) return;

        onUploadStart?.();

        for (const file of pendingToUpload) {
            await uploadFile(file, msgId);
        }
    }, [pendingFiles, uploadFile, onUploadStart]);

    // 移除待处理文件
    const removeFile = useCallback((fileId: string) => {
        setPendingFiles((prev) => prev.filter((f) => f.id !== fileId));
    }, []);

    // 拖拽处理
    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        handleFileSelect(e.dataTransfer.files);
    }, [handleFileSelect]);

    // 如果提供了 messageId，自动上传
    const handleFilesWithMessageId = useCallback((files: FileList | null) => {
        handleFileSelect(files);
        // 如果已有 messageId，延迟后自动上传
        if (messageId && files && files.length > 0) {
            setTimeout(() => {
                uploadAllFiles(messageId);
            }, 100);
        }
    }, [handleFileSelect, messageId, uploadAllFiles]);

    return (
        <div className={cn("relative", className)}>
            {/* 隐藏的文件输入 */}
            <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                accept={ALLOWED_FILE_TYPES.join(",")}
                onChange={(e) => handleFilesWithMessageId(e.target.files)}
                disabled={disabled}
            />

            {/* 上传按钮 */}
            <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => fileInputRef.current?.click()}
                disabled={disabled}
                className="flex-shrink-0"
            >
                <Paperclip className="h-5 w-5 text-muted-foreground" />
            </Button>

            {/* 拖拽区域覆盖层 */}
            {isDragging && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                >
                    <div className="flex flex-col items-center gap-4 p-8 border-2 border-dashed border-primary rounded-xl bg-card">
                        <Upload className="h-12 w-12 text-primary" />
                        <p className="text-lg font-medium">释放文件以上传</p>
                        <p className="text-sm text-muted-foreground">支持图片、视频、文档等</p>
                    </div>
                </div>
            )}

            {/* 待处理文件列表 */}
            {pendingFiles.length > 0 && (
                <div className="absolute bottom-full left-0 right-0 mb-2 p-2 bg-card border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    <div className="space-y-2">
                        {pendingFiles.map((pf) => {
                            const category = getFileCategory(pf.file.type);
                            const IconComponent = FileIconMap[category] || File;

                            return (
                                <div
                                    key={pf.id}
                                    className="flex items-center gap-2 p-2 bg-muted/50 rounded"
                                >
                                    <IconComponent className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm truncate">{pf.file.name}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {formatFileSize(pf.file.size)}
                                        </p>
                                        {pf.status === "uploading" && (
                                            <Progress value={pf.progress} className="h-1 mt-1" />
                                        )}
                                        {pf.status === "error" && (
                                            <p className="text-xs text-destructive">{pf.error}</p>
                                        )}
                                    </div>
                                    {pf.status === "uploading" ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : pf.status === "done" ? (
                                        <span className="text-xs text-green-500">✓</span>
                                    ) : (
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6"
                                            onClick={() => removeFile(pf.id)}
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}

// 导出上传函数供外部使用
export async function uploadMessageFile(
    file: File,
    messageId: string
): Promise<UploadedAttachment> {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("messageId", messageId);

    const response = await fetch("/api/messages/upload", {
        method: "POST",
        body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error || "上传失败");
    }

    return data.attachment;
}
