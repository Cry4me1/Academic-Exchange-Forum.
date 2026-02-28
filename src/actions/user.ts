"use server";

import { createClient } from "@/lib/supabase/server";

export async function getUserCount(): Promise<number> {
    const supabase = await createClient();
    const { count, error } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

    if (error) {
        console.error('获取用户数量失败:', error);
        return 0;
    }

    return count ?? 0;
}
