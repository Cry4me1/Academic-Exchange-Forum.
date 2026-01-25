# Scholarly - 学术交流论坛

Scholarly 是一个专为学术讨论设计的现代化论坛平台。它结合了即时通讯、富文本编辑（支持 LaTeX 和代码高亮）以及深度定植的学术社交功能，旨在为研究人员和学生提供一个高效的知识分享环境。

## ✨ 核心特性

- **专业级内容创作**:
  -集成 `Novel` 和 `Tiptap` 编辑器，完美支持 **LaTeX 数学公式**、**代码语法高亮**和图表渲染。
  - 支持帖子**修订历史**与**版本差异对比**，保障学术内容的严谨性。
- **现代化社交体验**:
  - **即时通讯**: 基于 Supabase Realtime 的私信系统，支持文件传输与消息撤回。
  - **好友与关注**: 轻松管理学术人脉。
  - **学术对决 (Duels)**: 独特的知识竞技场功能（开发中）。
- **完整的数据生态**:
  - 基于 Supabase 的鉴权 (Auth) 与数据库 (Postgres)。
  - 严谨的行级安全策略 (RLS) 保护用户隐私。
  - 实时通知与动态更新。

## 🛠️ 技术栈

本项目采用了最新的现代 Web 开发技术栈：

- **框架**: [Next.js 15 (App Router)](https://nextjs.org/)
- **语言**: TypeScript
- **UI 组件**: 
  - [Tailwind CSS v4](https://tailwindcss.com/)
  - [Shadcn/UI](https://ui.shadcn.com/) (Radix UI)
  - [Framer Motion](https://www.framer.com/motion/) (动画)
- **后端服务 (BaaS)**: [Supabase](https://supabase.com/) (Auth, Database, Storage, Realtime)
- **编辑器**: [Novel](https://novel.sh/) / [Tiptap](https://tiptap.dev/)
- **AI 集成**: Vercel AI SDK (@ai-sdk)

## 🚀 快速开始

### 1. 克隆项目

```bash
git clone https://github.com/your-username/academic-forum.git
cd academic-forum
```

### 2. 安装依赖

```bash
npm install
```

### 3. 配置环境变量

在项目根目录创建一个 `.env.local` 文件，并填入以下 Supabase 配置信息：

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. 运行开发服务器

```bash
npm run dev
```

打开浏览器访问 [http://localhost:3000](http://localhost:3000) 即可看到应用。

## 📂 项目结构

```
src/
├── app/
│   ├── (auth)/        # 登录、注册页面
│   ├── (protected)/   # 需要登录的受保护路由 (Dashboard, 帖子, 私信等)
│   ├── api/           #后端 API路由
│   └── layout.tsx     # 全局布局
├── components/        # 可复用 UI 组件
├── lib/               # 工具函数与 Supabase 客户端配置
└── types/             # TypeScript 类型定义
```

## 🤝 贡献指南

欢迎提交 Issues 和 Pull Requests 来改进这个项目！在提交代码前，请确保通过了 ESLint 检查。

## 📄 开源协议

MIT
