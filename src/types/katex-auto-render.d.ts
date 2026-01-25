declare module "katex/dist/contrib/auto-render" {
    export interface RenderMathInElementOptions {
        delimiters?: Array<{
            left: string;
            right: string;
            display: boolean;
        }>;
        ignoredTags?: string[];
        ignoredClasses?: string[];
        errorCallback?: (msg: string, err: Error) => void;
        throwOnError?: boolean;
        output?: "html" | "mathml" | "htmlAndMathml";
    }

    export default function renderMathInElement(
        elem: HTMLElement,
        options?: RenderMathInElementOptions
    ): void;
}

