import { requireAdmin } from "@/lib/admin/permissions";
import {
  getCreditsConfig,
  getCreditStats,
  getCreditTransactions,
  getVipLevelConfig,
  getBatchGrants,
} from "@/lib/admin/credits";
import { CreditsManagementClient } from "./CreditsManagementClient";

export default async function AdminCreditsPage() {
  const admin = await requireAdmin("admin");

  const [config, stats, transactions, vipConfig, batchGrants] =
    await Promise.all([
      getCreditsConfig(),
      getCreditStats(),
      getCreditTransactions({ page: 1, pageSize: 20 }),
      getVipLevelConfig(),
      getBatchGrants(),
    ]);

  return (
    <CreditsManagementClient
      adminRole={admin.role}
      initialConfig={config}
      initialStats={stats}
      initialTransactions={transactions}
      initialVipConfig={vipConfig}
      initialBatchGrants={batchGrants}
    />
  );
}
