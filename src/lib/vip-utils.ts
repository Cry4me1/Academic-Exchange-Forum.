// VIP 等级定义与工具函数
// 用于全局复用的 VIP 等级体系

export interface VipLevelInfo {
    level: number
    name: string
    title: string     // 称号后缀
    minSpent: number  // 累计消费积分阈值
    color: string     // 主色调 tailwind class
    gradient: string  // 渐变背景
    textGradient: string // 文字渐变
    borderColor: string
    glowColor: string
}

export const VIP_LEVELS: VipLevelInfo[] = [
    {
        level: 1,
        name: 'V1',
        title: '学术新星',
        minSpent: 0,
        color: 'text-zinc-400',
        gradient: 'from-zinc-400 to-zinc-500',
        textGradient: 'from-zinc-400 to-zinc-600',
        borderColor: 'border-zinc-400/50',
        glowColor: 'shadow-zinc-400/20',
    },
    {
        level: 2,
        name: 'V2',
        title: '学术探索者',
        minSpent: 500,
        color: 'text-green-400',
        gradient: 'from-green-400 to-emerald-500',
        textGradient: 'from-green-400 to-emerald-600',
        borderColor: 'border-green-400/50',
        glowColor: 'shadow-green-400/20',
    },
    {
        level: 3,
        name: 'V3',
        title: '学术精英',
        minSpent: 2000,
        color: 'text-blue-400',
        gradient: 'from-blue-400 to-cyan-500',
        textGradient: 'from-blue-400 to-cyan-600',
        borderColor: 'border-blue-400/50',
        glowColor: 'shadow-blue-400/20',
    },
    {
        level: 4,
        name: 'V4',
        title: '学术大师',
        minSpent: 5000,
        color: 'text-purple-400',
        gradient: 'from-purple-400 to-violet-500',
        textGradient: 'from-purple-400 to-violet-600',
        borderColor: 'border-purple-400/50',
        glowColor: 'shadow-purple-400/20',
    },
    {
        level: 5,
        name: 'V5',
        title: '学术泰斗',
        minSpent: 15000,
        color: 'text-amber-400',
        gradient: 'from-amber-400 to-orange-500',
        textGradient: 'from-amber-400 to-orange-500',
        borderColor: 'border-amber-400/50',
        glowColor: 'shadow-amber-400/30',
    },
    {
        level: 6,
        name: 'V6',
        title: '学术至尊',
        minSpent: 50000,
        color: 'text-rose-400',
        gradient: 'from-rose-400 via-pink-500 to-fuchsia-500',
        textGradient: 'from-rose-400 via-pink-500 to-fuchsia-500',
        borderColor: 'border-rose-400/50',
        glowColor: 'shadow-rose-500/40',
    },
]

/**
 * 根据等级数字 (1-6) 直接获取 VIP 等级信息
 * 这是推荐的方式：直接从数据库中读取 vip_level 字段来获取等级
 */
export function getVipLevelByNumber(level: number): VipLevelInfo {
    return VIP_LEVELS.find((l) => l.level === level) || VIP_LEVELS[0]
}

/**
 * 根据累计消费积分获取 VIP 等级信息
 * @deprecated 建议使用 getVipLevelByNumber，直接从数据库读取等级
 */
export function getVipLevel(totalSpent: number): VipLevelInfo {
    let result = VIP_LEVELS[0]
    for (const lvl of VIP_LEVELS) {
        if (totalSpent >= lvl.minSpent) {
            result = lvl
        }
    }
    return result
}

/**
 * 根据等级数字获取到下一个等级的进度
 */
export function getNextLevelProgressByLevel(currentLevel: number, totalSpent: number): {
    current: VipLevelInfo
    next: VipLevelInfo | null
    progress: number // 0-100
    remaining: number
} {
    const current = getVipLevelByNumber(currentLevel)
    const nextIndex = VIP_LEVELS.findIndex((l) => l.level === current.level) + 1
    const next = nextIndex < VIP_LEVELS.length ? VIP_LEVELS[nextIndex] : null

    if (!next) {
        return { current, next: null, progress: 100, remaining: 0 }
    }

    const range = next.minSpent - current.minSpent
    const done = totalSpent - current.minSpent
    const progress = Math.min(100, Math.round((done / range) * 100))
    return { current, next, progress, remaining: next.minSpent - totalSpent }
}

/**
 * 获取到下一个等级还需要多少积分
 * @deprecated 建议使用 getNextLevelProgressByLevel
 */
export function getNextLevelProgress(totalSpent: number): {
    current: VipLevelInfo
    next: VipLevelInfo | null
    progress: number // 0-100
    remaining: number
} {
    const current = getVipLevel(totalSpent)
    const nextIndex = VIP_LEVELS.findIndex((l) => l.level === current.level) + 1
    const next = nextIndex < VIP_LEVELS.length ? VIP_LEVELS[nextIndex] : null

    if (!next) {
        return { current, next: null, progress: 100, remaining: 0 }
    }

    const range = next.minSpent - current.minSpent
    const done = totalSpent - current.minSpent
    const progress = Math.min(100, Math.round((done / range) * 100))
    return { current, next, progress, remaining: next.minSpent - totalSpent }
}
