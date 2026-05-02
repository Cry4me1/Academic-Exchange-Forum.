import { getAdminComments } from "@/lib/admin/actions";
import { AdminCommentsClient } from "./AdminCommentsClient";

export default async function AdminCommentsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const rawComments = await getAdminComments(id);

  const comments = rawComments.map((comment: any) => ({
    ...comment,
    author: Array.isArray(comment.author) ? comment.author[0] : comment.author,
  }));

  return <AdminCommentsClient postId={id} comments={comments as any} />;
}
