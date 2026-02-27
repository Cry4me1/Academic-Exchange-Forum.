# Scholarly 积分生态 · 后续实现路线图

> 本文档详细规划了积分系统从 MVP 到成熟商业化运营的 6 个迭代阶段。
> 当前状态：核心积分系统已上线（模拟支付 + 固定扣费 + 基础 VIP 展示）。

---

## 阶段 1 · 💳 真实支付接入

**目标**：替换当前的模拟购买流程，接入真实支付渠道，用户可以用人民币购买积分。

### 1.1 技术选型

| 方案 | 优势 | 劣势 | 推荐场景 |
|------|------|------|---------|
| **支付宝当面付** | 国内覆盖广、扫码支付体验好 | 需要企业资质 | 面向国内用户 |
| **微信支付 JSAPI/Native** | 微信生态内传播方便 | 同样需要企业资质 | 面向微信用户群 |
| **Stripe** | 国际化、API 优雅、支持信用卡 | 国内用户体验一般 | 面向海外学术用户 |
| **Lemon Squeezy** | 轻量级、集成简单 | 手续费较高 | 快速上线、独立开发者 |

### 1.2 架构设计

```
用户点击购买 → 前端调用 Server Action → 创建支付订单 → 跳转/扫码支付
                                              ↓
                                      支付渠道异步回调
                                              ↓
                           Webhook API Route 验证签名 → 调用 add_user_credits RPC
                                              ↓
                                    更新余额 + 记录流水 + 同步 VIP
```

### 1.3 实现清单

- [ ] **支付订单表** `payment_orders`
  ```sql
  CREATE TABLE public.payment_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    plan_id TEXT NOT NULL,          -- basic / pro / scholar
    amount_cents INTEGER NOT NULL,  -- 金额（分）
    credits INTEGER NOT NULL,       -- 对应积分数
    status TEXT DEFAULT 'pending',  -- pending / paid / failed / refunded
    provider TEXT NOT NULL,         -- alipay / wechat / stripe
    provider_order_id TEXT,         -- 第三方订单号
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
  );
  ```
- [ ] **Webhook 路由** `api/webhooks/payment/route.ts`
  - 验证支付平台签名（防伪造）
  - 幂等处理（同一订单号不重复发放）
  - 调用 `add_user_credits` RPC 发放积分
- [ ] **前端购买流程改造**
  - `purchaseCredits` Server Action → 创建 `payment_orders` 记录 → 返回支付链接/二维码
  - `CreditRechargeDialog` 显示二维码或跳转支付页
  - 轮询或 Realtime 监听订单状态变更 → 成功后播放撒花动画

### 1.4 安全要点

- Webhook 必须验证签名，拒绝伪造请求
- 订单幂等：通过 `provider_order_id` 唯一索引防止重复发放
- 金额校验：后端核实 `amount_cents` 与套餐价格一致
- 退款处理：支持通过管理后台发起退款并扣回积分

---

## 阶段 2 · 📊 管理后台

**目标**：为管理员提供积分运营的可视化面板，支持数据查看、手动调整、异常监控。

### 2.1 功能模块

| 模块 | 功能 | 优先级 |
|------|------|--------|
| **积分概览仪表盘** | 全站积分总量、今日充值/消费、活跃付费用户数 | P0 |
| **用户积分管理** | 搜索用户、查看余额/流水、手动充值/扣减/冻结 | P0 |
| **交易流水** | 全站流水列表，支持按类型/时间/金额筛选、导出 CSV | P1 |
| **支付订单** | 订单状态追踪、退款操作、异常订单标记 | P1 |
| **数据报表** | 日/周/月 充值趋势、AI 调用频次、VIP 分布饼图 | P2 |
| **异常告警** | 单用户短时间大量消费告警、余额异常波动检测 | P2 |

### 2.2 实现方案

- [ ] **管理员权限** — `profiles` 表增加 `role` 字段（`user` / `admin` / `super_admin`）
- [ ] **管理后台页面** — `/admin/credits` 路由，仅 `role = admin` 可访问
- [ ] **管理员 RPC** — `admin_adjust_credits(target_user_id, amount, reason)` —— SECURITY DEFINER + 权限校验
- [ ] **数据聚合视图** — 创建 PostgreSQL 统计视图，避免全表扫描：
  ```sql
  CREATE VIEW public.credit_stats_daily AS
  SELECT
    date_trunc('day', created_at) AS day,
    type,
    COUNT(*) AS tx_count,
    SUM(amount) AS total_amount
  FROM public.credit_transactions
  GROUP BY 1, 2;
  ```
- [ ] **审计日志** — 所有管理员操作记录到 `admin_audit_log` 表

### 2.3 UI 设计要点

- 使用 Shadcn/UI 的 `DataTable` 组件 + 服务端分页
- 图表使用 `recharts` 或 `tremor`
- 管理员操作需二次确认弹窗

---

## 阶段 3 · 🎁 积分运营体系

**目标**：通过多样化的积分获取途径提升用户活跃度和留存率。

### 3.1 运营活动矩阵

| 活动 | 积分奖励 | 频率 | 实现方式 |
|------|---------|------|---------|
| **每日签到** | 5~20 积分（连续签到递增） | 每日 | 前端签到按钮 + Server Action |
| **每月赠送** | VIP1: 10, VIP3: 30, VIP6: 100 | 每月1日 | Supabase Edge Function + pg_cron |
| **首充双倍** | 首次充值金额 × 2 | 一次性 | `payment_orders` 检查历史订单数 |
| **邀请好友** | 邀请人 +50, 被邀请人 +30 | 每次 | `referral_codes` 表 + 注册挂钩 |
| **优质帖子奖励** | 获赞 > 10 自动奖 20 积分 | 每帖一次 | 数据库触发器监听 `post_likes` |
| **学术决斗胜利** | 胜者 +15 积分 | 每次 | 决斗结算时调用 `add_user_credits` |
| **节日活动** | 春节/国庆双倍积分 | 特殊时段 | 活动配置表 + 日期判断 |

### 3.2 数据库扩展

```sql
-- 签到记录表
CREATE TABLE public.daily_checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  checked_at DATE NOT NULL DEFAULT CURRENT_DATE,
  streak INTEGER NOT NULL DEFAULT 1,  -- 连续签到天数
  credits_earned INTEGER NOT NULL,
  UNIQUE(user_id, checked_at)
);

-- 邀请码表
CREATE TABLE public.referral_codes (
  code TEXT PRIMARY KEY,
  inviter_id UUID REFERENCES auth.users(id) NOT NULL,
  invitee_id UUID REFERENCES auth.users(id),
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### 3.3 签到积分阶梯

| 连续天数 | 奖励积分 | 说明 |
|---------|---------|------|
| 1-3 天 | 5 | 基础奖励 |
| 4-7 天 | 10 | 连续签到加成 |
| 8-14 天 | 15 | 持续激励 |
| 15-30 天 | 20 | 忠诚用户 |
| 30+ 天 | 20 + 抽奖 | 额外金色宝箱掉落 |

---

## 阶段 4 · 🤖 AI 进阶计费

**目标**：从固定 5 积分/次改为按实际 token 消耗动态计费，更公平合理。

### 4.1 计费模型设计

| 操作类型 | 预估 token | 积分消耗 | 说明 |
|---------|-----------|---------|------|
| 续写 (continue) | ~200 | 3 | 短文本生成 |
| 改善 (improve) | ~300 | 4 | 文本优化 |
| 自由提问 (zap) | ~500 | 5 | 通用 AI 问答 |
| 论文摘要 (summarize) | ~800 | 7 | 长文本处理 |
| 全文翻译 (translate) | ~1000+ | 10 | 大量 token |
| 深度分析 (zap + 长文) | ~2000+ | 15 | 复杂推理任务 |

### 4.2 实现细节

- [ ] **Token 统计**：DeepSeek API 响应中包含 `usage.total_tokens`，流式结束后读取
- [ ] **后扣费模式**：
  1. 请求前预冻结 15 积分（最大值）
  2. 流式生成完成后，根据实际 token 计算真实费用
  3. 解冻差额，扣除实际费用
- [ ] **费用计算公式**：
  ```typescript
  function calculateCreditCost(totalTokens: number, option: string): number {
    const baseCost = Math.ceil(totalTokens / 200); // 每 200 token = 1 积分
    const optionMultiplier: Record<string, number> = {
      continue: 0.8,
      improve: 1.0,
      summarize: 1.2,
      translate: 1.5,
      zap: 1.0,
    };
    return Math.max(2, Math.round(baseCost * (optionMultiplier[option] || 1.0)));
  }
  ```
- [ ] **前端动态显示**：AI 调用完成后显示实际消耗积分数（而非固定 5）
- [ ] **冻结余额表** `credit_holds`：
  ```sql
  CREATE TABLE public.credit_holds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    amount INTEGER NOT NULL,
    reason TEXT,
    released BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
  );
  ```

### 4.3 VIP 折扣体系

| VIP 等级 | AI 费用折扣 | 说明 |
|---------|-----------|------|
| V1 学术新星 | 无折扣 | — |
| V2 学术探索者 | 9.5 折 | 鼓励持续使用 |
| V3 学术精英 | 9 折 | — |
| V4 学术大师 | 8.5 折 | — |
| V5 学术泰斗 | 8 折 | 显著优惠 |
| V6 学术至尊 | 7 折 | 最高折扣 |

---

## 阶段 5 · 👑 VIP 专属特权

**目标**：为高等级 VIP 提供差异化的增值服务，提升付费动力。

### 5.1 特权矩阵

| 特权 | V1 | V2 | V3 | V4 | V5 | V6 |
|------|:--:|:--:|:--:|:--:|:--:|:--:|
| AI 基础调用 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| AI 费用折扣 | — | 9.5 折 | 9 折 | 8.5 折 | 8 折 | **7 折** |
| 专属名称后缀 | — | — | ✅ | ✅ | ✅ | ✅ |
| **自定义头衔颜色** | — | — | — | ✅ | ✅ | ✅ |
| **专属 AI 模型** | — | — | — | — | GPT-4o | GPT-4o + Claude |
| **优先 AI 队列** | — | — | — | — | ✅ | ✅ |
| **自定义个人主页背景** | — | — | ✅ | ✅ | ✅ | ✅ |
| **VIP 专属表情包** | — | — | — | ✅ | ✅ | ✅ |
| **帖子置顶特权** | — | — | — | — | 每月1次 | 每月3次 |
| **专属客服通道** | — | — | — | — | — | ✅ |

### 5.2 实现要点

- [ ] **VIP 配置表** `vip_privileges`：存储每个等级的特权配置（JSON 格式，方便扩展）
  ```sql
  CREATE TABLE public.vip_privileges (
    level INTEGER PRIMARY KEY,
    ai_discount NUMERIC(3,2) DEFAULT 1.00,
    ai_models TEXT[] DEFAULT ARRAY['deepseek-chat'],
    priority_queue BOOLEAN DEFAULT false,
    monthly_pin_count INTEGER DEFAULT 0,
    custom_title_color BOOLEAN DEFAULT false,
    custom_background BOOLEAN DEFAULT false,
    config JSONB DEFAULT '{}'
  );
  ```
- [ ] **AI 模型切换**：
  - V5+ 用户在 AI 编辑器中出现模型下拉选择器
  - 不同模型有不同的积分费率
  - `/api/generate` 路由根据用户 VIP 等级决定可用模型列表
- [ ] **自定义头衔**：
  - V4+ 用户可以在个人设置里修改 VIP 后缀的显示名称和颜色
  - `profiles` 表增加 `custom_vip_color TEXT` 字段
  - `VipBadge` 组件读取自定义颜色

### 5.3 专属 AI 模型接入

```typescript
// 根据 VIP 等级返回可用模型
function getAvailableModels(vipLevel: number): string[] {
  if (vipLevel >= 6) return ['deepseek-chat', 'gpt-4o', 'claude-3.5-sonnet'];
  if (vipLevel >= 5) return ['deepseek-chat', 'gpt-4o'];
  return ['deepseek-chat'];
}
```

---

## 阶段 6 · 🔔 Realtime 余额同步

**目标**：使用 Supabase Realtime 实现全站积分余额的实时同步，无需手动刷新。

### 6.1 应用场景

| 场景 | 当前问题 | Realtime 方案 |
|------|---------|--------------|
| AI 调用扣费 | 需要手动调用 `refreshCredits()` | 余额自动更新 |
| 充值成功 | 需要关闭弹窗后手动刷新 | 支付完成即时反映 |
| 管理员调整 | 用户完全不知道 | 实时推送 + Toast 通知 |
| 多标签页 | 各标签页余额不同步 | 跨标签实时一致 |

### 6.2 技术方案

```typescript
// CreditBalanceProvider.tsx — 全局余额 Context
"use client";

import { createClient } from "@/lib/supabase/client";
import { useEffect, useState, createContext, useContext } from "react";

const CreditContext = createContext<{
  balance: number;
  totalSpent: number;
  refreshCredits: () => void;
}>({ balance: 0, totalSpent: 0, refreshCredits: () => {} });

export function CreditBalanceProvider({ children, userId }: {
  children: React.ReactNode;
  userId: string;
}) {
  const [balance, setBalance] = useState(0);
  const [totalSpent, setTotalSpent] = useState(0);
  const supabase = createClient();

  useEffect(() => {
    // 初始加载
    supabase
      .from("user_credits")
      .select("balance, total_spent")
      .eq("user_id", userId)
      .single()
      .then(({ data }) => {
        if (data) {
          setBalance(data.balance);
          setTotalSpent(data.total_spent);
        }
      });

    // Realtime 订阅
    const channel = supabase
      .channel("user-credits")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "user_credits",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          setBalance(payload.new.balance);
          setTotalSpent(payload.new.total_spent);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [userId, supabase]);

  return (
    <CreditContext.Provider value={{ balance, totalSpent, refreshCredits: () => {} }}>
      {children}
    </CreditContext.Provider>
  );
}

export const useCreditBalance = () => useContext(CreditContext);
```

### 6.3 实现清单

- [ ] 创建 `CreditBalanceProvider` + `useCreditBalance` hook
- [ ] 挂载到 `(protected)/layout.tsx`
- [ ] Dashboard 积分胶囊 → `useCreditBalance()`
- [ ] AI 编辑器积分栏 → `useCreditBalance()`
- [ ] VIP 页面 → `useCreditBalance()`
- [ ] Supabase 开启 `user_credits` 表的 Realtime：
  ```sql
  ALTER PUBLICATION supabase_realtime ADD TABLE public.user_credits;
  ```

### 6.4 性能考量

- 每个用户只订阅自己的 `user_id` 行，不会接收全表更新
- 使用 `filter` 参数过滤订阅，减少网络传输
- 组件销毁时及时 `removeChannel` 避免内存泄漏
- 考虑连接数限制：Free 200 / Pro 500 并发连接

---

## 📅 交付节奏建议

| 阶段 | 预估工期 | 前置依赖 | 上线优先级 |
|------|---------|---------|-----------|
| 阶段 1 · 真实支付 | 3-5 天 | 企业资质/支付渠道开通 | 🔴 最高 |
| 阶段 2 · 管理后台 | 2-3 天 | 阶段 1 | 🔴 高 |
| 阶段 3 · 积分运营 | 3-4 天 | 阶段 1 | 🟡 中 |
| 阶段 4 · 动态计费 | 2-3 天 | 无 | 🟡 中 |
| 阶段 5 · VIP 特权 | 4-5 天 | 阶段 4 | 🟢 低 |
| 阶段 6 · Realtime | 1-2 天 | 无 | 🟢 低 |

> **建议路径**：阶段 1 → 阶段 2 → 阶段 4 → 阶段 6 → 阶段 3 → 阶段 5
> 先完成支付闭环和管理能力，再优化计费模型并实时化，最后做运营和增值服务。
