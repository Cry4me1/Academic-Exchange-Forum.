import { createClient } from "@/lib/supabase/client";

const BUCKET_NAME = "post-images";
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];
const ALLOWED_VIDEO_TYPES = ["video/mp4", "video/webm"];

export interface UploadResult {
    url: string;
    type: "image" | "video";
    fileName: string;
}

export interface UploadProgress {
    progress: number;
    fileName: string;
}

/**
 * 验证文件类型和大小
 */
export function validateFile(file: File): { valid: boolean; error?: string } {
    const isImage = ALLOWED_IMAGE_TYPES.includes(file.type);
    const isVideo = ALLOWED_VIDEO_TYPES.includes(file.type);

    if (!isImage && !isVideo) {
        return {
            valid: false,
            error: `不支持的文件类型: ${file.type}。支持的格式: JPEG, PNG, GIF, WebP, MP4, WebM`,
        };
    }

    if (file.size > MAX_FILE_SIZE) {
        return {
            valid: false,
            error: `文件过大: ${(file.size / 1024 / 1024).toFixed(2)}MB。最大支持 10MB`,
        };
    }

    return { valid: true };
}

/**
 * 生成唯一文件名
 */
function generateFileName(originalName: string): string {
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    const extension = originalName.split(".").pop() || "file";
    return `${timestamp}-${randomStr}.${extension}`;
}

/**
 * 上传媒体文件到 Supabase Storage
 */
export async function uploadMedia(
    file: File,
    onProgress?: (progress: UploadProgress) => void
): Promise<UploadResult> {
    // 验证文件
    const validation = validateFile(file);
    if (!validation.valid) {
        throw new Error(validation.error);
    }

    const supabase = createClient();
    const fileName = generateFileName(file.name);
    const filePath = `uploads/${fileName}`;

    // 模拟进度（Supabase JS SDK 暂不支持真实进度）
    if (onProgress) {
        onProgress({ progress: 0, fileName: file.name });
    }

    // 上传文件
    const { error: uploadError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(filePath, file, {
            cacheControl: "3600",
            upsert: false,
        });

    if (uploadError) {
        throw new Error(`上传失败: ${uploadError.message}`);
    }

    if (onProgress) {
        onProgress({ progress: 100, fileName: file.name });
    }

    // 获取公开 URL
    const { data: urlData } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(filePath);

    const isImage = ALLOWED_IMAGE_TYPES.includes(file.type);

    return {
        url: urlData.publicUrl,
        type: isImage ? "image" : "video",
        fileName: file.name,
    };
}

/**
 * 批量上传媒体文件
 */
export async function uploadMultipleMedia(
    files: File[],
    onProgress?: (progress: UploadProgress, index: number) => void
): Promise<UploadResult[]> {
    const results: UploadResult[] = [];

    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const result = await uploadMedia(file, (progress) => {
            if (onProgress) {
                onProgress(progress, i);
            }
        });
        results.push(result);
    }

    return results;
}
