"use client";

import { useEffect, useRef, useState, useId } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LineChart, X, RotateCcw, Loader2 } from "lucide-react";

interface MathViewerComponentProps {
  content: string; // 传进来的 LaTeX 公式，可能包含 $
}

// 动态脚本加载状态池，避免重复向 DOM 插入 script 标签
let desmosLoadingPromise: Promise<void> | null = null;
function loadDesmosAPI(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if ((window as any).Desmos) return Promise.resolve();

  if (!desmosLoadingPromise) {
    desmosLoadingPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://www.desmos.com/api/v1.9/calculator.js?apiKey=dcb31709b452b1cf9dc26972add0fda6";
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => {
        desmosLoadingPromise = null;
        reject(new Error("Failed to load Desmos API"));
      };
      document.body.appendChild(script);
    });
  }

  return desmosLoadingPromise;
}

export default function MathViewerComponent({ content }: MathViewerComponentProps) {
  const calculatorRef = useRef<HTMLDivElement>(null);
  const calculatorInstance = useRef<any>(null);
  const animationFrameRef = useRef<number | null>(null);

  const [isOpen, setIsOpen] = useState(false);
  const [isDesmosLoaded, setIsDesmosLoaded] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uniqueId = useId();
  const cleanId = uniqueId.replace(/[^a-zA-Z0-9]/g, "-");
  const calculatorId = `desmos-calc-${cleanId}`;

  // 1. 函数表达式整理 (只用于绘图)
  const checkIsFunction = (latex: string) => {
    const trimmed = latex.trim();
    const clean = trimmed.replace(/^\$+|\$+$/g, "").trim();
    const lower = clean.toLowerCase();

    const hasXOrTheta = lower.includes("x") || lower.includes("\\theta") || lower.includes("t") || lower.includes("y");
    if (!hasXOrTheta) return { isFunc: false, desmosLatex: "" };

    const invalidKeywords = ["\\sum", "\\int", "\\lim", "\\matrix", "\\frac{d}{dx}", "\\approx", ">", "<", "\\ge", "\\le"];
    const hasInvalid = invalidKeywords.some(keyword => lower.includes(keyword));
    if (hasInvalid) return { isFunc: false, desmosLatex: "" };

    if (clean.includes("=")) {
      return { isFunc: true, desmosLatex: clean };
    } else {
      return { isFunc: true, desmosLatex: `y = ${clean}` };
    }
  };

  const { isFunc, desmosLatex } = checkIsFunction(content);

  // 2. 初始化 Desmos 并执行渐现动画
  const initDesmosAndAnimate = async () => {
    try {
      setError(null);
      await loadDesmosAPI();
      setIsDesmosLoaded(true);

      setTimeout(() => {
        if (!calculatorRef.current) return;

        if (calculatorInstance.current) {
          calculatorInstance.current.destroy();
        }

        const Desmos = (window as any).Desmos;
        if (!Desmos) {
          setError("Desmos 引擎加载失败，请刷新重试");
          return;
        }

        const calc = Desmos.GraphingCalculator(calculatorRef.current, {
          keypad: false,
          expressions: false,
          settingsMenu: false,
          zoomButtons: true,
          expressionsCollapsed: true,
        });

        calculatorInstance.current = calc;

        // 默认坐标区间
        calc.setViewport([-10, 10, -6, 6]);

        const bounds = calc.graphpaperBounds;
        const xMin = bounds?.mathCoordinates?.left ?? -10;
        const xMax = bounds?.mathCoordinates?.right ?? 10;

        setIsDrawing(true);
        
        calc.setExpression({
          id: "param-a",
          latex: `a = ${xMin}`,
        });

        calc.setExpression({
          id: "main-graph",
          latex: `${desmosLatex} \\left\\{ x \\le a \\right\\}`,
          color: "#3b82f6",
          lineWidth: 3,
        });

        const duration = 1500;
        const startTime = performance.now();

        const runAnimation = (now: number) => {
          const elapsed = now - startTime;
          const progress = Math.min(elapsed / duration, 1);
          
          const currentA = xMin + (xMax - xMin) * progress;

          calc.setExpression({
            id: "param-a",
            latex: `a = ${currentA}`,
          });

          if (progress < 1) {
            animationFrameRef.current = requestAnimationFrame(runAnimation);
          } else {
            calc.setExpression({
              id: "main-graph",
              latex: desmosLatex,
              color: "#3b82f6",
              lineWidth: 3,
            });
            calc.removeExpression({ id: "param-a" });
            setIsDrawing(false);
          }
        };

        animationFrameRef.current = requestAnimationFrame(runAnimation);
      }, 100);

    } catch (err) {
      console.error(err);
      setError("无法加载 Desmos 画图面板");
    }
  };

  const handleToggle = () => {
    if (!isOpen) {
      setIsOpen(true);
      initDesmosAndAnimate();
    } else {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (calculatorInstance.current) {
        calculatorInstance.current.destroy();
        calculatorInstance.current = null;
      }
      setIsOpen(false);
      setIsDesmosLoaded(false);
    }
  };

  const handleReset = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    initDesmosAndAnimate();
  };

  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (calculatorInstance.current) {
        calculatorInstance.current.destroy();
      }
    };
  }, []);

  if (!isFunc) return null;

  return (
    <span className="inline-flex items-center relative select-none">
      {/* 绘制图像小药丸按钮 */}
      <button
        onClick={handleToggle}
        type="button"
        className={`inline-flex items-center gap-1 ml-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold cursor-pointer transition-all duration-300 select-none align-middle border shadow-xs
          ${
            isOpen
              ? "bg-primary text-primary-foreground border-primary scale-95"
              : "bg-secondary hover:bg-primary hover:text-primary-foreground text-secondary-foreground border-border hover:border-primary"
          }`}
        title={isOpen ? "收起函数图像" : "在文内展开 Desmos 函数图像"}
      >
        <LineChart className={`h-3 w-3 ${isDrawing ? "animate-pulse" : ""}`} />
        <span>{isOpen ? "收起" : "绘制"}</span>
      </button>

      {/* 动画窗格（在 DOM 中呈现为一个绝对或相对的块级自适应区域，上下整出空位） */}
      <AnimatePresence>
        {isOpen && (
          <motion.span
            initial={{ height: 0, opacity: 0, margin: "0px 0" }}
            animate={{ height: "auto", opacity: 1, margin: "16px 0" }}
            exit={{ height: 0, opacity: 0, margin: "0px 0" }}
            transition={{ duration: 0.35, ease: "easeInOut" }}
            className="block w-full overflow-hidden absolute left-0 right-0 z-30"
            style={{
              position: "relative",
              width: "100%",
              clear: "both"
            }}
          >
            <span className="block w-full rounded-xl border border-border bg-card shadow-lg dark:shadow-black/40 p-4 relative overflow-hidden">
              {/* 控制栏 */}
              <span className="flex items-center justify-between mb-3 border-b border-border/60 pb-2">
                <span className="flex items-center gap-2 text-xs font-semibold text-muted-foreground select-none">
                  <LineChart className="h-3.5 w-3.5 text-blue-500" />
                  <span>Desmos 函数图像：</span>
                  <code className="bg-muted px-1.5 py-0.5 rounded font-mono text-foreground text-[11px]">
                    {content.replace(/^\$+|\$+$/g, "")}
                  </code>
                </span>
                <span className="flex items-center gap-1">
                  <button
                    onClick={handleReset}
                    type="button"
                    disabled={isDrawing || !isDesmosLoaded}
                    className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-50"
                    title="重新绘制图像"
                  >
                    <RotateCcw className={`h-3.5 w-3.5 ${isDrawing ? "animate-spin" : ""}`} />
                  </button>
                  <button
                    onClick={handleToggle}
                    type="button"
                    className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                    title="收起窗格"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </span>
              </span>

              {/* 画板容器 */}
              <span className="block relative w-full h-[280px] bg-muted/30 rounded-lg overflow-hidden border border-border/40">
                {!isDesmosLoaded && !error && (
                  <span className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-muted-foreground bg-card/60 backdrop-blur-sm z-10">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    <span className="text-xs font-medium">正在初始化数学计算器...</span>
                  </span>
                )}

                {error && (
                  <span className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center text-destructive bg-destructive/5 backdrop-blur-xs z-10">
                    <span className="text-sm font-semibold mb-1">加载失败</span>
                    <span className="text-xs text-muted-foreground">{error}</span>
                  </span>
                )}

                <span
                  id={calculatorId}
                  ref={calculatorRef}
                  className="block w-full h-full"
                  style={{ minHeight: "280px" }}
                />
              </span>
            </span>
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  );
}
