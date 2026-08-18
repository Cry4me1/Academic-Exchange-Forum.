"use client";

import { createCollection, updateCollection } from "@/app/(protected)/collections/actions";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { ImagePlus, Loader2, UploadCloud, X } from "lucide-react";
import Image from "next/image";
import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { COLLECTION_COVER_PRESETS } from "./CollectionCard";

interface CreateCollectionDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    editingCollection?: {
        id: string;
        name: string;
        description?: string | null;
        cover_url?: string | null;
        cover_style?: string;
        is_public: boolean;
    } | null;
    onSuccess?: (collection?: any) => void;
}

export function CreateCollectionDialog({ open, onOpenChange, editingCollection, onSuccess }: CreateCollectionDialogProps) {
    const [isPending, startTransition] = useTransition();
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [isPublic, setIsPublic] = useState(true);
    const [coverTab, setCoverTab] = useState("preset");
    const [coverStyle, setCoverStyle] = useState(COLLECTION_COVER_PRESETS[0].id);
    const [coverUrl, setCoverUrl] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);

    const isEditing = !!editingCollection;

    useEffect(() => {
        if (open) {
            if (editingCollection) {
                setName(editingCollection.name);
                setDescription(editingCollection.description || "");
                setIsPublic(editingCollection.is_public);
                if (editingCollection.cover_url) {
                    setCoverUrl(editingCollection.cover_url);
                    setCoverTab("upload");
                } else {
                    setCoverStyle(editingCollection.cover_style || COLLECTION_COVER_PRESETS[0].id);
                    setCoverTab("preset");
                    setCoverUrl(null);
                }
            } else {
                setName("");
                setDescription("");
                setIsPublic(true);
                setCoverStyle(COLLECTION_COVER_PRESETS[0].id);
                setCoverTab("preset");
                setCoverUrl(null);
            }
        }
    }, [open, editingCollection]);

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 2 * 1024 * 1024) {
            toast.error("图片大小不能超过 2MB");
            return;
        }

        setIsUploading(true);
        const supabase = createClient();
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("未登录");

            const fileExt = file.name.split('.').pop();
            const fileName = `${user.id}-${Date.now()}.${fileExt}`;

            const { error: uploadError, data } = await supabase.storage
                .from('collection-covers')
                .upload(fileName, file);

            if (uploadError) throw uploadError;

            const { data: urlData } = supabase.storage
                .from('collection-covers')
                .getPublicUrl(fileName);

            setCoverUrl(urlData.publicUrl);
            toast.success("上传成功");
        } catch (error) {
            console.error("Upload error:", error);
            toast.error("上传失败，请重试");
        } finally {
            setIsUploading(false);
        }
    };

    const handleSubmit = async () => {
        if (!name.trim()) {
            toast.error("请输入专栏名称");
            return;
        }

        startTransition(async () => {
            const data = {
                name,
                description,
                is_public: isPublic,
                cover_url: coverTab === "upload" ? coverUrl : null,
                cover_style: coverTab === "preset" ? coverStyle : undefined,
            };

            let result;
            if (isEditing) {
                result = await updateCollection(editingCollection.id, data);
            } else {
                result = await createCollection(data);
            }

            if (result.error) {
                toast.error(result.error);
            } else {
                toast.success(isEditing ? "专栏已更新" : "专栏创建成功");
                onOpenChange(false);
                onSuccess?.("data" in result ? result.data : undefined);
            }
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>{isEditing ? "编辑专栏" : "新建专栏"}</DialogTitle>
                    <DialogDescription>
                        {isEditing ? "修改专栏信息，包括封面和可见性。" : "创建一个新的专栏来组织您的学术内容。"}
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-6 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="name" className="text-foreground font-medium">
                            名称 <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="例如：量子力学学习笔记"
                            maxLength={50}
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="description" className="text-foreground font-medium">描述 (可选)</Label>
                        <Textarea
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="简短介绍这个专栏的内容和目的..."
                            className="resize-none"
                            rows={3}
                            maxLength={200}
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label className="text-foreground font-medium">封面</Label>
                        <Tabs value={coverTab} onValueChange={setCoverTab} className="w-full">
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="preset">预设封面</TabsTrigger>
                                <TabsTrigger value="upload">上传封面</TabsTrigger>
                            </TabsList>
                            <TabsContent value="preset" className="mt-3">
                                <div className="grid grid-cols-4 gap-2">
                                    {COLLECTION_COVER_PRESETS.map((preset) => (
                                        <button
                                            key={preset.id}
                                            onClick={() => setCoverStyle(preset.id)}
                                            className={cn(
                                                "relative aspect-[3/2] rounded-md overflow-hidden transition-all hover:scale-105",
                                                preset.class,
                                                coverStyle === preset.id && "ring-2 ring-primary ring-offset-2"
                                            )}
                                        >
                                            <span className="absolute inset-0 flex items-center justify-center text-xl opacity-75">
                                                {preset.icon}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </TabsContent>
                            <TabsContent value="upload" className="mt-3">
                                <div className="relative border-2 border-dashed border-border rounded-lg p-6 flex flex-col items-center justify-center text-center hover:bg-muted/50 transition-colors aspect-[3/2] overflow-hidden">
                                    {coverUrl ? (
                                        <>
                                            <Image src={coverUrl} alt="Cover preview" fill className="object-cover" />
                                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                                                <Button type="button" variant="secondary" size="sm" onClick={() => setCoverUrl(null)}>
                                                    重新上传
                                                </Button>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            {isUploading ? (
                                                <Loader2 className="h-8 w-8 text-muted-foreground animate-spin mb-2" />
                                            ) : (
                                                <UploadCloud className="h-8 w-8 text-muted-foreground mb-2" />
                                            )}
                                            <div className="text-sm font-medium mb-1">
                                                {isUploading ? "正在上传..." : "点击或拖拽上传"}
                                            </div>
                                            <div className="text-xs text-muted-foreground mb-4">
                                                支持 JPG, PNG, WEBP (最大 2MB)
                                            </div>
                                            <Input
                                                type="file"
                                                accept="image/*"
                                                className="absolute inset-0 opacity-0 cursor-pointer"
                                                onChange={handleUpload}
                                                disabled={isUploading}
                                            />
                                        </>
                                    )}
                                </div>
                            </TabsContent>
                        </Tabs>
                    </div>

                    <div className="flex items-center justify-between rounded-lg border p-4 bg-muted/30">
                        <div className="space-y-0.5">
                            <Label className="text-base">公开专栏</Label>
                            <div className="text-sm text-muted-foreground">
                                开启后，任何人都可以访问此专栏
                            </div>
                        </div>
                        <Switch
                            checked={isPublic}
                            onCheckedChange={setIsPublic}
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        取消
                    </Button>
                    <Button onClick={handleSubmit} disabled={isPending || isUploading}>
                        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isEditing ? "保存更改" : "创建专栏"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
