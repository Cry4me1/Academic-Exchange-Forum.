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

// 辅助函数：从 LaTeX 中解析出未定义的非常规参数，以便自动为 Desmos 创建默认滑块值使图像能够绘制出来
function extractParameters(latex: string, funcName: string | null) {
  const params = new Set<string>();

  // 1. 查找希腊字母参数 (如 \sigma, \mu, \alpha 等)
  const greekRegex = /\\(sigma|mu|alpha|beta|gamma|lambda|omega|phi|psi|delta)\b/g;
  let match;
  while ((match = greekRegex.exec(latex)) !== null) {
    params.add(match[0]);
  }

  // 2. 查找普通英文字母参数 (单个字母，排除 x, y, t, e)
  // 我们先通过正则把所有以 \ 开头的 LaTeX 命令暂时替换掉，防止误判命令内的字母 (如 \frac 中的 f, r, a, c)
  const cleanLatex = latex.replace(/\\[a-zA-Z]+/g, " ");

  // 匹配单个英文字母 (排除 e, x, y, t)
  const letterRegex = /\b([a-df-wzAD-Z])\b/g;
  while ((match = letterRegex.exec(cleanLatex)) !== null) {
    const char = match[1];
    // 排除被定义的函数名本身 (例如 f(x) 中的 f)
    if (funcName && char.toLowerCase() === funcName.toLowerCase()) {
      continue;
    }
    params.add(char);
  }

  return Array.from(params);
}

// 1. 函数表达式整理 (只用于绘图)
// 严格判断公式是否为 Desmos 可绘制的函数，减少误判
export const checkIsFunction = (latex: string) => {
  const trimmed = latex.trim();
  const clean = trimmed.replace(/^\$+|\$+$/g, "").trim();
  const lower = clean.toLowerCase();

  // 过短的公式不太可能是可绘制函数 (如单独的 x, y, t)
  if (clean.length < 3) return { isFunc: false, desmosLatex: "" };

  // ── 排除列表：不属于可绘制函数的数学结构 ──
  const invalidKeywords = [
    // 微积分限制 (允许 \sum, \prod, \int, \frac{d 因为 Desmos 支持它们)
    "\\lim", "\\limsup", "\\liminf",
    "\\partial", "\\nabla", "\\delta",
    // 矩阵 / 向量
    "\\matrix", "\\bmatrix", "\\pmatrix", "\\vmatrix", "\\begin{array}",
    "\\vec", "\\hat", "\\mathbf",
    // 集合 / 逻辑
    "\\in", "\\notin", "\\subset", "\\subseteq", "\\supset", "\\cup", "\\cap",
    "\\forall", "\\exists", "\\nexists", "\\implies", "\\iff",
    "\\land", "\\lor", "\\neg", "\\vee", "\\wedge",
    // 比较 / 近似 / 不等式 (除 = 外)
    "\\approx", "\\neq", "\\equiv", "\\sim", "\\cong", "\\propto",
    "\\ge", "\\le", "\\gg", "\\ll",
    // 组合数学 / 排列
    "\\binom", "\\choose", "\\perm",
    // 概率 / 统计
    "\\mathbb{p}", "\\mathbb{e}", "\\var", "\\cov", "\\operatorname{p}",
    // 文本与注释
    "\\text{", "\\mathrm{", "\\textbf{",
    // 其他不可绘制结构
    "\\begin{", "\\end{", "\\cases",
    "\\cdots", "\\ldots", "\\vdots", "\\ddots",
    "\\overset", "\\underset", "\\stackrel",
  ];
  if (invalidKeywords.some(kw => lower.includes(kw))) {
    return { isFunc: false, desmosLatex: "" };
  }

  // 排除包含比较符号（除了等号赋值）的表达式
  if (/>(?!=)/.test(clean) || /<(?!=)/.test(clean)) {
    return { isFunc: false, desmosLatex: "" };
  }

  // ── 正向匹配：判断是否为可绘制的函数形式 ──

  // 模式 1: 显式函数定义 y = ..., f(x) = ..., r = ...(极坐标)
  const explicitFuncPattern = /^(y|f\s*\(.*?\)|g\s*\(.*?\)|h\s*\(.*?\)|r)\s*=/i;
  if (explicitFuncPattern.test(clean)) {
    return { isFunc: true, desmosLatex: clean };
  }

  // 模式 2: 隐式方程中包含变量关系 (如 x^2 + y^2 = 1)
  if (clean.includes("=") && /x/i.test(clean) && /y/i.test(clean)) {
    return { isFunc: true, desmosLatex: clean };
  }

  // 模式 3: 常见数学函数作用于变量 x（或 \theta）
  const mathFunctions = [
    "\\sin", "\\cos", "\\tan", "\\cot", "\\sec", "\\csc",
    "\\arcsin", "\\arccos", "\\arctan",
    "\\sinh", "\\cosh", "\\tanh",
    "\\ln", "\\log", "\\lg",
    "\\sqrt", "\\exp", "\\abs",
  ];
  const hasMathFunc = mathFunctions.some(fn => lower.includes(fn));
  const hasX = /(?<!\\te)x(?!t)/i.test(clean); // 排除 \text 中的 x
  if (hasMathFunc && hasX) {
    return { isFunc: true, desmosLatex: `y = ${clean}` };
  }

  // 模式 4: x 的幂运算表达式 (如 x^2, x^{3}, 2x^2 + 3x - 1)
  const polyPattern = /x\s*\^/i;
  if (polyPattern.test(clean) && hasX) {
    // 确保不只是出现在下标等位置
    const operatorPattern = /[+\-*/^]/;
    if (operatorPattern.test(clean) || /^\s*x\s*\^/.test(clean)) {
      if (clean.includes("=")) {
        return { isFunc: true, desmosLatex: clean };
      }
      return { isFunc: true, desmosLatex: `y = ${clean}` };
    }
  }

  // 模式 5: 参数方程 / 极坐标 (包含 \theta 或 t 且有三角函数)
  const hasTheta = lower.includes("\\theta");
  if (hasTheta && hasMathFunc) {
    return { isFunc: true, desmosLatex: clean.includes("=") ? clean : `r = ${clean}` };
  }

  // 默认不匹配 — 不显示绘制按钮
  return { isFunc: false, desmosLatex: "" };
};

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

        // 识别并提取公式中除自变量之外的未知参数 (如 \sigma, \mu, a, b)
        // 从而自动创建滑块默认值，防止由于未定义变量导致 Desmos 无法画图
        const funcNameMatch = desmosLatex.trim().match(/^(f|g|h)\s*\(.*?\)\s*=/i);
        const funcName = funcNameMatch ? funcNameMatch[1] : null;
        const params = extractParameters(desmosLatex, funcName);

        // 为每一个参数初始化默认值。对于 \sigma (标准差) 等系数不能为 0，我们默认都设为 1；而对于 \mu (均值) 这种平移参数，默认设为 0 以使其居中显示在坐标系原点。
        params.forEach((param, idx) => {
          const defaultValue = param === "\\mu" ? "0" : "1";
          calc.setExpression({
            id: `param-slider-${idx}`,
            latex: `${param} = ${defaultValue}`,
          });
        });
        
        // 动画边界使用 a_{anim} 以防和公式里的自设参数 a 碰撞
        calc.setExpression({
          id: "param-anim-a",
          latex: `a_{anim} = ${xMin}`,
        });

        calc.setExpression({
          id: "main-graph",
          latex: `${desmosLatex} \\left\\{ x \\le a_{anim} \\right\\}`,
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
            id: "param-anim-a",
            latex: `a_{anim} = ${currentA}`,
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
            calc.removeExpression({ id: "param-anim-a" });
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
