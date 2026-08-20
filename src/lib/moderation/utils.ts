/**
 * 通用内容处理工具函数（客户端与服务端通用，不依赖任何服务端 Node.js 库）
 */

/**
 * 递归从 Novel/TipTap JSON 节点树或字符串中提取纯文本
 */
export function extractPlainTextFromContent(content: any): string {
  if (!content) return "";
  if (typeof content === "string") {
    try {
      const parsed = JSON.parse(content);
      if (parsed && typeof parsed === "object") {
        return extractPlainTextFromNode(parsed);
      }
    } catch {
      // 纯字符串，剥离 HTML 标签
      return content.replace(/<[^>]*>?/gm, "").trim();
    }
    return content.trim();
  }
  if (typeof content === "object") {
    return extractPlainTextFromNode(content);
  }
  return String(content);
}

export function extractPlainTextFromNode(node: any): string {
  if (!node) return "";
  let text = "";
  if (node.text) {
    text += node.text;
  }
  if (Array.isArray(node.content)) {
    text += node.content.map(extractPlainTextFromNode).join(" ");
  } else if (node.content && typeof node.content === "object") {
    text += extractPlainTextFromNode(node.content);
  }
  return text.trim();
}

/**
 * 递归从 Novel/TipTap JSON 节点树中提取图片 URL 列表
 */
export function extractImageUrls(content: any): string[] {
  if (!content) return [];
  const urls: string[] = [];

  function traverse(node: any) {
    if (!node) return;
    if (node.type === "image" && node.attrs?.src && typeof node.attrs.src === "string") {
      urls.push(node.attrs.src);
    }
    if (Array.isArray(node.content)) {
      node.content.forEach(traverse);
    }
  }

  if (typeof content === "object") {
    traverse(content);
  }
  return urls;
}
