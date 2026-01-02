import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB

export const onUpload = async (file: File): Promise<string> => {
    const supabase = createClient();
    const promise = new Promise<string>(async (resolve, reject) => {
        try {
            // Validate file size (max 2MB)
            if (file.size > MAX_FILE_SIZE) {
                throw new Error(`图片大小不能超过 2MB，当前大小：${(file.size / 1024 / 1024).toFixed(2)}MB`);
            }

            // Create a unique file name
            const fileExt = file.name.split(".").pop();
            const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
            const filePath = `${fileName}`;

            const { error: uploadError, data } = await supabase.storage
                .from("post-images")
                .upload(filePath, file, {
                    cacheControl: "3600",
                    upsert: false,
                });

            if (uploadError) {
                throw uploadError;
            }

            const { data: { publicUrl } } = supabase.storage
                .from("post-images")
                .getPublicUrl(filePath);

            resolve(publicUrl);
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
                    return "图片上传失败";
                },
            }
        );
    });
};

/**
 * Delete an image from Supabase Storage by its public URL
 * @param url The public URL of the image to delete
 */
export const onDelete = async (url: string): Promise<void> => {
    const supabase = createClient();

    try {
        // Extract the file path from the public URL
        // URL format: https://<project>.supabase.co/storage/v1/object/public/post-images/<filename>
        const urlObj = new URL(url);
        const pathParts = urlObj.pathname.split('/');

        // Find the index of 'post-images' in the path
        const bucketIndex = pathParts.indexOf('post-images');
        if (bucketIndex === -1) {
            console.warn('URL does not belong to post-images bucket:', url);
            return;
        }

        // Get the file path after the bucket name
        const filePath = pathParts.slice(bucketIndex + 1).join('/');

        if (!filePath) {
            console.warn('Could not extract file path from URL:', url);
            return;
        }

        const { error } = await supabase.storage
            .from('post-images')
            .remove([filePath]);

        if (error) {
            console.error('Failed to delete image from storage:', error);
        } else {
            console.log('Successfully deleted image from storage:', filePath);
        }
    } catch (error) {
        console.error('Error deleting image:', error);
    }
};
