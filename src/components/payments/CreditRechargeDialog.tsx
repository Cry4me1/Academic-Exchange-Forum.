'use client'

import { purchaseCredits } from '@/app/(protected)/credits/actions'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import confetti from 'canvas-confetti'
import { motion } from 'framer-motion'
import { Check, Cpu, Sparkles, Zap } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

interface PricingPlan {
    id: string
    name: string
    price: number // 实付人民币金额
    credits: number // 获得积分
    bonus: number // 赠送积分
    icon: React.ReactNode
    popular?: boolean
    gradient: string
}

const plans: PricingPlan[] = [
    {
        id: 'basic',
        name: '基础包',
        price: 10,
        credits: 100,
        bonus: 0,
        icon: <Zap className="w-5 h-5" />,
        gradient: 'from-blue-500/20 to-cyan-500/20',
    },
    {
        id: 'pro',
        name: '进阶包',
        price: 50,
        credits: 550,
        bonus: 50,
        icon: <Sparkles className="w-5 h-5" />,
        popular: true,
        gradient: 'from-purple-500/20 to-pink-500/20',
    },
    {
        id: 'scholar',
        name: '学术探索包',
        price: 100,
        credits: 1200,
        bonus: 200,
        icon: <Cpu className="w-5 h-5" />,
        gradient: 'from-amber-500/20 to-orange-500/20',
    },
]

export function CreditRechargeDialog({
    isOpen,
    onOpenChange,
}: {
    isOpen: boolean
    onOpenChange: (open: boolean) => void
}) {
    const [selectedPlan, setSelectedPlan] = useState<string>('pro')
    const [isLoading, setIsLoading] = useState(false)
    const [showTerms, setShowTerms] = useState(false)

    const handlePurchase = async () => {
        setIsLoading(true)

        try {
            const result = await purchaseCredits(selectedPlan)

            if (result.error) {
                toast.error(result.error)
                setIsLoading(false)
                return
            }

            // 购买成功
            toast.success(`购买成功！当前余额: ${result.newBalance?.toLocaleString()} 积分`)
            confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#8b5cf6', '#d946ef', '#f59e0b', '#3b82f6'],
            })
            onOpenChange(false)
        } catch (err) {
            toast.error('购买失败，请稍后重试')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[700px] border-none bg-zinc-950 text-white p-0 overflow-hidden rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.5)]">

                {/* 顶部绚丽背景光晕 */}
                <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-purple-600/30 to-transparent -z-10 blur-3xl pointer-events-none" />

                <div className="p-8">
                    <DialogHeader className="mb-8">
                        <DialogTitle className="text-3xl font-bold flex items-center gap-2 text-white">
                            <Sparkles className="text-purple-400 w-6 h-6" />
                            升级你的学术探索
                        </DialogTitle>
                        <DialogDescription className="text-zinc-400 text-base mt-2">
                            获取信用积分以使用 Ask AI 的进阶数据分析、论文解析及长文本推理能力。
                            新用户首月专享 100 积分赠送。
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {plans.map((plan) => (
                            <motion.div
                                whileHover={{ y: -4 }}
                                whileTap={{ scale: 0.98 }}
                                key={plan.id}
                                onClick={() => setSelectedPlan(plan.id)}
                                className={`relative cursor-pointer rounded-xl border-2 transition-all duration-300 p-5 overflow-hidden
                  ${selectedPlan === plan.id
                                        ? 'border-purple-500 bg-purple-500/10 shadow-[0_0_20px_rgba(168,85,247,0.3)]'
                                        : 'border-zinc-800 bg-zinc-900/50 hover:border-zinc-600'
                                    }`}
                            >
                                {/* 选中态渐变底色 */}
                                <div className={`absolute inset-0 bg-gradient-to-br ${plan.gradient} opacity-50 pointer-events-none`} />

                                {plan.popular && (
                                    <div className="absolute top-0 right-0 bg-gradient-to-r from-purple-500 to-pink-500 text-xs font-bold px-3 py-1 rounded-bl-lg">
                                        最受欢迎
                                    </div>
                                )}

                                <div className="relative z-10 flex flex-col h-full">
                                    <div className="flex items-center gap-2 mb-2 text-zinc-200">
                                        <span className="text-purple-400">{plan.icon}</span>
                                        <span className="font-semibold">{plan.name}</span>
                                    </div>

                                    <div className="mt-2 mb-4">
                                        <span className="text-3xl font-bold">¥{plan.price}</span>
                                    </div>

                                    <div className="flex-1">
                                        <div className="text-xl font-bold text-white mb-1">
                                            {plan.credits} 积分
                                        </div>
                                        {plan.bonus > 0 && (
                                            <div className="text-sm font-medium text-purple-400">
                                                包含赠送的 {plan.bonus} 积分
                                            </div>
                                        )}
                                    </div>

                                    {/* 选中的标识圈 */}
                                    <div className={`mt-4 w-6 h-6 rounded-full flex items-center justify-center border-2 
                    ${selectedPlan === plan.id ? 'border-purple-500 bg-purple-500' : 'border-zinc-600'}`}>
                                        {selectedPlan === plan.id && <Check className="w-4 h-4 text-white" />}
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* 使用条款 */}
                    <div className="mt-6 border-t border-zinc-800/60 pt-4">
                        <button
                            type="button"
                            onClick={() => setShowTerms(!showTerms)}
                            className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors flex items-center gap-1 cursor-pointer"
                        >
                            <span>Scholarly 积分服务使用条款</span>
                            <motion.span
                                animate={{ rotate: showTerms ? 180 : 0 }}
                                transition={{ duration: 0.2 }}
                                className="inline-block"
                            >▾</motion.span>
                        </button>

                        {showTerms && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="mt-3 text-[11px] text-zinc-600 leading-relaxed space-y-2 max-h-40 overflow-y-auto pr-2 scrollbar-thin"
                            >
                                <p><strong className="text-zinc-400">1. 积分有效期：</strong>积分自充值日起 365 天内有效，到期未使用将自动失效。赠送积分不可转让、不可提现。</p>
                                <p><strong className="text-zinc-400">2. 退款政策：</strong>已购买的积分仅在购买后 7 天内且未使用的情况下支持退款，退款将原路返回支付账户，处理时间为 3-5 个工作日。</p>
                                <p><strong className="text-zinc-400">3. 使用规范：</strong>积分仅限用于 Scholarly 平台 Ask AI 功能调用，不可用于其他平台或服务。严禁利用 AI 功能生成违法违规内容。</p>
                                <p><strong className="text-zinc-400">4. 服务调整：</strong>Scholarly 保留根据运营需要调整积分价格、兑换比例及服务内容的权利，调整前将提前 15 天通知用户。</p>
                                <p><strong className="text-zinc-400">5. 隐私保护：</strong>我们严格保护您的支付信息与使用记录，详见《隐私政策》。您的 AI 对话内容不会用于训练模型。</p>
                                <p><strong className="text-zinc-400">6. 免责声明：</strong>AI 生成内容仅供参考，不构成专业学术建议。用户应自行验证 AI 输出的准确性和完整性。</p>
                            </motion.div>
                        )}
                    </div>

                    <div className="mt-4 flex items-center gap-4 justify-between">
                        <p className="text-xs text-zinc-500 leading-relaxed max-w-[400px]">
                            1 人民币 = 10 积分。支持支付宝支付。
                            <br />购买即视为同意上述使用条款。
                        </p>
                        <Button
                            disabled={true}
                            className="bg-zinc-700 text-zinc-400 border-none min-w-[120px] h-11 text-base font-medium cursor-not-allowed opacity-70"
                        >
                            支付功能即将上线
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
