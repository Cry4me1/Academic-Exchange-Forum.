import { redirect } from "next/navigation";

// 共创实验室功能暂未上线，所有子路由重定向到 /lab 未上线提示页
export default function LabRoomPage() {
    redirect("/lab");
}
