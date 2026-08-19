import crypto from "crypto";

const CAPTCHA_SECRET =
  process.env.CAPTCHA_SECRET ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  "scholarly-secure-captcha-salt-2026";

// 验证码有效期：3 分钟
const CAPTCHA_EXPIRATION_MS = 3 * 60 * 1000;

// 防重放消费记录池（记录已使用的 nonce 与过期时间）
const usedNonces = new Map<string, number>();

// 定期清理过期的 nonce 记录（防止内存泄漏）
function cleanupNonces() {
  const now = Date.now();
  for (const [nonce, expireAt] of usedNonces.entries()) {
    if (now > expireAt) {
      usedNonces.delete(nonce);
    }
  }
}

// 每 2 分钟清理一次
if (typeof setInterval !== "undefined") {
  setInterval(cleanupNonces, 2 * 60 * 1000).unref?.();
}

export interface CaptchaGenerateResult {
  svg: string;
  token: string;
}

/**
 * 生成随机整数 [min, max]
 */
function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * 生成算术题目或字符题目（注意：绝不能在返回的 JSON 或 prompt 中泄露明文答案或算式）
 */
function generateChallenge(): { text: string; answer: string } {
  const isMath = Math.random() > 0.3; // 70% 概率生成学术数学算式，30% 字符

  if (isMath) {
    const operator = Math.random() > 0.5 ? "+" : Math.random() > 0.3 ? "-" : "×";
    let a = 0;
    let b = 0;
    let answer = 0;

    if (operator === "+") {
      a = randomInt(5, 45);
      b = randomInt(3, 35);
      answer = a + b;
    } else if (operator === "-") {
      a = randomInt(15, 50);
      b = randomInt(1, a - 1);
      answer = a - b;
    } else {
      // 乘法限制在较小范围内
      a = randomInt(2, 9);
      b = randomInt(2, 9);
      answer = a * b;
    }

    return {
      text: `${a} ${operator} ${b} = ?`,
      answer: String(answer),
    };
  } else {
    // 随机 4 位字符，排除容易混淆的字符 (0, O, o, 1, l, I)
    const chars = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
    let code = "";
    for (let i = 0; i < 4; i++) {
      code += chars.charAt(randomInt(0, chars.length - 1));
    }
    return {
      text: code,
      answer: code.toLowerCase(),
    };
  }
}

/**
 * 生成具备强抗爬虫特性的 SVG 验证码图像
 * 1. 无任何明文算式泄露到外部
 * 2. DOM 节点乱序插入（防止简单按 DOM 顺序爬取）
 * 3. 注入诱饵节点（Decoy text，屏幕外或透明，爬虫直接读取会中毒）
 * 4. 丰富干扰曲线与噪点
 */
export function generateCaptchaSvg(): CaptchaGenerateResult {
  const { text, answer } = generateChallenge();

  const width = 150;
  const height = 44;

  // 1. 干扰线
  let lines = "";
  for (let i = 0; i < 5; i++) {
    const x1 = randomInt(0, 30);
    const y1 = randomInt(5, height - 5);
    const x2 = randomInt(width - 30, width);
    const y2 = randomInt(5, height - 5);
    const strokeColor = `rgba(${randomInt(180, 240)}, ${randomInt(120, 180)}, ${randomInt(80, 140)}, 0.45)`;
    lines += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${strokeColor}" stroke-width="${randomInt(1, 2)}" stroke-linecap="round" />`;
  }

  // 2. 干扰贝塞尔曲线
  const qx1 = randomInt(10, 40);
  const qy1 = randomInt(10, 35);
  const qcx = randomInt(50, 100);
  const qcy = randomInt(0, 44);
  const qx2 = randomInt(110, 140);
  const qy2 = randomInt(10, 35);
  const curveColor = `rgba(${randomInt(220, 255)}, ${randomInt(150, 200)}, ${randomInt(100, 160)}, 0.5)`;
  lines += `<path d="M ${qx1} ${qy1} Q ${qcx} ${qcy} ${qx2} ${qy2}" fill="none" stroke="${curveColor}" stroke-width="1.8" />`;

  // 3. 噪点
  let dots = "";
  for (let i = 0; i < 35; i++) {
    const cx = randomInt(5, width - 5);
    const cy = randomInt(5, height - 5);
    const r = (Math.random() * 1.6).toFixed(1);
    const dotColor = `rgba(${randomInt(200, 255)}, ${randomInt(160, 220)}, ${randomInt(120, 180)}, 0.35)`;
    dots += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${dotColor}" />`;
  }

  // 4. 计算真实字符的真实渲染位置
  const charSpacing = (width - 24) / text.length;
  const realCharNodes: string[] = [];

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const x = 14 + i * charSpacing + randomInt(-2, 2);
    const y = 28 + randomInt(-3, 3);
    const rotate = randomInt(-14, 14);
    const colors = [
      "#f97316", // orange-500
      "#ea580c", // orange-600
      "#f59e0b", // amber-500
      "#d97706", // amber-600
      "#fb923c", // orange-400
      "#fbbf24", // amber-400
    ];
    const color = colors[randomInt(0, colors.length - 1)];
    const fontSize = randomInt(20, 24);

    realCharNodes.push(
      `<text x="${x}" y="${y}" fill="${color}" font-size="${fontSize}" font-weight="bold" font-family="'Geist', 'Segoe UI', system-ui, sans-serif" transform="rotate(${rotate}, ${x}, ${y})">${char}</text>`
    );
  }

  // 5. 注入防爬虫诱饵字符节点（屏幕外/透明，人类不可见，爬虫直接读取 DOM 会抓到错误算式/字符）
  const decoyChars = "0123456789ABCDEFGHJKLMNPQRSTUVWXYZ";
  const decoyNodes: string[] = [];
  for (let i = 0; i < 3; i++) {
    const decoyChar = decoyChars.charAt(randomInt(0, decoyChars.length - 1));
    decoyNodes.push(
      `<text x="-999" y="-999" opacity="0" display="none" aria-hidden="true">${decoyChar}</text>`
    );
  }

  // 6. 将真实字符与诱饵节点随机乱序组合（打乱 DOM 顺序，但真实字符根据自己的绝对 x 坐标准确呈现）
  const allTextNodes = [...realCharNodes, ...decoyNodes].sort(() => Math.random() - 0.5);
  const textElements = allTextNodes.join("");

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" class="select-none rounded-lg bg-slate-900/90 dark:bg-slate-950/90 border border-slate-700/50 dark:border-slate-800/80 shadow-inner">
    <defs>
      <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#0f172a" stop-opacity="0.95" />
        <stop offset="100%" stop-color="#1e293b" stop-opacity="0.95" />
      </linearGradient>
    </defs>
    <rect width="${width}" height="${height}" rx="8" fill="url(#bgGrad)" />
    ${dots}
    ${lines}
    ${textElements}
  </svg>`;

  // 生成 Token (包含 timestamp、nonce、answerHash 和 HMAC 签名)
  const timestamp = Date.now();
  const nonce = crypto.randomBytes(8).toString("hex");
  const normalizedAnswer = answer.trim().toLowerCase();
  const answerHash = crypto
    .createHmac("sha256", CAPTCHA_SECRET)
    .update(`${normalizedAnswer}:${nonce}`)
    .digest("hex")
    .slice(0, 16);

  const payload = `${timestamp}:${nonce}:${answerHash}`;
  const signature = crypto
    .createHmac("sha256", CAPTCHA_SECRET)
    .update(payload)
    .digest("hex")
    .slice(0, 24);

  const token = `${timestamp}.${nonce}.${answerHash}.${signature}`;

  return {
    svg,
    token,
  };
}

/**
 * 校验用户输入的验证码与 Token
 */
export function verifyCaptcha(
  token?: string,
  userAnswer?: string
): { success: boolean; message?: string } {
  if (!token || typeof token !== "string") {
    return { success: false, message: "缺少人机验证信息，请刷新重试" };
  }

  if (!userAnswer || typeof userAnswer !== "string" || !userAnswer.trim()) {
    return { success: false, message: "请输入人机验证码" };
  }

  const parts = token.split(".");
  if (parts.length !== 4) {
    return { success: false, message: "验证码签名无效，请刷新验证码" };
  }

  const [timestampStr, nonce, answerHash, signature] = parts;
  const timestamp = parseInt(timestampStr, 10);

  if (isNaN(timestamp)) {
    return { success: false, message: "验证码时间格式错误" };
  }

  const now = Date.now();

  // 1. 校验是否过期
  if (now - timestamp > CAPTCHA_EXPIRATION_MS) {
    return { success: false, message: "验证码已过期，请点击图片刷新" };
  }

  // 2. 校验时间是否来自未来
  if (timestamp > now + 10000) {
    return { success: false, message: "验证码时间异常" };
  }

  // 3. 校验防重放 (Nonce 是否已经被消费)
  if (usedNonces.has(nonce)) {
    return { success: false, message: "该验证码已被使用过，请点击刷新" };
  }

  // 4. 校验签名是否被篡改
  const payload = `${timestampStr}:${nonce}:${answerHash}`;
  const expectedSignature = crypto
    .createHmac("sha256", CAPTCHA_SECRET)
    .update(payload)
    .digest("hex")
    .slice(0, 24);

  if (
    !crypto.timingSafeEqual(
      Buffer.from(signature, "utf-8"),
      Buffer.from(expectedSignature, "utf-8")
    )
  ) {
    return { success: false, message: "验证码签名验证失败" };
  }

  // 5. 校验用户答案计算出来的 hash 是否一致
  const normalizedUserAnswer = userAnswer.trim().toLowerCase();
  const expectedAnswerHash = crypto
    .createHmac("sha256", CAPTCHA_SECRET)
    .update(`${normalizedUserAnswer}:${nonce}`)
    .digest("hex")
    .slice(0, 16);

  if (
    !crypto.timingSafeEqual(
      Buffer.from(answerHash, "utf-8"),
      Buffer.from(expectedAnswerHash, "utf-8")
    )
  ) {
    return { success: false, message: "人机验证码错误，请重新输入或刷新" };
  }

  // 6. 校验通过，消费 Nonce，有效期为该 Token 的剩余时间加 10 秒缓冲
  usedNonces.set(nonce, timestamp + CAPTCHA_EXPIRATION_MS + 10000);

  return { success: true };
}
