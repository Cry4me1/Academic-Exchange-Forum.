"use client";

import { useEffect, useRef } from "react";
import { useTheme } from "next-themes";

interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    radius: number;
    baseAlpha: number;
    color: string;
}

export function NeuralBackground() {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const { resolvedTheme } = useTheme();

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        let animationFrameId: number;
        let width = (canvas.width = window.innerWidth);
        let height = (canvas.height = window.innerHeight);

        const isDark = resolvedTheme === "dark";

        // 柔和优雅的学术粒子颜色
        const primaryColor = isDark ? "rgba(245, 158, 11, " : "rgba(234, 88, 12, ";
        const secondaryColor = isDark ? "rgba(168, 85, 247, " : "rgba(99, 102, 241, ";
        const lineColor = isDark ? "rgba(255, 255, 255, " : "rgba(30, 41, 59, ";

        // 自适应屏幕大小计算粒子数量
        const particleCount = Math.min(Math.floor((width * height) / 15000), 70);
        const particles: Particle[] = [];

        for (let i = 0; i < particleCount; i++) {
            particles.push({
                x: Math.random() * width,
                y: Math.random() * height,
                vx: (Math.random() - 0.5) * 0.35,
                vy: (Math.random() - 0.5) * 0.35,
                radius: Math.random() * 1.8 + 1.2,
                baseAlpha: Math.random() * 0.45 + 0.25,
                color: Math.random() > 0.45 ? primaryColor : secondaryColor,
            });
        }

        // 鼠标引力坐标
        const mouse = {
            x: -1000,
            y: -1000,
            radius: 170,
        };

        const handleMouseMove = (e: MouseEvent) => {
            const rect = canvas.getBoundingClientRect();
            mouse.x = e.clientX - rect.left;
            mouse.y = e.clientY - rect.top;
        };

        const handleMouseLeave = () => {
            mouse.x = -1000;
            mouse.y = -1000;
        };

        const handleResize = () => {
            if (!canvas) return;
            width = canvas.width = window.innerWidth;
            height = canvas.height = window.innerHeight;
        };

        window.addEventListener("resize", handleResize);
        window.addEventListener("mousemove", handleMouseMove);
        document.addEventListener("mouseleave", handleMouseLeave);

        const maxDistance = 140;

        const render = () => {
            ctx.clearRect(0, 0, width, height);

            // 绘制并更新粒子状态
            for (let i = 0; i < particles.length; i++) {
                const p = particles[i];

                // 鼠标引力反馈
                const dx = mouse.x - p.x;
                const dy = mouse.y - p.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < mouse.radius && dist > 0) {
                    const force = (1 - dist / mouse.radius) * 0.7;
                    p.x -= (dx / dist) * force;
                    p.y -= (dy / dist) * force;
                }

                // 自由漂移
                p.x += p.vx;
                p.y += p.vy;

                // 边界回弹
                if (p.x < 0 || p.x > width) p.vx *= -1;
                if (p.y < 0 || p.y > height) p.vy *= -1;

                // 绘制节点
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                ctx.fillStyle = `${p.color}${p.baseAlpha})`;
                ctx.fill();

                // 节点间知识网络连线
                for (let j = i + 1; j < particles.length; j++) {
                    const p2 = particles[j];
                    const distP = Math.hypot(p.x - p2.x, p.y - p2.y);

                    if (distP < maxDistance) {
                        const alpha = (1 - distP / maxDistance) * (isDark ? 0.14 : 0.08);
                        ctx.beginPath();
                        ctx.moveTo(p.x, p.y);
                        ctx.lineTo(p2.x, p2.y);
                        ctx.strokeStyle = `${lineColor}${alpha})`;
                        ctx.lineWidth = 0.75;
                        ctx.stroke();
                    }
                }

                // 节点与鼠标光标之间的微光连线
                if (dist < mouse.radius) {
                    const mouseAlpha = (1 - dist / mouse.radius) * (isDark ? 0.22 : 0.15);
                    ctx.beginPath();
                    ctx.moveTo(p.x, p.y);
                    ctx.lineTo(mouse.x, mouse.y);
                    ctx.strokeStyle = `${primaryColor}${mouseAlpha})`;
                    ctx.lineWidth = 0.9;
                    ctx.stroke();
                }
            }

            animationFrameId = requestAnimationFrame(render);
        };

        render();

        return () => {
            cancelAnimationFrame(animationFrameId);
            window.removeEventListener("resize", handleResize);
            window.removeEventListener("mousemove", handleMouseMove);
            document.removeEventListener("mouseleave", handleMouseLeave);
        };
    }, [resolvedTheme]);

    return (
        <canvas
            ref={canvasRef}
            className="absolute inset-0 pointer-events-none z-0 transition-opacity duration-700"
        />
    );
}
