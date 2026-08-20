import { requireAdmin } from "@/lib/admin/permissions";
import { getSensitiveWordsList } from "@/lib/admin/review-actions";
import { SensitiveWordsClient } from "./SensitiveWordsClient";

export default async function AdminSensitiveWordsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; category?: string; level?: string }>;
}) {
  await requireAdmin("moderator");
  const params = await searchParams;

  const search = params.search ?? "";
  const category = params.category ?? "";
  const level = params.level ?? "";

  const words = await getSensitiveWordsList({
    search,
    category,
    matchLevel: level,
  });

  return (
    <SensitiveWordsClient
      words={words}
      search={search}
      categoryFilter={category}
      levelFilter={level}
    />
  );
}
