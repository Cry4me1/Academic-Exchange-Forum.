/**
 * Cloudflare R2 操作库
 * 使用原生 fetch + Web Crypto API 实现 AWS Signature V4
 * 无需 @aws-sdk/client-s3，完全兼容 Edge Runtime
 */

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME;
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL;

export const isR2Configured = () =>
    !!(R2_ACCOUNT_ID && R2_ACCESS_KEY_ID && R2_SECRET_ACCESS_KEY && R2_BUCKET_NAME && R2_PUBLIC_URL);

// ─── AWS Signature V4 Helpers ────────────────────────────────────────────────

function getR2Endpoint() {
    return `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;
}

async function hmacSHA256(key: ArrayBuffer, data: string): Promise<ArrayBuffer> {
    const cryptoKey = await crypto.subtle.importKey(
        "raw", key, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
    );
    return crypto.subtle.sign("HMAC", cryptoKey, new TextEncoder().encode(data));
}

async function hmacSHA256Key(key: CryptoKey, data: string): Promise<ArrayBuffer> {
    return crypto.subtle.sign("HMAC", key, new TextEncoder().encode(data));
}

async function sha256Hex(data: string | Uint8Array): Promise<string> {
    const encoded = typeof data === "string" ? new TextEncoder().encode(data) : data;
    const hash = await crypto.subtle.digest("SHA-256", encoded.buffer as ArrayBuffer);
    return toHex(hash);
}

function toHex(buf: ArrayBuffer): string {
    return Array.from(new Uint8Array(buf))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
}

function formatDate(d: Date): string {
    return d.toISOString().replace(/[:-]|\.\d{3}/g, "").slice(0, 15) + "Z";
}

async function buildSigV4Headers(
    method: string,
    key: string,
    contentType: string,
    body: Uint8Array | null,
    extraHeaders: Record<string, string> = {}
): Promise<Record<string, string>> {
    const now = new Date();
    const amzDate = formatDate(now);
    const dateStamp = amzDate.slice(0, 8);
    const region = "auto";
    const service = "s3";
    const host = `${R2_BUCKET_NAME}.${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;

    const payloadHash = body ? await sha256Hex(body) : await sha256Hex("");

    const headers: Record<string, string> = {
        host,
        "x-amz-date": amzDate,
        "x-amz-content-sha256": payloadHash,
        ...extraHeaders,
    };
    if (contentType) headers["content-type"] = contentType;

    const sortedHeaderKeys = Object.keys(headers).sort();
    const canonicalHeaders = sortedHeaderKeys.map((k) => `${k}:${headers[k]}\n`).join("");
    const signedHeaders = sortedHeaderKeys.join(";");
    const canonicalUri = `/${encodeURIComponent(key).replace(/%2F/g, "/")}`;
    const canonicalRequest = [method, canonicalUri, "", canonicalHeaders, signedHeaders, payloadHash].join("\n");

    const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
    const stringToSign = ["AWS4-HMAC-SHA256", amzDate, credentialScope, await sha256Hex(canonicalRequest)].join("\n");

    // Derive signing key
    const kDate = await hmacSHA256(
        new TextEncoder().encode(`AWS4${R2_SECRET_ACCESS_KEY}`).buffer as ArrayBuffer,
        dateStamp
    );
    const kRegion = await hmacSHA256(kDate, region);
    const kService = await hmacSHA256(kRegion, service);
    const kSigning = await hmacSHA256(kService, "aws4_request");

    const kSigningKey = await crypto.subtle.importKey(
        "raw", kSigning, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
    );
    const signature = toHex(await hmacSHA256Key(kSigningKey, stringToSign));

    const authorization = `AWS4-HMAC-SHA256 Credential=${R2_ACCESS_KEY_ID}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

    return {
        ...headers,
        authorization,
    };
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * 上传文件到 Cloudflare R2
 */
export async function uploadToR2(
    file: Uint8Array | Buffer,
    fileName: string,
    contentType: string
): Promise<string> {
    const uint8 = file instanceof Uint8Array ? file : new Uint8Array(file);
    const headers = await buildSigV4Headers("PUT", fileName, contentType, uint8);
    const url = `${getR2Endpoint()}/${R2_BUCKET_NAME}/${encodeURIComponent(fileName).replace(/%2F/g, "/")}`;

    const res = await fetch(url, { method: "PUT", headers, body: uint8.buffer as ArrayBuffer });
    if (!res.ok) {
        const text = await res.text();
        throw new Error(`R2 上传失败 (${res.status}): ${text}`);
    }

    return `${R2_PUBLIC_URL}/${fileName}`;
}

/**
 * 从 Cloudflare R2 删除单个文件
 */
export async function deleteFromR2(url: string): Promise<void> {
    if (!isR2Configured()) {
        console.warn("R2 未配置，跳过删除");
        return;
    }
    try {
        const urlObj = new URL(url);
        const fileName = urlObj.pathname.slice(1);
        if (!fileName) {
            console.warn("无法从 URL 提取文件名:", url);
            return;
        }
        await deleteKeyFromR2(fileName);
        console.log("成功删除 R2 文件:", fileName);
    } catch (error) {
        console.error("删除 R2 文件失败:", error);
    }
}

/**
 * 批量从 Cloudflare R2 删除文件（按 key）
 */
export async function deleteObjectsFromR2(keys: string[]): Promise<void> {
    if (!isR2Configured() || keys.length === 0) return;
    await Promise.allSettled(keys.map((key) => deleteKeyFromR2(key)));
    console.log(`成功从 R2 批量删除 ${keys.length} 个文件`);
}

async function deleteKeyFromR2(key: string): Promise<void> {
    const headers = await buildSigV4Headers("DELETE", key, "", null);
    const url = `${getR2Endpoint()}/${R2_BUCKET_NAME}/${encodeURIComponent(key).replace(/%2F/g, "/")}`;
    const res = await fetch(url, { method: "DELETE", headers });
    if (!res.ok && res.status !== 204) {
        const text = await res.text();
        throw new Error(`R2 删除失败 (${res.status}): ${text}`);
    }
}

/**
 * 获取 R2 文件流
 */
export async function getFileStream(fileName: string): Promise<ReadableStream | null> {
    const headers = await buildSigV4Headers("GET", fileName, "", null);
    const url = `${getR2Endpoint()}/${R2_BUCKET_NAME}/${encodeURIComponent(fileName).replace(/%2F/g, "/")}`;
    const res = await fetch(url, { method: "GET", headers });
    if (!res.ok) {
        const text = await res.text();
        throw new Error(`R2 获取文件失败 (${res.status}): ${text}`);
    }
    return res.body;
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
