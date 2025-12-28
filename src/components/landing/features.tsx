"use client";

import {
    BookOpen,
    Code2,
    MessageSquare,
    Users,
    Sigma,
    Lightbulb
} from "lucide-react";
import { motion } from "framer-motion";

const features = [
    {
        icon: MessageSquare,
        title: "学术讨论",
        description: "专注于严肃的学术话题交流，支持结构化的讨论与回复",
        gradient: "from-blue-500 to-cyan-500",
    },
    {
        icon: Sigma,
        title: "LaTeX 支持",
        description: "完美支持数学公式渲染，让复杂表达式清晰呈现",
        gradient: "from-purple-500 to-pink-500",
    },
    {
        icon: Code2,
        title: "代码高亮",
        description: "多语言语法高亮，分享代码更加直观优雅",
        gradient: "from-orange-500 to-red-500",
    },
    {
        icon: Users,
        title: "专家社区",
        description: "汇聚各领域学者专家，建立高质量学术圈子",
        gradient: "from-green-500 to-emerald-500",
    },
    {
        icon: BookOpen,
        title: "知识沉淀",
        description: "优质内容持久保存，构建个人学术资源库",
        gradient: "from-indigo-500 to-violet-500",
    },
    {
        icon: Lightbulb,
        title: "思想碰撞",
        description: "跨学科交流互动，激发创新灵感火花",
        gradient: "from-amber-500 to-orange-500",
    },
];

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1
        }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.6,
            ease: "easeOut" as const
        }
    }
};

export function Features() {
    return (
        <section className="py-24 px-6 bg-gradient-to-b from-slate-900 to-slate-950">
            <div className="max-w-6xl mx-auto">
                {/* 标题 */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-16"
                >
                    <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                        为学术而生的功能
                    </h2>
                    <p className="text-lg text-white/60 max-w-2xl mx-auto">
                        Scholarly 提供一系列专为学术交流设计的特性，助力知识传播与创新
                    </p>
                </motion.div>

                {/* 功能网格 */}
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-50px" }}
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                >
                    {features.map((feature) => (
                        <motion.div
                            key={feature.title}
                            variants={itemVariants}
                            className="group relative p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm hover:bg-white/10 hover:border-white/20 transition-all duration-300 hover:-translate-y-1"
                        >
                            {/* 图标 */}
                            <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${feature.gradient} mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                                <feature.icon className="w-6 h-6 text-white" />
                            </div>

                            {/* 标题 */}
                            <h3 className="text-xl font-semibold text-white mb-2">
                                {feature.title}
                            </h3>

                            {/* 描述 */}
                            <p className="text-white/60 leading-relaxed">
                                {feature.description}
                            </p>

                            {/* 悬停装饰 */}
                            <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
                        </motion.div>
                    ))}
                </motion.div>
            </div>
        </section>
    );
}
