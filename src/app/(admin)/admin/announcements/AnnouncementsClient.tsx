"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Plus, Edit2, Trash2, Megaphone, Activity, Wrench, RefreshCw, Users, Star, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SystemAnnouncement, deleteAnnouncement } from "@/lib/admin/announcements";
import { toast } from "sonner";
import { AnnouncementDialog } from "./AnnouncementDialog";
import { useRouter } from "next/navigation";
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

interface AnnouncementsClientProps {
  initialAnnouncements: SystemAnnouncement[];
}

const CategoryIcon = ({ category }: { category: string }) => {
  switch (category) {
    case "system":
      return <Megaphone className="h-4 w-4 text-blue-500" />;
    case "activity":
      return <Activity className="h-4 w-4 text-orange-500" />;
    case "maintenance":
      return <Wrench className="h-4 w-4 text-amber-500" />;
    case "update":
      return <RefreshCw className="h-4 w-4 text-green-500" />;
    default:
      return <Megaphone className="h-4 w-4" />;
  }
};

const AudienceIcon = ({ audience }: { audience: string }) => {
  switch (audience) {
    case "all":
      return <Users className="h-3 w-3" />;
    case "vip":
      return <Star className="h-3 w-3 text-yellow-500" />;
    case "role":
      return <Shield className="h-3 w-3 text-purple-500" />;
    default:
      return <Users className="h-3 w-3" />;
  }
};

export default function AnnouncementsClient({ initialAnnouncements }: AnnouncementsClientProps) {
  const [announcements, setAnnouncements] = useState(initialAnnouncements);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<SystemAnnouncement | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [announcementToDelete, setAnnouncementToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  const handleCreate = () => {
    setEditingAnnouncement(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (announcement: SystemAnnouncement) => {
    setEditingAnnouncement(announcement);
    setIsDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!announcementToDelete) return;
    setIsDeleting(true);
    try {
      await deleteAnnouncement(announcementToDelete);
      setAnnouncements(announcements.filter((a) => a.id !== announcementToDelete));
      toast.success("公告删除成功");
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || "删除公告失败");
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
      setAnnouncementToDelete(null);
    }
  };

  const handleDeleteClick = (id: string) => {
    setAnnouncementToDelete(id);
    setIsDeleteDialogOpen(true);
  };

  const categoryMap: Record<string, string> = {
    system: "系统通知",
    activity: "活动通知",
    maintenance: "维护通知",
    update: "版本更新",
  };

  const audienceMap: Record<string, string> = {
    all: "全部用户",
    vip: "VIP 用户",
    role: "特定角色",
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <p className="text-sm text-muted-foreground">管理系统内的各类通知和公告</p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" /> 新建公告
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {announcements.map((announcement) => (
          <Card key={announcement.id} className="flex flex-col">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div className="flex items-center space-x-2">
                  <CategoryIcon category={announcement.category} />
                  <CardTitle className="text-base font-medium line-clamp-1">
                    {announcement.title}
                  </CardTitle>
                </div>
                <div className="flex space-x-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(announcement)}>
                    <Edit2 className="h-4 w-4 text-muted-foreground" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-destructive" onClick={() => handleDeleteClick(announcement.id)}>
                    <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                  </Button>
                </div>
              </div>
              <CardDescription className="flex items-center space-x-2 mt-2">
                <Badge variant="outline" className="flex items-center gap-1 font-normal text-xs">
                  <AudienceIcon audience={announcement.target_audience} />
                  {audienceMap[announcement.target_audience] || "未知受众"}
                  {announcement.target_audience === "role" && ` (${announcement.target_role})`}
                </Badge>
                <Badge variant={announcement.is_active ? "default" : "secondary"} className="font-normal text-xs">
                  {announcement.is_active ? "生效中" : "已停用"}
                </Badge>
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-between">
              <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                {announcement.content}
              </p>
              <div className="text-xs text-muted-foreground space-y-1">
                <div>发布者: {announcement.creator?.full_name || "未知"}</div>
                <div>开始: {format(new Date(announcement.start_time), "yyyy-MM-dd HH:mm")}</div>
                {announcement.end_time && (
                  <div>结束: {format(new Date(announcement.end_time), "yyyy-MM-dd HH:mm")}</div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {announcements.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Megaphone className="h-10 w-10 text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-medium text-muted-foreground">暂无公告</h3>
          <p className="text-sm text-muted-foreground mt-1">点击"新建公告"按钮创建第一条公告</p>
        </div>
      )}

      <AnnouncementDialog
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        announcement={editingAnnouncement}
        onSuccess={(updated: SystemAnnouncement) => {
          if (editingAnnouncement) {
            setAnnouncements(announcements.map(a => a.id === updated.id ? updated : a));
          } else {
            setAnnouncements([updated, ...announcements]);
          }
        }}
      />

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除公告？</AlertDialogTitle>
            <AlertDialogDescription>
              此操作不可撤销。删除后，用户将无法再看到此公告。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>取消</AlertDialogCancel>
            <AlertDialogAction onClick={(e) => { e.preventDefault(); handleDeleteConfirm(); }} disabled={isDeleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {isDeleting ? "删除中..." : "确认删除"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
