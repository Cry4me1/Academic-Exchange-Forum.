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

// 等级样式配置（与数据库无关，纯展示用）
const LEVEL_STYLES: Record<number, Pick<VipLevelInfo, 'color' | 'gradient' | 'textGradient' | 'borderColor' | 'glowColor'>> = {
    1: {
        color: 'text-zinc-400',
        gradient: 'from-zinc-400 to-zinc-500',
        textGradient: 'from-zinc-400 to-zinc-600',
        borderColor: 'border-zinc-400/50',
        glowColor: 'shadow-zinc-400/20',
    },
    2: {
        color: 'text-green-400',
        gradient: 'from-green-400 to-emerald-500',
        textGradient: 'from-green-400 to-emerald-600',
        borderColor: 'border-green-400/50',
        glowColor: 'shadow-green-400/20',
    },
    3: {
        color: 'text-blue-400',
        gradient: 'from-blue-400 to-cyan-500',
        textGradient: 'from-blue-400 to-cyan-600',
        borderColor: 'border-blue-400/50',
        glowColor: 'shadow-blue-400/20',
    },
    4: {
        color: 'text-purple-400',
        gradient: 'from-purple-400 to-violet-500',
        textGradient: 'from-purple-400 to-violet-600',
        borderColor: 'border-purple-400/50',
        glowColor: 'shadow-purple-400/20',
    },
    5: {
        color: 'text-amber-400',
        gradient: 'from-amber-400 to-orange-500',
        textGradient: 'from-amber-400 to-orange-500',
        borderColor: 'border-amber-400/50',
        glowColor: 'shadow-amber-400/30',
    },
    6: {
        color: 'text-rose-400',
        gradient: 'from-rose-400 via-pink-500 to-fuchsia-500',
        textGradient: 'from-rose-400 via-pink-500 to-fuchsia-500',
        borderColor: 'border-rose-400/50',
        glowColor: 'shadow-rose-500/40',
    },
}

// 默认回退等级配置（与 DB vip_level_config 表同步）
const DEFAULT_VIP_LEVELS: VipLevelInfo[] = [
    { level: 1, name: 'V1', title: '学术新星', minSpent: 0, ...LEVEL_STYLES[1] },
    { level: 2, name: 'V2', title: '学术探索者', minSpent: 500, ...LEVEL_STYLES[2] },
    { level: 3, name: 'V3', title: '学术精英', minSpent: 2000, ...LEVEL_STYLES[3] },
    { level: 4, name: 'V4', title: '学术大师', minSpent: 5000, ...LEVEL_STYLES[4] },
    { level: 5, name: 'V5', title: '学术泰斗', minSpent: 15000, ...LEVEL_STYLES[5] },
    { level: 6, name: 'V6', title: '学术至尊', minSpent: 50000, ...LEVEL_STYLES[6] },
]

// 缓存从 DB 加载的配置
let _cachedLevels: VipLevelInfo[] | null = null
let _cacheTimestamp: number = 0
const CACHE_TTL = 5 * 60 * 1000 // 5 分钟缓存

/**
 * 从数据库加载 VIP 等级配置（客户端用，通过 Supabase client）
 * 服务端组件使用 getVipLevelConfig 直接查询
 */
export async function loadVipLevelsFromDB(): Promise<VipLevelInfo[]> {
    const now = Date.now()
    if (_cachedLevels && (now - _cacheTimestamp) < CACHE_TTL) {
        return _cachedLevels
    }

    try {
        // 动态导入避免服务端组件问题
        const { createClient } = await import('@/lib/supabase/client')
        const supabase = createClient()
        const { data, error } = await supabase
            .from('vip_level_config')
            .select('level, name, title, min_spent, is_active')
            .eq('is_active', true)
            .order('level', { ascending: true })

        if (error || !data || data.length === 0) {
            return DEFAULT_VIP_LEVELS
        }

        const levels: VipLevelInfo[] = data.map((row) => ({
            level: row.level,
            name: row.name,
            title: row.title,
            minSpent: row.min_spent,
            ...(LEVEL_STYLES[row.level] ?? LEVEL_STYLES[1]),
        }))

        _cachedLevels = levels
        _cacheTimestamp = now
        return levels
    } catch {
        return DEFAULT_VIP_LEVELS
    }
}

/**
 * 同步获取 VIP 等级信息（使用缓存或默认值）
 * 适用于需要同步返回值的场景
 */
export function getVipLevels(): VipLevelInfo[] {
    return _cachedLevels ?? DEFAULT_VIP_LEVELS
}

/**
 * 为了兼容旧代码，保留 VIP_LEVELS 导出
 * 注意：这是默认值，管理后台修改后需要 loadVipLevelsFromDB() 刷新
 */
export const VIP_LEVELS: VipLevelInfo[] = DEFAULT_VIP_LEVELS

/**
 * 根据等级数字 (1-6) 直接获取 VIP 等级信息
 * 这是推荐的方式：直接从数据库中读取 vip_level 字段来获取等级
 */
export function getVipLevelByNumber(level: number): VipLevelInfo {
    const levels = getVipLevels()
    return levels.find((l) => l.level === level) || levels[0]
}

/**
 * 根据累计消费积分获取 VIP 等级信息
 * @deprecated 建议使用 getVipLevelByNumber，直接从数据库读取等级
 */
export function getVipLevel(totalSpent: number): VipLevelInfo {
    const levels = getVipLevels()
    let result = levels[0]
    for (const lvl of levels) {
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
    const levels = getVipLevels()
    const current = levels.find((l) => l.level === currentLevel) || levels[0]
    const nextIndex = levels.findIndex((l) => l.level === current.level) + 1
    const next = nextIndex < levels.length ? levels[nextIndex] : null

    if (!next) {
        return { current, next: null, progress: 100, remaining: 0 }
    }

    const range = next.minSpent - current.minSpent
    const done = Math.max(0, totalSpent - current.minSpent)
    const progress = Math.min(100, Math.round((done / range) * 100))
    const remaining = Math.max(0, next.minSpent - Math.max(totalSpent, current.minSpent))
    return { current, next, progress, remaining }
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
    const levels = getVipLevels()
    const current = getVipLevel(totalSpent)
    const nextIndex = levels.findIndex((l) => l.level === current.level) + 1
    const next = nextIndex < levels.length ? levels[nextIndex] : null

    if (!next) {
        return { current, next: null, progress: 100, remaining: 0 }
    }

    const range = next.minSpent - current.minSpent
    const done = totalSpent - current.minSpent
    const progress = Math.min(100, Math.round((done / range) * 100))
    return { current, next, progress, remaining: next.minSpent - totalSpent }
}

/**
 * 清除 VIP 等级缓存（管理后台修改后调用）
 */
export function invalidateVipCache() {
    _cachedLevels = null
    _cacheTimestamp = 0
}
