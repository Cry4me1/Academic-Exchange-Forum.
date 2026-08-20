import { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import PostDetailClient from "./PostDetailClient";
import PublicPostPreview from "./PublicPostPreview";
import { getPostInteractionStatus, getCommentLikeStatus } from "./actions";

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
                bio,
                reputation_score,
                is_developer,
                developer_title,
                special_title,
                badges,
                is_verified,
                auth_provider
            )
        `)
        .eq("id", id)
        .eq("is_published", true)
        .eq("is_hidden", false)
        .single();

    if (error || !post) {
        return null;
    }

    return post;
}

// 辅助函数：从富文本 JSON 或纯文本中安全提取描述纯文本
function extractTextFromJSONContent(content: any): string {
    if (!content) return "";
    
    // 如果是字符串类型（可能是老数据或者是普通字符串）
    if (typeof content === "string") {
        try {
            const parsed = JSON.parse(content);
            if (parsed && typeof parsed === "object") {
                return getPlainText(parsed);
            }
        } catch {
            // 解析失败，当成普通 markdown/HTML 字符串处理
        }
        return content.replace(/<[^>]*>?/gm, ''); // 过滤 HTML 标签
    }
    
    // 如果是对象类型（Novel 的 JSON 格式）
    if (typeof content === "object") {
        return getPlainText(content);
    }
    
    return String(content);
}

function getPlainText(node: any): string {
    if (!node) return "";
    let text = "";
    if (node.text) {
        text += node.text;
    }
    if (Array.isArray(node.content)) {
        text += node.content.map(getPlainText).join(" ");
    } else if (node.content && typeof node.content === "object") {
        text += getPlainText(node.content);
    }
    return text;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { id } = await params;
    const post = await getPost(id);
    if (!post) return {};

    const authorName = post.author?.full_name || post.author?.username || 'Unknown';
    const description = extractTextFromJSONContent(post.content).substring(0, 150);

    return {
        title: post.title,
        description,
        authors: [{ name: authorName }],
        openGraph: {
            title: post.title,
            description,
            authors: [authorName],
            images: post.author?.avatar_url ? [{ url: post.author.avatar_url }] : [],
        },
        other: {
            "scholarly:author": authorName,
            "scholarly:likes": String(post.like_count || 0),
            "scholarly:comments": String(post.comment_count || 0),
            "scholarly:bookmarks": String(post.bookmark_count || 0),
            "scholarly:created_at": post.created_at || "",
        }
    };
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
                avatar_url,
                special_title,
                badges,
                is_verified,
                auth_provider
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
                avatar_url,
                special_title,
                badges,
                is_verified,
                auth_provider
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
        .eq("is_hidden", false)
        .neq("id", currentPostId)
        .order("created_at", { ascending: false })
        .limit(5);

    return posts || [];
}

// 获取帖子共创者
async function getCoAuthors(postId: string) {
    const supabase = await createClient();

    const { data } = await supabase
        .from("post_co_authors")
        .select(`
            id,
            role,
            contribution_summary,
            lab_room_id,
            user:profiles!user_id(
                id,
                full_name,
                username,
                avatar_url
            )
        `)
        .eq("post_id", postId)
        .order("created_at", { ascending: true });

    return data || [];
}

// 获取反向引用（哪些帖子引用了当前帖子）
async function getBacklinks(postId: string) {
    const supabase = await createClient();

    const { data } = await supabase
        .from("post_links")
        .select(`
            source_post_id,
            source_post:posts!source_post_id(
                id,
                title,
                created_at,
                author:profiles!author_id(
                    username,
                    avatar_url
                )
            )
        `)
        .eq("target_post_id", postId)
        .order("created_at", { ascending: false })
        .limit(20);

    return (data || []).map((item: any) => item.source_post).filter(Boolean);
}

// 增加阅读量
async function incrementViewCount(postId: string) {
    const supabase = await createClient();
    await supabase.rpc("increment_view_count", { target_post_id: postId });
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

// 获取帖子所属的专栏及其专栏内文章列表
async function getPostCollections(postId: string) {
    try {
        const supabase = await createClient();

        // 1. 获取该帖子关联的所有专栏ID
        const { data: colPosts, error: colError } = await supabase
            .from("collection_posts")
            .select("collection_id, position")
            .eq("post_id", postId);

        if (colError || !colPosts || colPosts.length === 0) {
            return [];
        }

        const collectionIds = Array.from(new Set(colPosts.map((cp) => cp.collection_id)));

        // 2. 获取专栏详情（公开专栏或当前作者专栏）
        const { data: collections, error: collectionsError } = await supabase
            .from("collections")
            .select("id, name, description, cover_url, cover_style, is_public, post_count, follower_count, view_count, author_id, created_at, updated_at")
            .in("id", collectionIds);

        if (collectionsError || !collections || collections.length === 0) {
            return [];
        }

        // 3. 批量获取各专栏下的所有篇目关联（按 position 升序）
        const { data: allColPosts, error: allColError } = await supabase
            .from("collection_posts")
            .select("collection_id, post_id, position")
            .in("collection_id", collectionIds)
            .order("position", { ascending: true });

        const postsByCollectionId = new Map<string, Array<{ id: string; title: string; position: number; created_at: string }>>();

        if (!allColError && allColPosts && allColPosts.length > 0) {
            const allPostIds = Array.from(new Set(allColPosts.map((item) => item.post_id)));
            
            // 批量查询所有相关帖子的公开信息
            const { data: postsList } = await supabase
                .from("posts")
                .select("id, title, created_at")
                .in("id", allPostIds)
                .eq("is_published", true)
                .eq("is_hidden", false);

            const postMap = new Map((postsList || []).map((p) => [p.id, p]));

            allColPosts.forEach((item) => {
                const postInfo = postMap.get(item.post_id);
                if (!postInfo) return;
                const list = postsByCollectionId.get(item.collection_id) || [];
                list.push({
                    id: postInfo.id,
                    title: postInfo.title,
                    position: item.position ?? 0,
                    created_at: postInfo.created_at,
                });
                postsByCollectionId.set(item.collection_id, list);
            });
        }

        return collections.map((col: any) => ({
            id: col.id,
            name: col.name,
            description: col.description,
            cover_url: col.cover_url,
            cover_style: col.cover_style,
            post_count: col.post_count,
            follower_count: col.follower_count,
            view_count: col.view_count,
            posts: postsByCollectionId.get(col.id) || [],
        }));
    } catch (error) {
        console.error("Failed to load post collections:", error);
        return [];
    }
}

export default async function PostDetailPage({ params }: PageProps) {
    const { id } = await params;

    const [post, currentUser, collections] = await Promise.all([
        getPost(id),
        getCurrentUser().catch(e => {
            console.error("Failed to fetch current user:", e);
            return null;
        }),
        getPostCollections(id).catch(e => {
            console.error("Failed to fetch collections:", e);
            return [];
        }),
    ]);

    if (!post) {
        notFound();
    }

    // 如果未登录（游客），显示只读预览，且不增加浏览量
    if (!currentUser) {
        return <PublicPostPreview post={post} collections={collections} />;
    }

    const comments = await getComments(id).catch(e => {
        console.error("Failed to fetch comments:", e);
        return [];
    });

    // 获取用户互动状态和评论点赞状态
    const [interactionStatus, commentLikeStatus] = await Promise.all([
        getPostInteractionStatus(id),
        getCommentLikeStatus(
            comments.flatMap((c: { id: string; replies?: { id: string }[] }) => [
                c.id,
                ...(c.replies?.map((r: { id: string }) => r.id) || []),
            ])
        ),
    ]);

    // 增加阅读量（非阻塞）
    incrementViewCount(id);

    // 获取作者其他文章、共创者和反向引用
    const [authorOtherPosts, coAuthors, backlinks] = await Promise.all([
        getAuthorOtherPosts(post.author_id, id),
        getCoAuthors(id),
        getBacklinks(id),
    ]);

    return (
        <PostDetailClient
            post={post}
            comments={comments}
            authorOtherPosts={authorOtherPosts}
            currentUser={currentUser}
            initialIsLiked={interactionStatus.isLiked}
            initialIsBookmarked={interactionStatus.isBookmarked}
            commentLikeStatus={commentLikeStatus}
            coAuthors={coAuthors as any}
            backlinks={backlinks}
            collections={collections}
        />
    );
}
