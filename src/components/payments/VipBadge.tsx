'use client'

import { getVipLevel } from '@/lib/vip-utils'
import { motion } from 'framer-motion'
import { VipIconV1, VipIconV2, VipIconV3, VipIconV4, VipIconV5, VipIconV6 } from './VipIcons'

interface VipBadgeProps {
    totalSpent: number
    size?: 'sm' | 'md' | 'lg'
    showTitle?: boolean
    className?: string
}

const sizeConfig = {
    sm: {
        container: 'h-5 px-1.5 gap-0.5 text-[10px]',
        iconSize: 12,
        title: 'text-[10px]',
    },
    md: {
        container: 'h-6 px-2 gap-1 text-xs',
        iconSize: 14,
        title: 'text-xs',
    },
    lg: {
        container: 'h-8 px-3 gap-1.5 text-sm',
        iconSize: 16,
        title: 'text-sm',
    },
}

export function VipBadge({ totalSpent, size = 'sm', showTitle = false, className = '' }: VipBadgeProps) {
    const level = getVipLevel(totalSpent)
    const config = sizeConfig[size]

    // 选择对应的 VIP 图标组件
    const IconComponent = {
        1: VipIconV1,
        2: VipIconV2,
        3: VipIconV3,
        4: VipIconV4,
        5: VipIconV5,
        6: VipIconV6,
    }[level.level] || VipIconV1

    return (
        <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            whileHover={{ scale: 1.05 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className={`relative inline-flex items-center rounded-full font-bold overflow-hidden
        bg-gradient-to-r ${level.gradient} text-white
        shadow-lg ${level.glowColor} border border-white/20
        ${config.container} ${className}`}
        >
            <IconComponent size={config.iconSize} />
            <span className="relative z-10 drop-shadow-sm">{level.name}</span>
            {showTitle && (
                <span className={`font-medium opacity-90 drop-shadow-sm ml-0.5 ${config.title}`}>
                    {level.title}
                </span>
            )}

            {/* 基础微光动画 */}
            {level.level >= 3 && (
                <motion.div
                    className="absolute inset-0 bg-white/20"
                    animate={{ opacity: [0, 0.3, 0] }}
                    transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
                />
            )}

            {/* 高等级专属金属扫光特效 (伪元素替代方案) */}
            {level.level >= 4 && (
                <motion.div
                    className="absolute inset-0 -translate-x-[150%] skew-x-[-20deg] bg-gradient-to-r from-transparent via-white/40 to-transparent w-[150%]"
                    animate={{ translateX: ['-100%', '200%'] }}
                    transition={{
                        repeat: Infinity,
                        duration: level.level === 6 ? 2.5 : 4,
                        repeatDelay: 1,
                        ease: 'easeInOut'
                    }}
                />
            )}
        </motion.div>
    )
}
