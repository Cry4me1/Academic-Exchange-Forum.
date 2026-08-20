/**
 * 用户名注册与登录辅助工具
 * 保证中英文用户名均能生成清爽、直观且符合 RFC 标准的虚拟邮箱
 */

// 常用汉字拼音首字母/简易转写映射表（涵盖常见字符）
const PINYIN_MAP: Record<string, string> = {
    "测": "ce", "试": "shi", "账": "zhang", "号": "hao", "用": "yong", "户": "hu",
    "管": "guan", "理": "li", "员": "yuan", "学": "xue", "者": "zhe", "教": "jiao",
    "授": "shou", "研": "yan", "究": "jiu", "生": "sheng", "博": "bo", "士": "shi",
    "中": "zhong", "国": "guo", "华": "hua", "大": "da", "小": "xiao", "明": "ming",
    "红": "hong", "军": "jun", "强": "qiang", "伟": "wei", "刚": "gang", "勇": "yong",
    "峰": "feng", "超": "chao", "波": "bo", "涛": "tao", "鹏": "peng", "飞": "fei",
    "龙": "long", "亮": "liang", "文": "wen", "武": "wu", "金": "jin", "木": "mu",
    "水": "shui", "火": "huo", "土": "tu", "天": "tian", "地": "di", "人": "ren",
};

/**
 * 将中文字符串转换为简要拼音/安全 ASCII 标识
 */
function transcodeChineseToCleanAscii(str: string): string {
    let result = "";
    for (const char of str) {
        if (/[a-zA-Z0-9_.-]/.test(char)) {
            result += char.toLowerCase();
        } else if (PINYIN_MAP[char]) {
            result += PINYIN_MAP[char];
        } else {
            // 未知汉字或 Unicode 字符，使用字符的 Unicode 码点后 4 位，保持简短
            const code = char.charCodeAt(0).toString(16);
            result += code.slice(-2);
        }
    }
    return result.replace(/[^a-z0-9_.-]/g, "").slice(0, 24);
}

/**
 * 生成规范、清爽的虚拟邮箱
 * 示例：
 * - "hansszh" -> "hansszh@scholarly.org"
 * - "ceshi1" -> "ceshi1@scholarly.org"
 * - "11111" -> "11111@scholarly.org"
 * - "测试账号1" -> "ceshizhanghao1@scholarly.org"
 */
export function getUsernamePseudoEmail(username: string): string {
    const clean = (username || "").trim().toLowerCase();
    
    // 1. 如果是纯 ASCII 字母、数字、下划线、短横线，直接作为邮箱前缀（最干净）
    if (/^[a-z0-9_.-]+$/.test(clean)) {
        return `${clean}@scholarly.org`;
    }

    // 2. 包含中文等非 ASCII 字符时，转为干净的拼音/简短 ASCII 组合
    let asciiPrefix = transcodeChineseToCleanAscii(clean);
    if (!asciiPrefix || asciiPrefix.length < 2) {
        asciiPrefix = `scholar_${Math.random().toString(36).substring(2, 7)}`;
    }

    return `${asciiPrefix}@scholarly.org`;
}
