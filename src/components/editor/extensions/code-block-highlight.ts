import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { common, createLowlight } from "lowlight";

// 创建 lowlight 实例，使用常用语言
const lowlight = createLowlight(common);

export const CodeBlockHighlight = CodeBlockLowlight.configure({
    lowlight,
    defaultLanguage: "plaintext",
    HTMLAttributes: {
        class: "code-block-wrapper",
    },
});

// 支持的语言列表
export const SUPPORTED_LANGUAGES = [
    { value: "plaintext", label: "纯文本" },
    { value: "javascript", label: "JavaScript" },
    { value: "typescript", label: "TypeScript" },
    { value: "python", label: "Python" },
    { value: "java", label: "Java" },
    { value: "c", label: "C" },
    { value: "cpp", label: "C++" },
    { value: "csharp", label: "C#" },
    { value: "go", label: "Go" },
    { value: "rust", label: "Rust" },
    { value: "sql", label: "SQL" },
    { value: "json", label: "JSON" },
    { value: "xml", label: "XML" },
    { value: "html", label: "HTML" },
    { value: "css", label: "CSS" },
    { value: "bash", label: "Bash" },
    { value: "markdown", label: "Markdown" },
    { value: "latex", label: "LaTeX" },
];

export default CodeBlockHighlight;
