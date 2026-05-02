import {
  getDashboardStats,
  getTrendData,
  getRecentUsers,
  getRecentPosts,
  getRecentReports,
} from "@/lib/admin/queries";
import { requireAdmin } from "@/lib/admin/permissions";
import { DashboardClient } from "./DashboardClient";

export default async function AdminDashboardPage() {
  await requireAdmin("analyst");

  const [stats, trendData, recentUsers, recentPosts, recentReports] =
    await Promise.all([
      getDashboardStats(),
      getTrendData(14),
      getRecentUsers(5),
      getRecentPosts(5),
      getRecentReports(5),
    ]);

  return (
    <DashboardClient
      stats={stats}
      trendData={trendData}
      recentUsers={recentUsers}
      recentPosts={recentPosts}
      recentReports={recentReports}
    />
  );
}
