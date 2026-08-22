import { Metadata } from "next";
import { TutorialsClient } from "./TutorialsClient";

export const metadata: Metadata = {
    title: "研学者新手实操训练营 - Scholarly",
    description: "1:1 真实业务组件互动沙盒，全面掌握学术编辑器、出版排版、学术决斗与积分生态",
};

export default function TutorialsPage() {
    return <TutorialsClient />;
}
