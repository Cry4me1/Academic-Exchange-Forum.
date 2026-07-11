/**
 * 洛谷 API 工具模块
 * 直接请求洛谷公开 API，无需 Supabase Edge Function 代理
 */

const LUOGU_BASE_URL = "https://www.luogu.com.cn";
const LUOGU_USER_AGENT = "Scholarly/1.0";
const LUOGU_REQUEST_TIMEOUT = 10000; // 10 秒超时

export interface LuoguUserInfo {
    uid: number;
    name: string;
    introduction: string;
    avatar: string;
    slogan: string;
    color: string;
    ccfLevel: number;
}

export interface LuoguFetchResult {
    ok: boolean;
    user?: LuoguUserInfo;
    error?: string;
}

/**
 * 通过 UID 获取洛谷用户信息
 * 
 * 使用 `x-lentille-request: content-only` 请求头获取 JSON 格式的用户数据，
 * 替代之前的 Supabase Edge Function 代理方案。
 */
export async function fetchLuoguUser(uid: string): Promise<LuoguFetchResult> {
    const url = `${LUOGU_BASE_URL}/user/${uid}`;

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), LUOGU_REQUEST_TIMEOUT);

        const response = await fetch(url, {
            method: "GET",
            headers: {
                "x-lentille-request": "content-only",
                "User-Agent": LUOGU_USER_AGENT,
                "Accept": "application/json",
            },
            signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            // 洛谷可能返回 418 (I'm a teapot) 来拦截自动化请求
            if (response.status === 418) {
                return {
                    ok: false,
                    error: "洛谷暂时限制了请求，请稍后重试",
                };
            }
            if (response.status === 404) {
                return {
                    ok: false,
                    error: `未找到 UID 为 ${uid} 的洛谷用户`,
                };
            }
            return {
                ok: false,
                error: `洛谷接口返回异常 (状态码: ${response.status})`,
            };
        }

        const json = await response.json();

        // 验证返回数据结构
        // 洛谷 API 返回格式: { template: "user.show", status: 200, data: { user: { ... } } }
        if (!json?.data?.user) {
            return {
                ok: false,
                error: "洛谷返回数据格式异常，请稍后重试",
            };
        }

        const rawUser = json.data.user;

        return {
            ok: true,
            user: {
                uid: rawUser.uid,
                name: rawUser.name || "",
                introduction: rawUser.introduction || "",
                avatar: rawUser.avatar || "",
                slogan: rawUser.slogan || "",
                color: rawUser.color || "",
                ccfLevel: rawUser.ccfLevel ?? 0,
            },
        };
    } catch (error: any) {
        if (error.name === "AbortError") {
            return {
                ok: false,
                error: "请求洛谷超时，请检查网络后重试",
            };
        }
        return {
            ok: false,
            error: `网络连接失败: ${error.message}`,
        };
    }
}

/**
 * 从用户复制的洛谷主页 HTML 源码或纯 JSON 中解析出用户信息
 */
export function parseLuoguHtmlOrJson(rawInput: string): LuoguFetchResult {
    if (!rawInput || !rawInput.trim()) {
        return { ok: false, error: "输入内容为空" };
    }

    try {
        let jsonStr = rawInput.trim();

        // 如果是 HTML 源码，使用正则提取 <script id="lentille-context" type="application/json">...</script> 中的 JSON
        if (rawInput.includes("<script") || rawInput.includes("<html") || rawInput.includes("<!DOCTYPE")) {
            // 支持新版 lentille-context 标签
            const scriptMatch = rawInput.match(/<script\s+id="lentille-context"\s+type="application\/json">([\s\S]*?)<\/script>/);
            
            // 兼容可能出现的旧版 feInjection 标签或其它 JSON 注入点
            if (scriptMatch) {
                jsonStr = scriptMatch[1].trim();
            } else {
                // 尝试通用匹配所有 type="application/json" 的 script 标签
                const generalMatch = rawInput.match(/<script\s+type="application\/json">([\s\S]*?)<\/script>/);
                if (generalMatch) {
                    jsonStr = generalMatch[1].trim();
                } else {
                    return {
                        ok: false,
                        error: "未在复制的 HTML 网页源码中找到洛谷用户数据，请确保全选并复制了完整的网页源代码。",
                    };
                }
            }
        }

        // 解析 JSON 数据
        const json = JSON.parse(jsonStr);
        
        // 洛谷的结构可能有几种：
        // 1. { data: { user: { ... } } } （content-only API 格式）
        // 2. { currentData: { user: { ... } } } （网页端直接渲染的注入数据格式）
        // 3. { code: 200, currentData: { user: { ... } } }
        let rawUser = json?.data?.user || json?.currentData?.user;

        if (!rawUser && json?.user) {
            rawUser = json.user;
        }

        if (!rawUser) {
            return {
                ok: false,
                error: "解析成功，但未能在数据中定位到洛谷用户信息（user 对象），请确保复制的是洛谷个人主页的源码数据。",
            };
        }

        return {
            ok: true,
            user: {
                uid: rawUser.uid,
                name: rawUser.name || "",
                introduction: rawUser.introduction || "",
                avatar: rawUser.avatar || "",
                slogan: rawUser.slogan || "",
                color: rawUser.color || "",
                ccfLevel: rawUser.ccfLevel ?? 0,
            },
        };
    } catch (error: any) {
        return {
            ok: false,
            error: `解析洛谷数据失败，请确认您复制了完整的 JSON 数据或网页源代码。错误信息: ${error.message}`,
        };
    }
}

