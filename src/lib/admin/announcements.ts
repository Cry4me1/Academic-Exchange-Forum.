"use server";

import { createClient } from "@/lib/supabase/server";
import { requireAdmin, logAdminAction } from "@/lib/admin/permissions";
import { revalidatePath } from "next/cache";

export interface SystemAnnouncement {
  id: string;
  title: string;
  content: string;
  category: "system" | "activity" | "maintenance" | "update";
  target_audience: "all" | "vip" | "role";
  target_role: string | null;
  start_time: string;
  end_time: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  creator?: { full_name: string | null } | null;
}

export async function getAnnouncements() {
  await requireAdmin("moderator");
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("system_announcements")
    .select(`
      *,
      creator:profiles!system_announcements_created_by_fkey(full_name)
    `)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching announcements:", error);
    throw new Error("获取公告失败");
  }

  return (data || []).map((a) => ({
    ...a,
    creator: Array.isArray(a.creator) ? a.creator[0] : a.creator,
  })) as SystemAnnouncement[];
}

export async function createAnnouncement(data: {
  title: string;
  content: string;
  category: "system" | "activity" | "maintenance" | "update";
  target_audience: "all" | "vip" | "role";
  target_role?: string | null;
  start_time: string;
  end_time?: string | null;
  is_active: boolean;
}) {
  const adminUser = await requireAdmin("admin");
  const supabase = await createClient();

  const { data: result, error } = await supabase
    .from("system_announcements")
    .insert({
      title: data.title,
      content: data.content,
      category: data.category,
      target_audience: data.target_audience,
      target_role: data.target_role || null,
      start_time: data.start_time,
      end_time: data.end_time || null,
      is_active: data.is_active,
      created_by: adminUser.id,
    })
    .select(`
      *,
      creator:profiles!system_announcements_created_by_fkey(full_name)
    `)
    .single();

  if (error) {
    console.error("Error creating announcement:", error);
    throw new Error("创建公告失败: " + error.message);
  }

  await logAdminAction({
    actionType: "create_announcement",
    targetType: "system_announcement",
    targetId: result.id,
    details: { title: data.title, category: data.category },
  });

  revalidatePath("/admin/announcements");
  revalidatePath("/");
  return {
    ...result,
    creator: Array.isArray(result.creator) ? result.creator[0] : result.creator,
  } as SystemAnnouncement;
}

export async function updateAnnouncement(
  id: string,
  data: {
    title?: string;
    content?: string;
    category?: "system" | "activity" | "maintenance" | "update";
    target_audience?: "all" | "vip" | "role";
    target_role?: string | null;
    start_time?: string;
    end_time?: string | null;
    is_active?: boolean;
  }
) {
  await requireAdmin("admin");
  const supabase = await createClient();

  const { data: result, error } = await supabase
    .from("system_announcements")
    .update(data)
    .eq("id", id)
    .select(`
      *,
      creator:profiles!system_announcements_created_by_fkey(full_name)
    `)
    .single();

  if (error) {
    console.error("Error updating announcement:", error);
    throw new Error("更新公告失败: " + error.message);
  }

  await logAdminAction({
    actionType: "update_announcement",
    targetType: "system_announcement",
    targetId: id,
    details: data,
  });

  revalidatePath("/admin/announcements");
  revalidatePath("/");
  return {
    ...result,
    creator: Array.isArray(result.creator) ? result.creator[0] : result.creator,
  } as SystemAnnouncement;
}

export async function deleteAnnouncement(id: string) {
  await requireAdmin("admin");
  const supabase = await createClient();

  const { error } = await supabase
    .from("system_announcements")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Error deleting announcement:", error);
    throw new Error("删除公告失败: " + error.message);
  }

  await logAdminAction({
    actionType: "delete_announcement",
    targetType: "system_announcement",
    targetId: id,
  });

  revalidatePath("/admin/announcements");
  revalidatePath("/");
}
