import { requireAdmin } from "@/lib/admin/permissions";
import { getModerationLogsList } from "@/lib/admin/review-actions";
import { ModerationLogsClient } from "./ModerationLogsClient";

export default async function AdminModerationLogsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; risk?: string; action?: string }>;
}) {
  await requireAdmin("moderator");
  const params = await searchParams;

  const page = parseInt(params.page ?? "1");
  const risk = params.risk ?? "";
  const action = params.action ?? "";

  const result = await getModerationLogsList({
    page,
    riskLevel: risk,
    action,
  });

  return (
    <ModerationLogsClient
      logs={result.logs}
      totalCount={result.totalCount}
      currentPage={result.currentPage}
      pageSize={result.pageSize}
      riskFilter={risk}
      actionFilter={action}
    />
  );
}
