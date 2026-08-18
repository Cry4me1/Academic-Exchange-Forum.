"use client";

import { getMyCollections, syncPostCollections } from "@/app/(protected)/collections/actions";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Loader2, Plus } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { CreateCollectionDialog } from "./CreateCollectionDialog";

interface AddToCollectionDialogProps {
    postId: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    initialCollectionIds?: string[];
}

export function AddToCollectionDialog({ postId, open, onOpenChange, initialCollectionIds = [] }: AddToCollectionDialogProps) {
    const [isPending, startTransition] = useTransition();
    const [collections, setCollections] = useState<any[]>([]);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set(initialCollectionIds));
    const [isLoading, setIsLoading] = useState(false);
    const [showCreateDialog, setShowCreateDialog] = useState(false);

    useEffect(() => {
        if (open) {
            loadCollections();
            setSelectedIds(new Set(initialCollectionIds));
        }
    }, [open, initialCollectionIds]);

    const loadCollections = async () => {
        setIsLoading(true);
        try {
            const { collections } = await getMyCollections();
            setCollections(collections || []);
        } catch (error) {
            console.error("Failed to load collections:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleToggle = (id: string, checked: boolean) => {
        const next = new Set(selectedIds);
        if (checked) {
            next.add(id);
        } else {
            next.delete(id);
        }
        setSelectedIds(next);
    };

    const handleSubmit = async () => {
        startTransition(async () => {
            const result = await syncPostCollections(postId, Array.from(selectedIds));
            if (result.error) {
                toast.error(result.error);
            } else {
                toast.success("已更新所属专栏");
                onOpenChange(false);
            }
        });
    };

    const handleCreateSuccess = () => {
        loadCollections();
        setShowCreateDialog(false);
    };

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>添加到专栏</DialogTitle>
                        <DialogDescription>
                            将此内容添加到您的专栏中进行分类整理
                        </DialogDescription>
                    </DialogHeader>

                    <div className="py-4">
                        {isLoading ? (
                            <div className="flex justify-center py-8">
                                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                            </div>
                        ) : collections.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                <p className="mb-4">您还没有创建任何专栏</p>
                                <Button variant="outline" onClick={() => setShowCreateDialog(true)}>
                                    <Plus className="mr-2 h-4 w-4" /> 新建专栏
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
                                {collections.map((collection) => (
                                    <div key={collection.id} className="flex items-center space-x-3 rounded-md p-2 hover:bg-muted/50 transition-colors">
                                        <Checkbox
                                            id={`collection-${collection.id}`}
                                            checked={selectedIds.has(collection.id)}
                                            onCheckedChange={(checked) => handleToggle(collection.id, checked as boolean)}
                                        />
                                        <Label
                                            htmlFor={`collection-${collection.id}`}
                                            className="flex-1 cursor-pointer flex justify-between items-center text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                        >
                                            <span className="truncate">{collection.name}</span>
                                            <span className="text-xs text-muted-foreground ml-2">
                                                {collection.post_count} 篇
                                            </span>
                                        </Label>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <DialogFooter className="flex-row items-center justify-between sm:justify-between">
                        {collections.length > 0 && (
                            <Button type="button" variant="ghost" size="sm" onClick={() => setShowCreateDialog(true)}>
                                <Plus className="mr-2 h-4 w-4" /> 新建专栏
                            </Button>
                        )}
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={() => onOpenChange(false)}>
                                取消
                            </Button>
                            <Button onClick={handleSubmit} disabled={isPending || isLoading}>
                                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                保存
                            </Button>
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <CreateCollectionDialog
                open={showCreateDialog}
                onOpenChange={setShowCreateDialog}
                onSuccess={handleCreateSuccess}
            />
        </>
    );
}
