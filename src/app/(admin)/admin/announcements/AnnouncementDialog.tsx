"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { SystemAnnouncement, createAnnouncement, updateAnnouncement } from "@/lib/admin/announcements";
import { toast } from "sonner";
import { format } from "date-fns";

const announcementSchema = z.object({
  title: z.string().min(2, "标题至少2个字符").max(100, "标题不能超过100个字符"),
  content: z.string().min(5, "内容至少5个字符"),
  category: z.enum(["system", "activity", "maintenance", "update"]),
  target_audience: z.enum(["all", "vip", "role"]),
  target_role: z.string().optional(),
  start_time: z.string().min(1, "请选择开始时间"),
  end_time: z.string().optional().nullable(),
  is_active: z.boolean(),
});

type AnnouncementFormValues = z.infer<typeof announcementSchema>;

interface AnnouncementDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  announcement: SystemAnnouncement | null;
  onSuccess: (announcement: SystemAnnouncement) => void;
}

export function AnnouncementDialog({
  isOpen,
  onOpenChange,
  announcement,
  onSuccess,
}: AnnouncementDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Helper to format Date for input[type="datetime-local"]
  const formatForInput = (dateStr: string) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return format(date, "yyyy-MM-dd'T'HH:mm");
  };

  const form = useForm<AnnouncementFormValues>({
    resolver: zodResolver(announcementSchema),
    defaultValues: {
      title: "",
      content: "",
      category: "system",
      target_audience: "all",
      target_role: "",
      start_time: formatForInput(new Date().toISOString()),
      end_time: "",
      is_active: true,
    },
  });

  const targetAudience = form.watch("target_audience");

  useEffect(() => {
    if (announcement) {
      form.reset({
        title: announcement.title,
        content: announcement.content,
        category: announcement.category,
        target_audience: announcement.target_audience,
        target_role: announcement.target_role || "",
        start_time: formatForInput(announcement.start_time),
        end_time: announcement.end_time ? formatForInput(announcement.end_time) : "",
        is_active: announcement.is_active,
      });
    } else {
      form.reset({
        title: "",
        content: "",
        category: "system",
        target_audience: "all",
        target_role: "",
        start_time: formatForInput(new Date().toISOString()),
        end_time: "",
        is_active: true,
      });
    }
  }, [announcement, form, isOpen]);

  async function onSubmit(data: AnnouncementFormValues) {
    setIsSubmitting(true);
    try {
      let result;
      const payload = {
        ...data,
        end_time: data.end_time ? new Date(data.end_time).toISOString() : null,
        start_time: new Date(data.start_time).toISOString(),
        target_role: data.target_audience === "role" ? data.target_role : null,
      };

      if (announcement) {
        result = await updateAnnouncement(announcement.id, payload);
        toast.success("公告已更新");
      } else {
        result = await createAnnouncement(payload);
        toast.success("公告已创建");
      }
      
      onSuccess(result as SystemAnnouncement);
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || "操作失败");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{announcement ? "编辑公告" : "新建公告"}</DialogTitle>
          <DialogDescription>
            {announcement ? "修改现有公告信息" : "创建一个新公告并发布给用户"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>公告标题</FormLabel>
                  <FormControl>
                    <Input placeholder="输入引人注目的标题..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>分类</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="选择分类" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="system">系统通知</SelectItem>
                        <SelectItem value="activity">活动通知</SelectItem>
                        <SelectItem value="maintenance">维护通知</SelectItem>
                        <SelectItem value="update">版本更新</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="target_audience"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>目标受众</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="选择受众" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="all">全部用户</SelectItem>
                        <SelectItem value="vip">VIP 用户</SelectItem>
                        <SelectItem value="role">特定角色</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {targetAudience === "role" && (
              <FormField
                control={form.control}
                name="target_role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>指定角色</FormLabel>
                    <FormControl>
                      <Input placeholder="输入目标角色名称 (如 admin)" {...field} />
                    </FormControl>
                    <FormDescription>该公告仅对该角色的用户可见</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>公告内容</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="编写公告详细内容..." 
                      className="min-h-[150px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="start_time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>开始时间</FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="end_time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>结束时间 (可选)</FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} value={field.value || ""} />
                    </FormControl>
                    <FormDescription>留空则永久有效</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="is_active"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">是否激活</FormLabel>
                    <FormDescription>
                      关闭后，即便是处于有效时间内的公告也不会显示
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                取消
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "保存中..." : "保存"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
