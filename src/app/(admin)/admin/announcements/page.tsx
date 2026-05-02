import { requireAdmin } from "@/lib/admin/permissions";
import { getAnnouncements } from "@/lib/admin/announcements";
import AnnouncementsClient from "./AnnouncementsClient";

export const metadata = {
  title: "公告管理 | Admin Dashboard",
};

export default async function AdminAnnouncementsPage() {
  await requireAdmin("moderator");
  const announcements = await getAnnouncements();

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">公告管理</h2>
      </div>
      <div className="hidden h-full flex-1 flex-col space-y-8 md:flex">
        <AnnouncementsClient initialAnnouncements={announcements} />
      </div>
    </div>
  );
}
