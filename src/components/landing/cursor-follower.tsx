"use client";

import { useEffect, useRef } from "react";

export function CursorFollower() {
    const dotRef = useRef<HTMLDivElement | null>(null);
    const fluidBlobRef = useRef<HTMLDivElement | null>(null);
    const haloRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        const dot = dotRef.current;
        const fluidBlob = fluidBlobRef.current;
        const halo = haloRef.current;
        if (!dot || !fluidBlob || !halo) return;

        // 鼠标目标坐标
        let mouseX = -100;
        let mouseY = -100;
        let prevMouseX = -100;
        let prevMouseY = -100;

        // 水流质心平滑阻尼坐标 (超大流动惯性)
        let blobX = -100;
        let blobY = -100;

        // 运动学与水波状态
        let currentAngle = 0;
        let isHovered = false;
        let isVisible = false;
        let rafId: number | null = null;
        let isDestroyed = false;

        // 超大水动力学能量池与复合水波相位
        let waterEnergy = 0;
        let wavePhase1 = 0;
        let wavePhase2 = 0;

        // 8 维圆角水滴超大幅度动态形变值与速度
        let tl_x = 50, tr_x = 50, br_x = 50, bl_x = 50;
        let tl_y = 50, tr_y = 50, br_y = 50, bl_y = 50;

        let v_tl_x = 0, v_tr_x = 0, v_br_x = 0, v_bl_x = 0;
        let v_tl_y = 0, v_tr_y = 0, v_br_y = 0, v_bl_y = 0;

        const onMouseMove = (e: MouseEvent) => {
            mouseX = e.clientX;
            mouseY = e.clientY;

            if (!isVisible) {
                isVisible = true;
                if (dot) dot.style.opacity = "1";
                if (fluidBlob) fluidBlob.style.opacity = "1";
                if (halo) halo.style.opacity = "1";
            }

            // 核心准心点：1:1 绝对实时硬件同步，零延迟
            if (dot) {
                dot.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0px) translate(-50%, -50%)`;
            }

            // 悬停交互检测
            const target = e.target as HTMLElement | null;
            const interactive = Boolean(
                target && (
                    target.closest("button") ||
                    target.closest("a") ||
                    target.closest("[role='button']") ||
                    target.closest("input") ||
                    target.closest(".cursor-pointer") ||
                    target.closest(".group")
                )
            );

            isHovered = interactive;
        };

        const onMouseLeave = () => {
            isVisible = false;
            if (dot) dot.style.opacity = "0";
            if (fluidBlob) fluidBlob.style.opacity = "0";
            if (halo) halo.style.opacity = "0";
        };

        const onMouseEnter = () => {
            isVisible = true;
            if (dot) dot.style.opacity = "1";
            if (fluidBlob) fluidBlob.style.opacity = "1";
            if (halo) halo.style.opacity = "1";
        };

        window.addEventListener("mousemove", onMouseMove, { passive: true });
        document.addEventListener("mouseleave", onMouseLeave);
        document.addEventListener("mouseenter", onMouseEnter);

        // 超大水流动力学循环 (High-amplitude Liquid Deformation)
        const render = () => {
            if (isDestroyed) return;

            // 1. 水流质心跟随鼠标 (0.08 带来如长水银拖尾般的滞后感)
            blobX += (mouseX - blobX) * 0.08;
            blobY += (mouseY - blobY) * 0.08;

            // 2. 即时物理速度
            const deltaX = mouseX - prevMouseX;
            const deltaY = mouseY - prevMouseY;
            const speed = Math.min(Math.sqrt(deltaX * deltaX + deltaY * deltaY), 110);

            prevMouseX = mouseX;
            prevMouseY = mouseY;

            // 3. 运动方向柔顺旋转 (高速流动时跟随切线)
            if (speed > 0.5) {
                const targetAngle = Math.atan2(deltaY, deltaX) * (180 / Math.PI);
                let diff = (targetAngle - currentAngle) % 360;
                if (diff < -180) diff += 360;
                if (diff > 180) diff -= 360;
                currentAngle += diff * 0.18;
            }

            // 4. 水流动能激发 (无封顶强力激发)
            waterEnergy = waterEnergy * 0.95 + speed * 0.11;
            wavePhase1 += 0.16;
            wavePhase2 += 0.26;

            // 5. 尺寸与超大幅度水滴流线型拉伸 (最高拉长 2.6 倍！)
            const targetSize = isHovered ? 76 : 56;
            const haloSize = isHovered ? 165 : 135;

            // 彻底放开拉伸上限：scaleX 显著拉长，scaleY 剧烈收窄
            const streamSquish = Math.min(waterEnergy * 0.016, 1.25);
            const scaleX = 1 + streamSquish * 1.5;
            const scaleY = Math.max(0.38, 1 - streamSquish * 0.52);

            // 6. 8 维圆角超大有机波浪形变 (deform 上限拉至 95，波浪振幅拉满)
            const deform = Math.min(waterEnergy * 1.8, 95);
            const wave1 = Math.sin(wavePhase1) * Math.min(waterEnergy * 0.8, 36);
            const wave2 = Math.cos(wavePhase2) * Math.min(waterEnergy * 0.6, 26);
            const combinedWave = wave1 + wave2;

            // 极度明显的水滴流线型 (前端饱满大圆头，尾端收尖长拖尾)
            const target_tl_x = 50 + deform * 1.8 + combinedWave;
            const target_tr_x = 50 - deform * 1.4 - wave1;
            const target_br_x = 50 + deform * 1.6 - combinedWave;
            const target_bl_x = 50 - deform * 1.7 + wave2;

            const target_tl_y = 50 - deform * 1.6 - wave2;
            const target_tr_y = 50 + deform * 1.7 + combinedWave;
            const target_br_y = 50 - deform * 1.8 - wave1;
            const target_bl_y = 50 + deform * 1.5 + combinedWave;

            // 柔性表面张力弹簧系统 (停下后优雅荡漾收缩为圆)
            const kWaterSpring = 0.05;
            const waterDamping = 0.85;

            v_tl_x = (v_tl_x + (target_tl_x - tl_x) * kWaterSpring) * waterDamping;
            v_tr_x = (v_tr_x + (target_tr_x - tr_x) * kWaterSpring) * waterDamping;
            v_br_x = (v_br_x + (target_br_x - br_x) * kWaterSpring) * waterDamping;
            v_bl_x = (v_bl_x + (target_bl_x - bl_x) * kWaterSpring) * waterDamping;

            v_tl_y = (v_tl_y + (target_tl_y - tl_y) * kWaterSpring) * waterDamping;
            v_tr_y = (v_tr_y + (target_tr_y - tr_y) * kWaterSpring) * waterDamping;
            v_br_y = (v_br_y + (target_br_y - br_y) * kWaterSpring) * waterDamping;
            v_bl_y = (v_bl_y + (target_bl_y - bl_y) * kWaterSpring) * waterDamping;

            tl_x += v_tl_x;
            tr_x += v_tr_x;
            br_x += v_br_x;
            bl_x += v_bl_x;

            tl_y += v_tl_y;
            tr_y += v_tr_y;
            br_y += v_br_y;
            bl_y += v_bl_y;

            // 7. GPU 合成层满帧渲染
            if (fluidBlob) {
                fluidBlob.style.width = `${targetSize}px`;
                fluidBlob.style.height = `${targetSize}px`;
                fluidBlob.style.borderRadius = `${Math.max(10, Math.min(90, tl_x)).toFixed(1)}% ${Math.max(10, Math.min(90, tr_x)).toFixed(1)}% ${Math.max(10, Math.min(90, br_x)).toFixed(1)}% ${Math.max(10, Math.min(90, bl_x)).toFixed(1)}% / ${Math.max(10, Math.min(90, tl_y)).toFixed(1)}% ${Math.max(10, Math.min(90, tr_y)).toFixed(1)}% ${Math.max(10, Math.min(90, br_y)).toFixed(1)}% ${Math.max(10, Math.min(90, bl_y)).toFixed(1)}%`;
                fluidBlob.style.transform = `
                    translate3d(${blobX}px, ${blobY}px, 0px)
                    translate(-50%, -50%)
                    rotate(${currentAngle.toFixed(1)}deg)
                    scale(${scaleX.toFixed(3)}, ${scaleY.toFixed(3)})
                `;
            }

            // 8. 最外围柔和浅橙光晕
            if (halo) {
                halo.style.width = `${haloSize}px`;
                halo.style.height = `${haloSize}px`;
                halo.style.transform = `translate3d(${blobX}px, ${blobY}px, 0px) translate(-50%, -50%)`;
            }

            rafId = requestAnimationFrame(render);
        };

        rafId = requestAnimationFrame(render);

        return () => {
            isDestroyed = true;
            if (rafId !== null) {
                cancelAnimationFrame(rafId);
            }
            window.removeEventListener("mousemove", onMouseMove);
            document.removeEventListener("mouseleave", onMouseLeave);
            document.removeEventListener("mouseenter", onMouseEnter);
        };
    }, []);

    return (
        <div className="pointer-events-none fixed inset-0 z-[99999] overflow-hidden select-none">
            {/* === 1. 最外围：浅橙色柔和漫射环境光晕 === */}
            <div
                ref={haloRef}
                className="absolute rounded-full pointer-events-none opacity-0 transition-[width,height] duration-200 ease-out"
                style={{
                    willChange: "transform, width, height",
                    background: "radial-gradient(circle, rgba(251, 146, 60, 0.32) 0%, rgba(249, 115, 22, 0.12) 45%, rgba(254, 215, 170, 0.04) 65%, transparent 75%)",
                    filter: "blur(18px)",
                }}
            />

            {/* === 2. 中间层：超大幅度剧烈流动水滴 (High-amplitude Liquid Glass) === */}
            <div
                ref={fluidBlobRef}
                className="absolute pointer-events-none opacity-0 transition-[width,height] duration-200 ease-out flex items-center justify-center overflow-hidden"
                style={{
                    willChange: "transform, border-radius",
                    backdropFilter: "blur(6px) saturate(190%) contrast(104%)",
                    WebkitBackdropFilter: "blur(6px) saturate(190%) contrast(104%)",
                    background: "linear-gradient(135deg, rgba(255, 255, 255, 0.38) 0%, rgba(255, 255, 255, 0.05) 45%, rgba(251, 146, 60, 0.12) 100%)",
                    boxShadow: `
                        inset 0 1.5px 2px 0px rgba(255, 255, 255, 0.95),
                        inset 0 0 0 1px rgba(255, 255, 255, 0.6),
                        inset 0 -2px 5px 0px rgba(249, 115, 22, 0.25),
                        0 8px 24px -2px rgba(249, 115, 22, 0.18)
                    `,
                }}
            >
                {/* 顶部高光弧面 */}
                <div 
                    className="absolute inset-x-0 top-0 h-[48%] pointer-events-none"
                    style={{
                        background: "radial-gradient(ellipse at 50% 0%, rgba(255, 255, 255, 0.85) 0%, rgba(255, 255, 255, 0.22) 45%, transparent 75%)",
                    }}
                />

                {/* 底部次表面暖橙反光 */}
                <div 
                    className="absolute inset-x-2 bottom-0 h-[32%] pointer-events-none opacity-75"
                    style={{
                        background: "radial-gradient(ellipse at 50% 100%, rgba(251, 146, 60, 0.4) 0%, transparent 80%)",
                    }}
                />
            </div>

            {/* === 3. 核心准心：纯白微核 + 橙色发光光环 (White & Orange Core Dot) === */}
            <div
                ref={dotRef}
                className="absolute w-2 h-2 rounded-full bg-white ring-2 ring-orange-500 pointer-events-none opacity-0 transition-opacity duration-150 shadow-[0_0_10px_rgba(249,115,22,1)]"
                style={{
                    willChange: "transform",
                }}
            />
        </div>
    );
}
