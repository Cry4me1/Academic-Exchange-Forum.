# Scholarly 学术论坛 —— 综合优化方案报告

> 编制人：reviewer（academic-forum-dev 团队）
> 依据：t1 项目现状盘点（researcher）、t2 代码质量与架构审查（engineer）、t3 构建/性能/部署审查（engineer）
> 优先级定义：**P0** 立即修复（安全/数据风险，存在可被利用的漏洞或资金/数据损失）；**P1** 短期（重要质量与性能改进）；**P2** 中期（架构与体验优化）；**P3** 长期（演进方向）。

---

## 0. 三项报告的交叉点核对

汇总时发现多份报告描述的是同一问题的不同层面，已在正文合并处理：

| 交叉点 | 报告出处 | 合并结论 |
| --- | --- | --- |
| 存储型 XSS（`dangerouslySetInnerHTML` 无 DOMPurify） | t2 #6、#12 | 与 t3 缺失 CSP 是**同一风险的攻击面与纵深防御两层**：既要修输入清洗（源头），也要加 CSP 响应头（兜底）。见 P0-4 / P1-6。 |
| 积分刷取 | t2 #2 | 与 t3 缺失 `CRON_SECRET`/`ADMIN_SECRET` 同属**密钥/权限治理缺失**：一处是函数权限缺失，一处是环境变量缺失。见 P0-2 / P0-7 / P1-8。 |
| `any`/`@ts-ignore` 泛滥 | t2 #17、#18 | 根因是 t3 指出 eslint 把 `no-explicit-any`/`ban-ts-comment`/`no-unused-vars` 全关。修 eslint 是治本。见 P1-7 / P2-2。 |
| `recommendations` 未鉴权触发付费 embedding | t2 #10 | 与 t3 指出 `generatePostEmbedding` 默认 service role 被公开路由触发是同一条链路。见 P0-7 / P2-9。 |
| `middleware.ts` 死代码 | t2 #26 | 与 t3 指出 middleware 体积 77.3 kB、在 Edge Runtime 引 Node API 是同一文件问题。见 P2-8。 |
| `keep-alive` 公开端点用 SERVICE_ROLE_KEY | t2 #23 | 与 t3 指出 `keep-alive.yml` 硬编码域名同属部署一致性。见 P1-11。 |
| 迁移漂移（lab_* 等表无建表迁移） | t1 风险① | 与 t3 部署一致性交叉：新环境部署会因缺表失败。见 P1-1。 |

---

## P0 —— 立即修复（安全 / 数据风险）

以下问题存在可直接被利用的漏洞，建议优先于任何功能迭代处理。

### P0-1 管理员操作未鉴权：任意登录用户可执行封禁/调整积分等管理动作
- **问题描述**：`src/lib/admin/actions.ts` 中 `banUser`/`unbanUser`/`muteUser`/`unmuteUser`/`hidePost`/`unhidePost`/`togglePinPost`/`toggleLockPost`/`adjustCredits`/`handleReport`/`adjustVipLevel`/`adminDeleteComment`/`updateUserBadges` 全部只调用 `createClient()`（普通用户会话），从不调用 `requireAdmin()`（仅 `resetUserPassword` 在 763 行调用）。证据：该文件 21 处 `createClient()`，`requireAdmin` 仅出现 1 次。
- **影响**：任何登录用户可通过直接调用这些 server action，实现封禁他人、删除评论、调整积分/会员等级等管理员级越权操作。同时 `user_credits` 表无 UPDATE 策略导致 `adjustCredits` 对所有用户均失败（附带功能 bug）。
- **建议动作**：① 在每个 action 开头 `await requireAdmin("admin")`（参照 `resetUserPassword` 的写法），或抽一个 `withAdmin` 高阶包装统一拦截；② 为 `user_credits` 补充 UPDATE RLS 策略（仅 service role 或管理员角色）；③ 修复 `adjustCredits` 在无策略下必然失败的问题。
- **工作量估计**：0.5–1 天（含验证）。

### P0-2 积分体系可被任意刷取（SECURITY DEFINER RPC 无身份校验）
- **问题描述**：`supabase/migrations/20260225_credit_system.sql` 的 `add_user_credits`（162 行）、`deduct_user_credits`（107 行）、`sync_vip_title`，以及 `20260228` 的 `claim_monthly_bonus`，均为 `SECURITY DEFINER` 但函数体**无 `auth.uid() = p_user_id` 校验**，且未 `REVOKE EXECUTE FROM anon, authenticated`。函数把 `p_user_id` 作为入参直接操作。
- **影响**：authenticated 客户端可直接 `rpc('add_user_credits', { p_user_id: 自己, p_amount: 999999 })` 凭空充值，随后兑换 VIP/消耗 AI 能力，造成资产与付费体系失守。
- **建议动作**：① 函数体内加 `IF auth.uid() IS DISTINCT FROM p_user_id THEN RAISE EXCEPTION ...`（`claim_monthly_bonus` 直接使用 `auth.uid()`，不接受用户传入 id）；② 对纯内部函数执行 `REVOKE EXECUTE ON FUNCTION ... FROM PUBLIC, anon, authenticated; GRANT ... TO service_role;`；③ 下一条（P0-5）的注额逻辑同样收口到 SECURITY DEFINER RPC 并做身份+余额校验。
- **工作量估计**：0.5 天（含新迁移 + 回归测试）。

### P0-3 匿名无限调用最贵模型：`api/duel/analyze` 无鉴权、无积分检查、无限流
- **问题描述**：`src/app/api/duel/analyze/route.ts` 整个 POST 处理器只 `import { createDeepSeek }` / `generateText`，**无任何鉴权、积分预检、速率限制**，直调 `deepseek-reasoner`（成本最高的推理模型）。证据：文件 1–8 行仅创建 deepseek client，无 supabase/鉴权引用。
- **影响**：任何人在无登录状态下可无限次调用，直接造成 API 账单不可控烧钱。
- **建议动作**：① 加 `requireUser`/会话校验；② 调用 `deduct_user_credits`（修复 P0-2 后）做积分预检与扣费，余额不足拒绝；③ 加 per-user + per-IP 速率限制（可复用 `/api/generate` 的限流思路）；④ 校验 `targetId`/回合归属，避免越权分析他人决斗。
- **工作量估计**：0.5–1 天。

### P0-4 存储型 XSS：私信富文本无清洗，SVG/HTML 可上传执行脚本
- **问题描述**：① `src/components/chat/ChatBubble.tsx:127` 对 `rich_text` 走 `ChatContentViewer`，最终在 `ChatEditor.tsx:352` `dangerouslySetInnerHTML={{ __html: content }}` 直接渲染；`useMessages.sendMessage` 直接 insert 原始字符串，全项目**无 DOMPurify**。可发送 `<img src=x onerror=...>` 在接收方浏览器执行。② `messages/upload` 仅校验 MIME 且**允许 SVG/HTML**，SVG 内嵌脚本可执行，且只信任客户端 `file.type`。
- **影响**：可窃取接收方会话/令牌、篡改页面、冒充身份，是典型的存储型 XSS 链。
- **建议动作**：① 前端渲染前用 DOMPurify 白名单清洗（仅保留 TipTap 富文本安全标签与公式标签）；或对纯文本消息默认走 `ChatTextMathViewer`，仅富文本走清洗后的 HTML；② 上传接口服务端按魔数/扩展名双重校验，**禁止 SVG/HTML**，对图片走安全的 `Content-Disposition`/`X-Content-Type-Options: nosniff`；③ 配合 P1-6 加 CSP 作为纵深防御。
- **工作量估计**：1–1.5 天（含回归）。

### P0-5 决斗下注可凭空铸造信誉分（duel_bets RLS 与结算触发器）
- **问题描述**：`supabase/migrations/20260619_add_duel_lp_and_bets.sql` 中 `duel_bets` RLS 只校验 `auth.uid() = spectator_id`，不校验金额、不校验是否选手、不校验余额；`handle_duel_bets_settlement` 触发器结算时给 `profiles.reputation_score + amount*2`。
- **影响**：绕过 API 直接用浏览器 Supabase 客户端 INSERT「押赢家」即可凭空铸造信誉分，破坏排行榜与信誉体系（与 P0-2 同理是 RLS/RPC 权限治理缺陷）。
- **建议动作**：① 下注改为 SECURITY DEFINER RPC：原子校验余额→扣分→插单；② 触发器只结算「已扣款状态」的单，未扣款不结算；③ 收紧 RLS（禁止选手自押、限制金额范围、校验决斗状态）。
- **工作量估计**：1–1.5 天。

### P0-6 注册接口可批量注册「已验证」账号
- **问题描述**：`src/app/api/auth/username/register/route.ts` 使用 `createAdminClient()`（service role）、`email_confirm: true`、直接置 `is_verified = true`，**无速率限制/验证码**，且未用已定义的 `usernameRegisterSchema` 做服务端校验。
- **影响**：可脚本化批量注册「已验证」账号（绕过邮箱验证），用于刷积分、刷榜、垃圾内容。
- **建议动作**：① 限流 + 图形验证码/注册门槛；② 用 `usernameRegisterSchema` 做 zod 服务端校验；③ 移除自动 `is_verified = true`，走真实邮箱确认流程。
- **工作量估计**：0.5 天。

### P0-7 服务端点 fail-open / 硬编码密钥 / 未鉴权触发付费
- **问题描述**：① `cron/cleanup-expired-files` 未配 `CRON_SECRET` 时**完全公开（fail-open）**；② `batch-embed/route.ts:15` 的 `ADMIN_SECRET` 硬编码回退 `"scholarly_dev_secret_2026"`；③ `recommendations` 路由**未鉴权**，可对无向量帖子触发付费 embedding 生成；④ `keep-alive` 公开端点使用 `SERVICE_ROLE_KEY`（t2 #23）。
- **影响**：未配置环境变量时服务降级为「公开+弱口令」，攻击者可调用管理接口、触发成本、或获得 service-role 权限泄漏面。
- **建议动作**：① 缺 `CRON_SECRET`/`ADMIN_SECRET` 时**直接 500 fail-closed**，删除硬编码回退值；② `recommendations` 加鉴权并对无 embedding 的帖子只读降级（或仅 service role 触发）；③ `keep-alive` 改用专用只读密钥或去掉敏感密钥依赖；④ 补全环境变量（见 P1-8）。
- **工作量估计**：0.5–1 天。

---

## P1 —— 短期（重要质量与性能改进）

### P1-1 迁移漂移：代码引用的表无建表迁移
- **问题描述**：`lab_rooms`/`lab_members`/`lab_sessions`/`lab_session_participants`/`lab_post_links`/`lab_snapshots`/`post_co_authors`/`_keep_alive` 等表被代码引用，但 36 个迁移中无对应建表脚本（疑似控制台手工建表）。证据来源 t1 风险①。
- **影响**：新环境/CI 部署时应用运行到这些表即报错；数据模型不可复现，属长期数据一致性隐患。
- **建议动作**：① 逐个核对代码引用的表名与迁移清单，为缺失表补写 `CREATE TABLE` + RLS + 索引迁移（可从现有库 `pg_dump` 反推结构）；② 建立「迁移即唯一建表入口」约定，禁止控制台手工建表；③ 加一个启动/CI 阶段表存在性校验脚本。
- **工作量估计**：1–2 天（视缺失表数量）。
- **注**：与 P0 同级的数据一致性风险，因不直接暴露攻击面故列 P1，建议紧随 P0 处理。

### P1-2 积分预检与扣费非原子、AI 接口缺 prompt 长度限制
- **问题描述**：`generate`/`peer-review` 的积分预检与扣费非原子，且无 prompt 长度限制；`onFinish` 扣费失败不回滚。
- **影响**：并发下可能重复计费/漏计费；超长 prompt 推高成本。
- **建议动作**：① 统一走修复后的 `deduct_user_credits`（P0-2）原子扣费；② 加 `max_tokens`/输入长度上限；③ 生成失败路径补退款/回滚逻辑。
- **工作量估计**：0.5–1 天。

### P1-3 数据模型缺陷：peer_reviews 唯一约束与决斗下注双花
- **问题描述**：① `peer_reviews` 用 `UNIQUE(post_id)`，第二人评审同帖会被覆盖，应改 `(post_id, user_id)`；② `duel/bet` 先读 `reputation_score` 再写回（非原子，可双花），`targetId` 未校验。
- **影响**：评审数据丢失、决斗注额可双花、可越权操作他人决斗。
- **建议动作**：① 改唯一约束迁移；② 注额逻辑与 P0-5 一并收口到原子 RPC；③ 校验 `targetId` 归属。
- **工作量估计**：0.5 天。

### P1-4 敏感日志泄漏
- **问题描述**：`generate/route.ts:106/302` `console.log` 完整 body 与 messages；`luogu/verify` 打印验证码。
- **影响**：生产日志泄漏用户私信内容、验证码，合规与隐私风险。
- **建议动作**：① 移除/降级（`console.debug` 且生产关闭）敏感日志；② 引入统一 logger，禁止序列化消息体；③ 验证码仅打哈希或时间戳。
- **工作量估计**：0.5 天。

### P1-5 实时订阅与数据库性能收紧
- **问题描述**：① `useMessages.ts:389-395` 对 messages `UPDATE` 无 filter 全量订阅、`:408-414` 对 `message_attachments` `INSERT` 无 filter（所有用户的更新推给每个在线客户端）；② `messages` 会话双向 OR 查询现有复合索引只加速单向，建议加反向复合索引或改 RPC；③ `supabase_realtime` 把 11 张表加入 publication 但 posts/comments 无客户端订阅；④ `getCommentsSorted`（`posts/[id]/actions.ts:357`）一次拉全部评论无分页；⑤ `getPosts` 用 offset 分页。
- **影响**：在线用户增多时 realtime 带宽与 DB 负载线性恶化；大帖评论加载慢。
- **建议动作**：① 按 `sender_id`/`receiver_id` 加 realtime filter；② 补反向复合索引（或改 RPC 统一查询）；③ 精简 publication 到实际订阅表；④ 评论分页、`getPosts` 改 keyset 分页。
- **工作量估计**：1–2 天。

### P1-6 构建与安全响应头配置
- **问题描述**：`next.config.ts` 缺 CSP/X-Frame-Options/X-Content-Type-Options/HSTS，`poweredByHeader` 未关；`package.json` 无 `pages:build` 脚本、无 `@cloudflare/next-on-pages` 依赖（与 `deployment_guide.md` 不一致）。
- **影响**：XSS（P0-4）无兜底；部署文档与实际脱节。
- **建议动作**：① 加 CSP（结合 TipTap 富文本白名单）、`X-Frame-Options: DENY`、`X-Content-Type-Options: nosniff`、HSTS、`poweredByHeader: false`；② 补 `pages:build` 脚本并锁定 `@cloudflare/next-on-pages` 版本。
- **工作量估计**：0.5 天。

### P1-7 eslint 规则恢复与静态检查治理
- **问题描述**：`eslint.config.mjs` 把 `no-explicit-any`/`ban-ts-comment`/`no-unused-vars` 全关，导致 t2 的 70+ `any`、多处 `@ts-ignore` 被放行，`npm run lint` 0 error 是「假象」。
- **影响**：类型安全退化为摆设，隐藏潜在 bug。
- **建议动作**：① 至少恢复 `warn`，逐步清零；② 处理 t2 列出的 `@ts-ignore/@ts-expect-error`（`posts/actions.ts:323-332`、`messages/download:35`、`dashboard/PostFeed.tsx:10`、`editor/wiki-link.tsx:289`、`slash-command-extension.tsx:55`、`literature/parse:38`）；③ `ignores` 补 `debug-novel.mjs`。
- **工作量估计**：1–2 天（随 P2-2 类型生成一起推进）。

### P1-8 环境变量补全
- **问题描述**：`.env.local` 缺 `NEXT_PUBLIC_SITE_URL`（生产魔法链接/回调跳错）、`CRON_SECRET`（缺失时 cron fail-open）、`ADMIN_SECRET`（缺失回退硬编码）。
- **影响**：登录回跳错、管理端点失守（见 P0-7）。
- **建议动作**：补全三变量并写入部署文档/CI secrets；前缀设计（仅 `SUPABASE_URL`/`ANON_KEY` 用 NEXT_PUBLIC）已验证合理，保持不变。
- **工作量估计**：0.5 天。

### P1-9 根目录与公开路由清理
- **问题描述**：根目录遗留 `debug-novel.js/.mjs`、`build-output.txt`、`tsconfig.tsbuildinfo`；`admin_system_status.md.resolved`、`launch-scholarly-duel.md`、`explore.md` 待归档；`src/app/debug` 页面在构建产物中作为**公开路由 `/debug`** 出现。
- **影响**：调试入口暴露、仓库脏乱、构建产物污染。
- **建议动作**：① 删除构建产物与调试脚本；② 文档归档到 `docs/` 与 `docs/announcements/`；③ `/debug` 删除或加环境守卫。
- **工作量估计**：0.5 天。

### P1-10 `messages/download` R2 降级不一致
- **问题描述**：`messages/download` 只走 R2 `getFileStream`，而上传在 R2 未配置时会降级 Supabase Storage，导致降级后的文件无法下载。
- **影响**：配置不齐时附件下载 404。
- **建议动作**：下载侧同样做 R2→Supabase Storage 降级回退，或统一存储后端。
- **工作量估计**：0.5 天。

### P1-11 keep-alive 部署一致性
- **问题描述**：`keep-alive.yml` 硬编码 `https://academic-exchange-forum.pages.dev/api/keep-alive`，域名变更即静默失效；cron 路由注释写「在 vercel.json 配置 cron」但实际靠 GitHub Actions（注释过时）。
- **影响**：保活失效导致冷启动变慢。
- **建议动作**：① 域名提为 GitHub Secrets/变量；② 修正注释；③ 与 P0-7 一起移除 keep-alive 的 SERVICE_ROLE_KEY 依赖。
- **工作量估计**：0.5 天。

---

## P2 —— 中期（架构与体验优化）

### P2-1 重复代码收敛
- **问题描述**：`JSONContentNode`×3、`getFileCategory`/`ALLOWED_FILE_TYPES` 重复、`createAdminClient` 重复（`src/lib/admin/actions.ts:741` 用 `require()` CJS 混 ESM）、`createSupabaseEdgeClient` 重复、`deletePost` 重复、积分计费常量重复。
- **影响**：改一处漏多处，维护成本高。
- **建议动作**：抽公共模块统一导出，CJS `require` 改 ESM `import`；建立共享常量/工具目录。
- **工作量估计**：1–2 天。

### P2-2 Supabase Database 生成类型，消除 `any`
- **问题描述**：`src/types` 仅 2 个 `.d.ts`，无 Supabase Database 类型，`as any`/`: any` 约 70+ 处。
- **影响**：类型安全缺失，重构易引入回归。
- **建议动作**：用 Supabase CLI `gen types typescript` 生成 Database 类型并全局接入；随 P1-7 逐步清零 `any`/`@ts-ignore`。
- **工作量估计**：1–2 天。

### P2-3 server actions 返回结构统一
- **问题描述**：`{error}`/`{success}`/`{data}` 混用。
- **影响**：前端处理逻辑分支复杂、易漏判错误。
- **建议动作**：定义统一 Result 类型（如 `{ ok, data?, error? }`），渐进式迁移。
- **工作量估计**：1 天（可分摊）。

### P2-4 编辑器按需加载：拆分 viewer/editor、动态 import
- **问题描述**：TipTap/Novel/Yjs 被**打进读帖详情页**，首屏 JS 偏大：`/posts/new` 与 `/posts/[id]/edit` 743 kB、`/duels/[id]` 767 kB、`/posts/[id]` 653 kB、`/messages` 516 kB。
- **影响**：移动端/弱网首屏慢。
- **建议动作**：① 详情页用轻量只读 viewer（`generateStaticParams`/SSR 渲染），编辑器动态 import 仅在进入编辑态加载；② 拆分 chunk，`next/dynamic` + `ssr:false`。
- **工作量估计**：2–3 天。

### P2-5 未用依赖清理
- **问题描述**：约 12 个疑似未用依赖（`jsondiffpatch`、`@tiptap/html`、`@tiptap/y-tiptap`、`y-prosemirror`、`y-webrtc`、`react-dropzone`、`@ai-sdk/openai`、`@tanstack/react-table` 等，协同方案从 WebRTC 转向 Supabase Broadcast 的遗留）。
- **影响**：依赖面增大、bundle 体积与安全补丁负担。
- **建议动作**：用 depcheck 核对后移除；与 P2-4 一起可显著减小首屏。
- **工作量估计**：0.5–1 天。

### P2-6 管理员体系落地（admin_roles/reports）
- **问题描述**：`admin_system_plan.md` 规划的 `admin_roles`/`reports` 表未落地，管理员判定仅靠 `profiles.is_developer` 单一字段。
- **影响**：权限模型粗糙，无法细分角色/审计。
- **建议动作**：按计划建表 + `requireAdmin(role)` 分级；与 P0-1 鉴权改造同步设计。
- **工作量估计**：1–2 天。

### P2-7 协同方案遗留清理（WebRTC → Supabase Broadcast）
- **问题描述**：`@tiptap/y-tiptap`、`y-webrtc`、`y-prosemirror` 等为旧 WebRTC 协同遗留，现用 Supabase Broadcast。
- **影响**：重复依赖、潜在不一致行为。
- **建议动作**：确认 lab 协同当前路径后彻底移除 WebRTC 相关代码与依赖。
- **工作量估计**：1 天。

### P2-8 middleware 瘦身与 Edge Runtime 兼容
- **问题描述**：middleware 体积 77.3 kB（含完整 supabase-js），且 `@supabase/realtime-js`/`supabase-js` 在 Edge Runtime 引 Node API（`process.versions`/`process.version`），Cloudflare Pages 需 `nodejs_compat`。
- **影响**：冷启动慢、运行时兼容风险。
- **建议动作**：① middleware 改用轻量 auth 校验（service role 或 cookie 解析），不引完整 supabase-js；② 显式配置 `nodejs_compat`；③ 与 t2 的 middleware 死代码清理一并处理。
- **工作量估计**：1–2 天。

### P2-9 付费 embedding 生成路径收敛
- **问题描述**：`generatePostEmbedding` 默认 service role，被公开 `recommendations` 路由触发（与 P0-7 交叉）。
- **影响**：未鉴权触发付费 embedding，成本不可控。
- **建议动作**：embedding 生成仅由发帖/后台任务触发，公开推荐路由只读消费已有向量；对无向量帖子返回降级推荐而非现场生成。
- **工作量估计**：0.5 天。

---

## P3 —— 长期（演进方向）

### P3-1 部署适配器与构建固化
- **问题描述**：`next.config.ts` 无 output/Cloudflare 适配器配置；`npx @cloudflare/next-on-pages@1` 无版本锁定。
- **建议动作**：固化 Cloudflare Pages 适配器与锁定的构建命令，纳入 CI 验证产物可部署。

### P3-2 测试体系补全
- **问题描述**：现状未见单元/集成/E2E 测试（尤其 RLS 与积分 RPC 等安全敏感逻辑无回归保障）。
- **建议动作**：① 优先给 RLS/RPC 写 pgtap 或集成测试；② 关键 server action/路由加单测；③ 引入 E2E 覆盖核心链路。

### P3-3 服务端逻辑收敛到 `src/actions`
- **问题描述**：服务端能力分散在 co-located `actions.ts`、`lib/admin/*`（近 800 行）、`lib/supabase/*`、23 个 API 路由。
- **建议动作**：制定目录规范，逐步收敛；大文件（`lib/admin/actions.ts`）按域拆分。

### P3-4 可观测性与日志规范
- **问题描述**：`console.log`/`debugger` 残留约 268 处，日志无统一规范（与 P1-4 关联）。
- **建议动作**：引入结构化日志/APM（Cloudflare 侧可用 Workers Logs），统一敏感信息脱敏策略。

### P3-5 类型与质量全量达标
- **问题描述**：`any`/`@ts-ignore` 清零、server actions 返回统一、`strict` 全量（当前 `strict:true` 良好）。
- **建议动作**：以 P2-2/P2-3 为里程碑，设 CI 门禁阻断新增 `any`/`@ts-ignore`。

### P3-6 解析与魔法值治理
- **问题描述**：`fetchArxivMetadata` 用 `/g` 正则 + `match()[1]` 取标题（脆弱）；硬编码魔法值（recommendations 中文关键词表、VIP 阈值、`MIN_CREDIT_COST`、开发者账号 `hansszh` 特殊逻辑）。
- **建议动作**：① 改 DOMParser 解析 arxiv；② 魔法值抽为配置/常量并文档化；③ 特殊账号逻辑改为角色/flag 判定。

### P3-7 数据索引与查询持续优化
- **问题描述**：`post_literature` 缺单独 `literature_id` 索引（低优先）。
- **建议动作**：随查询监控持续补索引，建立慢查询观察机制。

---

## 附：优先级速览（按建议执行顺序）

| 优先级 | 项 | 一句话动作 | 估计 |
| --- | --- | --- | --- |
| P0 | P0-1 | 所有 admin action 加 `requireAdmin` + 补 user_credits UPDATE 策略 | 0.5–1d |
| P0 | P0-2 | 积分 RPC 加 `auth.uid()` 校验 + REVOKE | 0.5d |
| P0 | P0-3 | duel/analyze 加鉴权/积分/限流 | 0.5–1d |
| P0 | P0-4 | DOMPurify 清洗 + 禁 SVG/HTML 上传 | 1–1.5d |
| P0 | P0-5 | 下注改原子 RPC + 触发器只结算已扣款 | 1–1.5d |
| P0 | P0-6 | 注册接口限流 + zod + 移除自动 is_verified | 0.5d |
| P0 | P0-7 | fail-closed + 删硬编码密钥 + recommendations 鉴权 | 0.5–1d |
| P1 | P1-1 | 补齐缺失建表迁移 | 1–2d |
| P1 | P1-2…P1-11 | 计费原子性/数据约束/日志/性能/配置/清理 | 0.5–2d each |
| P2 | P2-1…P2-9 | 去重/类型/统一返回/编辑器拆分/依赖清理/权限体系/中间件 | 0.5–3d each |
| P3 | P3-1…P3-7 | 部署固化/测试/目录收敛/可观测性/质量门禁/解析治理 | 长期 |

**总量估计**：P0 合计约 4–6 个工作日；P1 合计约 6–10 个工作日；P2/P3 为持续演进项，可按迭代排期。
