import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB

/**
 * 上传图片到服务器 (支持 R2 或 Supabase，由服务端决定)
 */
export const onUpload = async (file: File): Promise<string> => {
    const promise = new Promise<string>(async (resolve, reject) => {
        try {
            // 客户端预验证文件大小
            if (file.size > MAX_FILE_SIZE) {
                throw new Error(`图片大小不能超过 2MB，当前大小：${(file.size / 1024 / 1024).toFixed(2)}MB`);
            }

            // 通过服务端 API 上传
            const formData = new FormData();
            formData.append("file", file);

            const response = await fetch("/api/upload", {
                method: "POST",
                body: formData,
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "上传失败");
            }

            resolve(data.url);
        } catch (error) {
            reject(error);
        }
    });

    return new Promise((resolve) => {
        toast.promise(
            promise.then((url) => {
                resolve(url);
                return url;
            }),
            {
                loading: "正在上传图片...",
                success: "图片上传成功",
                error: (err) => {
                    console.error("Upload error:", err);
                    return err instanceof Error ? err.message : "图片上传失败";
                },
            }
        );
    });
};

/**
 * 删除图片 (兼容 R2 和 Supabase Storage)
 * @param url 图片的公开 URL
 */
export const onDelete = async (url: string): Promise<void> => {
    try {
        // 判断是 Supabase 还是 R2 URL
        if (url.includes(".supabase.co/storage")) {
            // Supabase Storage 删除
            const supabase = createClient();
            const urlObj = new URL(url);
            const pathParts = urlObj.pathname.split('/');
            const bucketIndex = pathParts.indexOf('post-images');

            if (bucketIndex === -1) {
                console.warn('URL does not belong to post-images bucket:', url);
                return;
            }

            const filePath = pathParts.slice(bucketIndex + 1).join('/');
            if (!filePath) {
                console.warn('Could not extract file path from URL:', url);
                return;
            }

            const { error } = await supabase.storage
                .from('post-images')
                .remove([filePath]);

            if (error) {
                console.error('Failed to delete image from Supabase storage:', error);
            } else {
                console.log('Successfully deleted image from Supabase storage:', filePath);
            }
        } else if (url.includes(".r2.dev") || url.includes("r2.cloudflarestorage.com")) {
            // R2 删除 - 需要通过 API 调用
            const response = await fetch("/api/upload", {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ url }),
            });

            if (!response.ok) {
                const data = await response.json();
                console.error("Failed to delete image from R2:", data.error);
            } else {
                console.log("Successfully deleted image from R2");
            }
        } else {
            console.warn("Unknown image URL format:", url);
        }
    } catch (error) {
        console.error('Error deleting image:', error);
    }
};
