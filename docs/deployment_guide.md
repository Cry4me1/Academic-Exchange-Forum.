# Cloudflare Pages 部署指南

由于 Windows 环境下直接构建 Next.js 的 Cloudflare 适配器 (`@cloudflare/next-on-pages`) 存在已知的不兼容问题，最推荐且最稳定的部署方式是使用 **Cloudflare Pages 的 Git 集成**。

以下是详细的分步操作指南：

## 第一步：准备代码仓库

1.  确保你的代码已经提交并推送到 GitHub 或 GitLab 仓库。
    *   如果还没有仓库，请在 GitHub 上创建一个新仓库，并将本地代码推送上去。

## 第二步：在 Cloudflare Dashboard 上的操作

1.  登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)。
2.  进入 **Workers & Pages** 页面。
3.  点击 **Create Application** (创建应用)。
4.  选择 **Pages** 标签页，然后点击 **Connect to Git** (连接 Git)。
5.  选择你刚才推送的 **GitHub/GitLab 仓库**。
6.  点击 **Begin setup** (开始设置)。

## 第三步：构建配置 (关键步骤)

在 "Set up builds and deployments" 页面，请按照以下参数填写：

*   **Production branch**: `main` (或你的主分支名称)
*   **Framework preset**: 选择 `Next.js`
*   **Build command** (构建命令): 
    ```bash
    npx @cloudflare/next-on-pages@1
    ```
    *(注意：不要使用默认的 `next build`，必须使用 `@cloudflare/next-on-pages`)*
*   **Build output directory** (构建输出目录):
    ```text
    .vercel/output/static
    ```

## 第四步：设置环境变量

在同一个设置页面下，找到 **Environment variables (advanced)** 部分，添加以下变量：

1.  `NEXT_PUBLIC_SUPABASE_URL`: (填入你的 Supabase URL)
2.  `NEXT_PUBLIC_SUPABASE_ANON_KEY`: (填入你的 Supabase Anon Key)
3.  `NODE_VERSION`: `20.18.0` (推荐显式指定 Node 版本)

## 第五步：部署与后续配置

1.  点击 **Save and Deploy** (保存并部署)。
2.  等待构建和部署完成。这可能需要几分钟。

### 重要：配置兼容性标志 (Compatibility Flags)

部署完成后，为了确保 Supabase 和 Next.js 的某些功能正常运行，你可能需要添加兼容性标志：

1.  部署完成后，进入该项目的 **Settings** (设置) -> **Functions** (函数)。
2.  找到 **Compatibility Flags** (兼容性标志) 部分。
3.  添加一个标志：`nodejs_compat`。
4.  为了让标志生效，你可能需要重新触发一次部署（可以在 **Deployments** 页面点击 "Retry deployment" 或推送一个新的空 commit）。

## 常见问题排查

*   **构建失败**: 检查 Build Log。如果是 `Error: No such file or directory`，请确认 Build output directory 是否填写正确 (`.vercel/output/static`)。
*   **500 错误**: 检查 **Functions** Tabs 下的 Logs (Real-time logs)。通常是因为缺少环境变量或 `nodejs_compat` 标志未开启。

---

### 原理说明

我们通过 `@cloudflare/next-on-pages` 适配器将 Next.js 应用转换为 Cloudflare Pages 可以理解的格式。由于该工具在 Windows 本地运行极不隐定，我们利用 Cloudflare 云端的 Linux 环境来执行构建，这也是官方推荐的最佳实践。
