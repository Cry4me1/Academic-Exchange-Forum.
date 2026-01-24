"use client";

import NovelViewer from "@/components/editor/NovelViewer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const mathContent = {
    type: "doc",
    content: [
        {
            type: "heading",
            attrs: { level: 2 },
            content: [{ type: "text", text: "Math Rendering Test" }],
        },
        {
            type: "paragraph",
            content: [
                { type: "text", text: "This is an inline formula: " },
                { type: "text", text: "$E = mc^2$" },
                { type: "text", text: " within a sentence." },
            ],
        },
        {
            type: "paragraph",
            content: [
                { type: "text", text: "This is another inline formula: " },
                { type: "text", text: "$a^2 + b^2 = c^2$" },
            ],
        },
        {
            type: "paragraph",
            content: [
                { type: "text", text: "Below is a block formula (if supported by extension settings, often $$...$$):" },
            ],
        },
        {
             type: "paragraph",
             content: [
                 { type: "text", text: "$$\\sum_{i=1}^n i = \\frac{n(n+1)}{2}$$" }
             ]
        }
    ],
};

export default function TestMathPage() {
    return (
        <div className="container py-8 max-w-4xl mx-auto">
            <Card>
                <CardHeader>
                    <CardTitle>Rich Text & Math Test</CardTitle>
                </CardHeader>
                <CardContent>
                    <NovelViewer initialValue={mathContent} />
                </CardContent>
            </Card>
        </div>
    );
}
