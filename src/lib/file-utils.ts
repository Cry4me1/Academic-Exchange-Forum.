/**
 * 文件处理工具库
 * 用于私信文件上传和预览功能
 */

// 文件大小格式化
export function formatFileSize(bytes: number): string {
    if (bytes === 0) return "0 B";

    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

// 文件类型分类
export type FileCategory = "image" | "video" | "document" | "archive" | "code" | "other";

// 获取文件类别
export function getFileCategory(mimeType: string): FileCategory {
    if (mimeType.startsWith("image/")) return "image";
    if (mimeType.startsWith("video/")) return "video";

    const documentTypes = [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument",
        "text/plain",
        "text/markdown",
        "text/csv",
    ];
    if (documentTypes.some(t => mimeType.includes(t))) return "document";

    const archiveTypes = ["zip", "rar", "7z", "gzip", "tar"];
    if (archiveTypes.some(t => mimeType.includes(t))) return "archive";

    const codeTypes = ["javascript", "json", "html", "css", "xml", "typescript"];
    if (codeTypes.some(t => mimeType.includes(t))) return "code";

    return "other";
}

// 判断是否可以预览
export function canPreview(mimeType: string): boolean {
    const category = getFileCategory(mimeType);
    return category === "image" || category === "video";
}

// 判断是否是图片
export function isImage(mimeType: string): boolean {
    return mimeType.startsWith("image/");
}

// 判断是否是视频
export function isVideo(mimeType: string): boolean {
    return mimeType.startsWith("video/");
}

// 获取文件扩展名
export function getFileExtension(fileName: string): string {
    const parts = fileName.split(".");
    return parts.length > 1 ? parts.pop()!.toLowerCase() : "";
}

// 根据文件类型获取图标名称
export function getFileIcon(mimeType: string): string {
    const category = getFileCategory(mimeType);

    switch (category) {
        case "image":
            return "image";
        case "video":
            return "video";
        case "document":
            if (mimeType.includes("pdf")) return "file-text";
            if (mimeType.includes("word")) return "file-text";
            if (mimeType.includes("excel") || mimeType.includes("spreadsheet")) return "table";
            if (mimeType.includes("powerpoint") || mimeType.includes("presentation")) return "presentation";
            return "file-text";
        case "archive":
            return "archive";
        case "code":
            return "code";
        default:
            return "file";
    }
}

// 附件类型定义
export interface MessageAttachment {
    id: string;
    messageId: string;
    fileName: string;
    fileType: string;
    fileSize: number;
    storagePath: string;
    publicUrl: string;
    expiresAt: string;
    isExpired: boolean;
    createdAt: string;
}

// 检查文件是否已过期
export function isFileExpired(expiresAt: string): boolean {
    return new Date(expiresAt) < new Date();
}

// 计算剩余有效时间
export function getRemainingTime(expiresAt: string): string {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diff = expiry.getTime() - now.getTime();

    if (diff <= 0) return "已过期";

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0) return `${days}天${hours}小时后过期`;
    if (hours > 0) return `${hours}小时后过期`;

    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${minutes}分钟后过期`;
}

// 允许的文件类型
export const ALLOWED_FILE_TYPES = [
    // 图片
    "image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml",
    // 视频
    "video/mp4", "video/webm", "video/ogg", "video/quicktime",
    // 文档
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "text/plain", "text/markdown", "text/csv",
    // 压缩包
    "application/zip", "application/x-rar-compressed", "application/x-7z-compressed", "application/gzip",
    // 代码
    "application/json", "application/javascript", "text/html", "text/css", "application/xml",
];

// 文件大小限制
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
