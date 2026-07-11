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
