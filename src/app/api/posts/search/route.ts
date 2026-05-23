import { NextRequest, NextResponse } from "next/server";
import { createPublicClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
    const q = request.nextUrl.searchParams.get("q")?.trim();

    try {
        const supabase = createPublicClient();
        let query = supabase
            .from("posts")
            .select(
                `id, title, author:profiles!author_id(username, avatar_url)`
            )
            .eq("is_published", true)
            .eq("is_hidden", false);

        if (q && q.length >= 1) {
            query = query.ilike("title", `%${q}%`);
        }

        const { data, error } = await query
            .order("created_at", { ascending: false })
            .limit(5);

        if (error) {
            console.error("Post search error:", error);
            return NextResponse.json([], { status: 500 });
        }

        return NextResponse.json(data || []);
    } catch (err) {
        console.error("Unexpected post search error:", err);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
