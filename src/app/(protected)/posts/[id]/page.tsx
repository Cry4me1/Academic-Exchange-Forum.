import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import PostDetailClient from "./PostDetailClient";

interface PageProps {
    params: Promise<{ id: string }>;
}

// 获取帖子详情
async function getPost(id: string) {
    const supabase = await createClient();

    const { data: post, error } = await supabase
        .from("posts")
        .select(`
            *,
            author:profiles!author_id (
                id,
                username,
                full_name,
                avatar_url,
                bio
            )
        `)
        .eq("id", id)
        .eq("is_published", true)
        .single();

    if (error || !post) {
        return null;
    }

    return post;
}

// 获取评论列表（带嵌套回复）
async function getComments(postId: string) {
    const supabase = await createClient();

    // 获取顶级评论
    const { data: topLevelComments, error } = await supabase
        .from("comments")
        .select(`
            *,
            author:profiles!author_id (
                id,
                username,
                full_name,
                avatar_url
            )
        `)
        .eq("post_id", postId)
        .is("parent_id", null)
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Failed to fetch comments:", JSON.stringify(error, null, 2));
        return [];
    }

    // 获取所有回复
    const { data: replies } = await supabase
        .from("comments")
        .select(`
            *,
            author:profiles!author_id (
                id,
                username,
                full_name,
                avatar_url
            )
        `)
        .eq("post_id", postId)
        .not("parent_id", "is", null)
        .order("created_at", { ascending: true });

    // 构建嵌套结构
    const commentMap = new Map();
    topLevelComments?.forEach((comment) => {
        commentMap.set(comment.id, { ...comment, replies: [] });
    });

    replies?.forEach((reply) => {
        const parent = commentMap.get(reply.parent_id);
        if (parent) {
            parent.replies.push({
                ...reply,
                replies: [], // 限制2层，第二层不再有子回复
            });
        }
    });

    return Array.from(commentMap.values());
}

// 获取作者其他文章
async function getAuthorOtherPosts(authorId: string, currentPostId: string) {
    const supabase = await createClient();

    const { data: posts } = await supabase
        .from("posts")
        .select("id, title, created_at")
        .eq("author_id", authorId)
        .eq("is_published", true)
        .neq("id", currentPostId)
        .order("created_at", { ascending: false })
        .limit(5);

    return posts || [];
}

// 增加阅读量
async function incrementViewCount(postId: string) {
    const supabase = await createClient();
    await supabase.rpc("increment_view_count", { post_id: postId });
}

// 获取当前用户
async function getCurrentUser() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return null;

    const { data: profile } = await supabase
        .from("profiles")
        .select("id, username, avatar_url")
        .eq("id", user.id)
        .single();

    return profile;
}

export default async function PostDetailPage({ params }: PageProps) {
    const { id } = await params;

    const [post, comments, currentUser] = await Promise.all([
        getPost(id),
        getComments(id),
        getCurrentUser(),
    ]);

    if (!post) {
        notFound();
    }

    // 增加阅读量
    await incrementViewCount(id);

    // 获取作者其他文章
    const authorOtherPosts = await getAuthorOtherPosts(post.author_id, id);

    return (
        <PostDetailClient
            post={post}
            comments={comments}
            authorOtherPosts={authorOtherPosts}
            currentUser={currentUser}
        />
    );
}
