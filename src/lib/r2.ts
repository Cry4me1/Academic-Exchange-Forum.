import { DeleteObjectCommand, DeleteObjectsCommand, GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

// R2 配置 - 检查是否启用
const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME;
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL;

// 检查 R2 是否已配置
export const isR2Configured = () => {
    return !!(
        R2_ACCOUNT_ID &&
        R2_ACCESS_KEY_ID &&
        R2_SECRET_ACCESS_KEY &&
        R2_BUCKET_NAME &&
        R2_PUBLIC_URL
    );
};

// 创建 S3 兼容客户端 (R2 使用 S3 API)
const createR2Client = () => {
    if (!isR2Configured()) {
        throw new Error("R2 环境变量未配置");
    }

    return new S3Client({
        region: "auto",
        endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
        credentials: {
            accessKeyId: R2_ACCESS_KEY_ID!,
            secretAccessKey: R2_SECRET_ACCESS_KEY!,
        },
    });
};

/**
 * 上传文件到 Cloudflare R2
 * @param file 文件 Buffer 或 Uint8Array
 * @param fileName 文件名
 * @param contentType 文件 MIME 类型
 * @returns 公开访问 URL
 */
export async function uploadToR2(
    file: Uint8Array | Buffer,
    fileName: string,
    contentType: string
): Promise<string> {
    const client = createR2Client();

    const command = new PutObjectCommand({
        Bucket: R2_BUCKET_NAME!,
        Key: fileName,
        Body: file,
        ContentType: contentType,
    });

    await client.send(command);

    // 返回公开 URL
    return `${R2_PUBLIC_URL}/${fileName}`;
}

/**
 * 从 Cloudflare R2 删除文件
 * @param url 文件的公开 URL
 */
export async function deleteFromR2(url: string): Promise<void> {
    if (!isR2Configured()) {
        console.warn("R2 未配置，跳过删除");
        return;
    }

    try {
        // 从 URL 提取文件名
        const urlObj = new URL(url);
        const fileName = urlObj.pathname.slice(1); // 移除开头的 /

        if (!fileName) {
            console.warn("无法从 URL 提取文件名:", url);
            return;
        }

        const client = createR2Client();
        const command = new DeleteObjectCommand({
            Bucket: R2_BUCKET_NAME!,
            Key: fileName,
        });

        await client.send(command);
        console.log("成功删除 R2 文件:", fileName);
    } catch (error) {
        console.error("删除 R2 文件失败:", error);
    }
}

/**
 * 检查 URL 是否属于 R2
 */
export function isR2Url(url: string): boolean {
    return url.includes(".r2.dev") || url.includes("r2.cloudflarestorage.com");
}

/**
 * 检查 URL 是否属于 Supabase Storage
 */
export function isSupabaseUrl(url: string): boolean {
    return url.includes(".supabase.co/storage");
}

/**
 * 批量从 Cloudflare R2 删除文件
 * @param keys 文件 Key 列表 (不是 URL)
 */
export async function deleteObjectsFromR2(keys: string[]): Promise<void> {
    if (!isR2Configured() || keys.length === 0) {
        return;
    }

    try {
        const client = createR2Client();
        const command = new DeleteObjectsCommand({
            Bucket: R2_BUCKET_NAME!,
            Delete: {
                Objects: keys.map(key => ({ Key: key })),
                Quiet: true,
            },
        });

        await client.send(command);
        console.log(`成功从 R2 批量删除 ${keys.length} 个文件`);
    } catch (error) {
        console.error("批量删除 R2 文件失败:", error);
    }
}

/**
 * 获取 R2 文件流
 * @param fileName 文件名
 */
export async function getFileStream(fileName: string) {
    const client = createR2Client();
    const command = new GetObjectCommand({
        Bucket: R2_BUCKET_NAME!,
        Key: fileName,
    });

    const response = await client.send(command);
    return response.Body;
}
