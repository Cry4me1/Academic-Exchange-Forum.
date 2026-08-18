"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Plus, Trash2, Edit2, BookMarked, Loader2 } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

import { getMyCollections, deleteCollection } from "../actions";
import { CollectionCard, CreateCollectionDialog } from "@/components/collections";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function ManageCollectionsPage() {
    const router = useRouter();
    const [collections, setCollections] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [editingCollection, setEditingCollection] = useState<any | null>(null);
    
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const loadCollections = async (newCol?: any) => {
        if (newCol && !collections.some(c => c.id === newCol.id)) {
            setCollections(prev => [newCol, ...prev]);
        }
        try {
            const result = await getMyCollections();
            if (result.collections) {
                setCollections(result.collections);
            }
        } catch (error) {
            console.error(error);
            toast.error("加载专栏失败");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadCollections();
    }, []);

    const handleDelete = async () => {
        if (!deleteId) return;
        setIsDeleting(true);
        try {
            const res = await deleteCollection(deleteId);
            if (res.error) {
                toast.error(res.error);
            } else {
                toast.success("删除成功");
                setCollections(prev => prev.filter(c => c.id !== deleteId));
            }
        } catch (error) {
            toast.error("删除出错");
        } finally {
            setIsDeleting(false);
            setDeleteId(null);
        }
    };

    return (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20"
        >
            {/* Header */}
            <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border/50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center gap-4">
                            <Link href="/dashboard">
                                <Button variant="ghost" size="sm" className="gap-2">
                                    <ArrowLeft className="h-4 w-4" />
                                    返回工作台
                                </Button>
                            </Link>
                            <h1 className="text-xl font-semibold flex items-center gap-2">
                                <BookMarked className="h-5 w-5 text-primary" />
                                我的专栏
                            </h1>
                        </div>
                        
                        <Button 
                            onClick={() => {
                                setEditingCollection(null);
                                setIsCreateOpen(true);
                            }}
                            className="gap-2"
                        >
                            <Plus className="h-4 w-4" />
                            新建专栏
                        </Button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {isLoading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {[1, 2, 3, 4].map(i => (
                            <Skeleton key={i} className="h-64 w-full rounded-xl" />
                        ))}
                    </div>
                ) : collections.length === 0 ? (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex flex-col items-center justify-center py-32 text-center"
                    >
                        <div className="w-48 h-48 mb-6 relative opacity-80">
                            <div className="absolute inset-0 bg-primary/10 rounded-full blur-3xl" />
                            <BookMarked className="w-full h-full text-muted-foreground/30" />
                        </div>
                        <h2 className="text-2xl font-semibold mb-2">还没有创建任何专栏</h2>
                        <p className="text-muted-foreground mb-8 max-w-md">
                            专栏可以帮助你将相关的帖子分类整理，形成系列的知识库。快来创建你的第一个专栏吧！
                        </p>
                        <Button 
                            size="lg" 
                            onClick={() => {
                                setEditingCollection(null);
                                setIsCreateOpen(true);
                            }} 
                            className="gap-2"
                        >
                            <Plus className="h-5 w-5" />
                            立即创建
                        </Button>
                    </motion.div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        <AnimatePresence mode="popLayout">
                            {collections.map((collection) => (
                                <motion.div
                                    key={collection.id}
                                    layout
                                    initial={{ opacity: 0, y: 15, scale: 0.96 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                                    transition={{ duration: 0.3 }}
                                    className="relative group"
                                >
                                    <CollectionCard 
                                        id={collection.id}
                                        name={collection.name}
                                        description={collection.description}
                                        coverUrl={collection.cover_url}
                                        coverStyle={collection.cover_style}
                                        postCount={collection.post_count ?? 0}
                                        isPublic={collection.is_public ?? true}
                                        updatedAt={collection.updated_at}
                                    />
                                    
                                    {/* Hover Actions */}
                                    <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                                        <Button 
                                            variant="secondary" 
                                            size="icon" 
                                            className="h-8 w-8 bg-black/40 hover:bg-black/60 text-white border-none backdrop-blur-md"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                setEditingCollection(collection);
                                                setIsCreateOpen(true);
                                            }}
                                            title="编辑专栏"
                                        >
                                            <Edit2 className="h-4 w-4" />
                                        </Button>
                                        <Button 
                                            variant="destructive" 
                                            size="icon" 
                                            className="h-8 w-8 bg-red-500/80 hover:bg-red-600 text-white border-none backdrop-blur-md"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                setDeleteId(collection.id);
                                            }}
                                            title="删除"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </main>

            {/* Create / Edit Dialog */}
            {isCreateOpen && (
                <CreateCollectionDialog 
                    open={isCreateOpen} 
                    onOpenChange={(open) => {
                        setIsCreateOpen(open);
                        if (!open) setEditingCollection(null);
                    }} 
                    editingCollection={editingCollection}
                    onSuccess={(newCol) => loadCollections(newCol)}
                />
            )}

            {/* Delete Alert */}
            <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && !isDeleting && setDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>确认删除该专栏吗？</AlertDialogTitle>
                        <AlertDialogDescription>
                            删除专栏不会删除其中的帖子，但专栏信息和帖子与专栏的关联将被永久删除，且无法恢复。
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>取消</AlertDialogCancel>
                        <AlertDialogAction 
                            onClick={(e) => {
                                e.preventDefault();
                                handleDelete();
                            }}
                            className="bg-red-600 hover:bg-red-700 text-white"
                            disabled={isDeleting}
                        >
                            {isDeleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            确认删除
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </motion.div>
    );
}
