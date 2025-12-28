"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Camera, ArrowLeft, Save } from "lucide-react";
import Link from "next/link";

interface ProfileData {
    id: string;
    email: string | null;
    username: string | null;
    full_name: string | null;
    avatar_url: string | null;
    gender: string | null;
    bio: string | null;
    country: string | null;
    language: string | null;
    timezone: string | null;
}

export default function ProfileSettingsPage() {
    const [profile, setProfile] = useState<ProfileData | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const supabase = createClient();
    const router = useRouter();

    // 表单状态
    const [formData, setFormData] = useState({
        full_name: "",
        username: "",
        gender: "",
        bio: "",
        country: "",
        language: "zh",
        timezone: "",
    });

    // 获取当前用户的profile
    useEffect(() => {
        async function loadProfile() {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push("/login");
                return;
            }

            const { data, error } = await supabase
                .from("profiles")
                .select("*")
                .eq("id", user.id)
                .single();

            if (error) {
                console.error("Failed to load profile:", error);
                toast.error("加载个人资料失败");
            } else if (data) {
                setProfile(data);
                setFormData({
                    full_name: data.full_name || "",
                    username: data.username || "",
                    gender: data.gender || "",
                    bio: data.bio || "",
                    country: data.country || "",
                    language: data.language || "zh",
                    timezone: data.timezone || "",
                });
            }
            setLoading(false);
        }
        loadProfile();
    }, [supabase, router]);

    // 头像上传
    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !profile) return;

        // 验证文件类型和大小
        if (!file.type.startsWith("image/")) {
            toast.error("请选择图片文件");
            return;
        }
        if (file.size > 2 * 1024 * 1024) {
            toast.error("图片大小不能超过 2MB");
            return;
        }

        setUploading(true);
        try {
            const fileExt = file.name.split(".").pop();
            const fileName = `${profile.id}-${Date.now()}.${fileExt}`;
            const filePath = `avatars/${fileName}`;

            // 上传到 Supabase Storage
            const { error: uploadError } = await supabase.storage
                .from("avatars")
                .upload(fileName, file, { upsert: true });

            if (uploadError) throw uploadError;

            // 获取公开URL
            const { data: { publicUrl } } = supabase.storage
                .from("avatars")
                .getPublicUrl(fileName);

            // 更新 profile
            const { error: updateError } = await supabase
                .from("profiles")
                .update({ avatar_url: publicUrl })
                .eq("id", profile.id);

            if (updateError) throw updateError;

            setProfile({ ...profile, avatar_url: publicUrl });
            toast.success("头像更新成功");
        } catch (error: any) {
            console.error("Avatar upload error:", error);
            toast.error("头像上传失败: " + error.message);
        } finally {
            setUploading(false);
        }
    };

    // 保存表单
    const handleSave = async () => {
        if (!profile) return;

        setSaving(true);
        try {
            const { error } = await supabase
                .from("profiles")
                .update({
                    full_name: formData.full_name || null,
                    username: formData.username || null,
                    gender: formData.gender || null,
                    bio: formData.bio || null,
                    country: formData.country || null,
                    language: formData.language || null,
                    timezone: formData.timezone || null,
                    updated_at: new Date().toISOString(),
                })
                .eq("id", profile.id);

            if (error) throw error;

            toast.success("个人资料已保存");
        } catch (error: any) {
            console.error("Save error:", error);
            toast.error("保存失败: " + error.message);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    const initials = (formData.full_name || formData.username || profile?.email || "U").charAt(0).toUpperCase();

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
            {/* 顶部浅色渐变横幅 */}
            <div className="h-32 bg-gradient-to-r from-blue-100 via-indigo-100 to-purple-100 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-white/30 to-transparent" />
                <div className="absolute inset-0 opacity-30">
                    <div className="absolute top-2 left-1/4 w-24 h-24 bg-blue-200 rounded-full blur-3xl" />
                    <div className="absolute top-4 right-1/3 w-20 h-20 bg-purple-200 rounded-full blur-3xl" />
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                {/* 返回按钮 */}
                <Link
                    href="/dashboard"
                    className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
                >
                    <ArrowLeft className="h-4 w-4" />
                    返回仪表盘
                </Link>

                <Card className="shadow-lg border-border/30 bg-white/80 backdrop-blur-sm">
                    <CardHeader className="pb-4">
                        {/* 头像和基本信息 */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                {/* 头像 */}
                                <div className="relative group">
                                    <Avatar className="h-20 w-20 border-4 border-background shadow-lg">
                                        <AvatarImage src={profile?.avatar_url || ""} alt="头像" />
                                        <AvatarFallback className="text-2xl bg-gradient-to-br from-primary/30 to-primary/10 text-primary font-bold">
                                            {initials}
                                        </AvatarFallback>
                                    </Avatar>
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={uploading}
                                        className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                                    >
                                        {uploading ? (
                                            <Loader2 className="h-6 w-6 animate-spin text-white" />
                                        ) : (
                                            <Camera className="h-6 w-6 text-white" />
                                        )}
                                    </button>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        onChange={handleAvatarUpload}
                                        className="hidden"
                                    />
                                </div>
                                <div>
                                    <h1 className="text-xl font-bold">
                                        {formData.full_name || formData.username || "未设置姓名"}
                                    </h1>
                                    <p className="text-sm text-muted-foreground">{profile?.email}</p>
                                </div>
                            </div>
                            <Button onClick={handleSave} disabled={saving}>
                                {saving ? (
                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                ) : (
                                    <Save className="h-4 w-4 mr-2" />
                                )}
                                保存
                            </Button>
                        </div>
                    </CardHeader>

                    <CardContent className="space-y-6">
                        {/* 表单字段 - 两列布局 */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* 真实姓名 */}
                            <div className="space-y-2">
                                <Label htmlFor="full_name">真实姓名</Label>
                                <Input
                                    id="full_name"
                                    placeholder="请输入您的真实姓名"
                                    value={formData.full_name}
                                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                />
                            </div>

                            {/* 用户名/昵称 */}
                            <div className="space-y-2">
                                <Label htmlFor="username">用户名 (昵称)</Label>
                                <Input
                                    id="username"
                                    placeholder="请输入您的用户名"
                                    value={formData.username}
                                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                />
                            </div>

                            {/* 性别 */}
                            <div className="space-y-2">
                                <Label htmlFor="gender">性别</Label>
                                <Select
                                    value={formData.gender}
                                    onValueChange={(value) => setFormData({ ...formData, gender: value })}
                                >
                                    <SelectTrigger id="gender">
                                        <SelectValue placeholder="选择性别" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="male">男</SelectItem>
                                        <SelectItem value="female">女</SelectItem>
                                        <SelectItem value="other">其他</SelectItem>
                                        <SelectItem value="private">不公开</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* 国家/地区 */}
                            <div className="space-y-2">
                                <Label htmlFor="country">国家/地区</Label>
                                <Input
                                    id="country"
                                    placeholder="请输入您的国家或地区"
                                    value={formData.country}
                                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                                />
                            </div>

                            {/* 语言 */}
                            <div className="space-y-2">
                                <Label htmlFor="language">语言</Label>
                                <Select
                                    value={formData.language}
                                    onValueChange={(value) => setFormData({ ...formData, language: value })}
                                >
                                    <SelectTrigger id="language">
                                        <SelectValue placeholder="选择语言" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="zh">中文</SelectItem>
                                        <SelectItem value="en">English</SelectItem>
                                        <SelectItem value="ja">日本語</SelectItem>
                                        <SelectItem value="ko">한국어</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* 时区 */}
                            <div className="space-y-2">
                                <Label htmlFor="timezone">时区</Label>
                                <Select
                                    value={formData.timezone}
                                    onValueChange={(value) => setFormData({ ...formData, timezone: value })}
                                >
                                    <SelectTrigger id="timezone">
                                        <SelectValue placeholder="选择时区" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Asia/Shanghai">中国标准时间 (UTC+8)</SelectItem>
                                        <SelectItem value="Asia/Tokyo">日本标准时间 (UTC+9)</SelectItem>
                                        <SelectItem value="America/New_York">美国东部时间 (UTC-5)</SelectItem>
                                        <SelectItem value="America/Los_Angeles">美国太平洋时间 (UTC-8)</SelectItem>
                                        <SelectItem value="Europe/London">格林威治时间 (UTC+0)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* 个人简介 - 全宽 */}
                        <div className="space-y-2">
                            <Label htmlFor="bio">个人简介</Label>
                            <Textarea
                                id="bio"
                                placeholder="介绍一下你自己，你的研究方向、兴趣爱好等..."
                                value={formData.bio}
                                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                                rows={4}
                                className="resize-none"
                            />
                        </div>

                        {/* 邮箱显示 */}
                        <div className="pt-4 border-t border-border/50">
                            <h3 className="text-sm font-semibold mb-3">邮箱地址</h3>
                            <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                                    <svg className="h-4 w-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-sm font-medium">{profile?.email}</p>
                                    <p className="text-xs text-muted-foreground">主要邮箱</p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
