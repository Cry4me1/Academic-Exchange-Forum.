# 项目名称：Scholarly (学术论坛 Web 端)

## 1. 项目概述
构建一个基于 Next.js 和 Supabase 的现代化、高性能学术论坛。旨在为研究人员提供一个支持复杂内容（数学公式、图表、代码）交流的平台，并具备完善的社交和实时互动功能。

## 2. 技术栈架构
- **前端框架**: Next.js (App Router, 最新稳定版), TypeScript
- **样式方案**: Tailwind CSS, Shadcn/UI (组件库), Lucide React (图标)
- **后端服务**: Supabase (PostgreSQL, Authentication, Storage, Edge Functions)
- **实时通信**: Supabase Realtime (用于私信、通知、在线状态/Presence)
- **富文本编辑器**: Tiptap (headless) 或 Plate.js，必须支持:
  - LaTeX (KaTeX)
  - Code Blocks (Prism.js/Shiki)
  - 图片/视频上传 (Supabase Storage)
  - 图表渲染 (Recharts/Mermaid)
- **UI 生成**: 通过 Figma 设计稿，利用 MCP 工具转换为代码

## 3. 核心功能模块
1.  **用户系统**:
    - 邮箱/密码登录注册，GitHub/Google OAuth。
    - 个人主页（头像、简介、学术背景）。
    - 实时在线/离线状态 (Supabase Presence)。
2.  **论坛核心**:
    - 发帖/回帖：支持富文本。
    - 帖子列表：支持按热度、时间、标签筛选。
    - 全文搜索。
3.  **社交系统**:
    - 好友系统（发送请求、接受/拒绝）。
    - 实时私信（支持文字、图片）。
    - 系统通知（点赞、评论、好友请求）。
4.  **页面结构**:
    - 落地页 (Landing Page): 产品介绍。
    - 认证页 (Auth): 登录/注册。
    - 仪表盘/论坛主页 (Dashboard)。

## 4. 设计与UI规范
- **语言**: 全中文 UI。
- **风格**: 极简、学术风、高对比度、强调阅读体验。
- **响应式**: 完美适配桌面端和移动端。