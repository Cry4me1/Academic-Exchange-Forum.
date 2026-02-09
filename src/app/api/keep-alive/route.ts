import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export async function GET() {
    // 优先使用 SERVICE_ROLE_KEY (拥有绕过 RLS 的权限)
    // 如果没有，回退到 ANON_KEY (通常受 RLS 限制，但我们刚才为 _keep_alive 表添加了公共读取策略)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    if (!supabaseUrl || !supabaseKey) {
        return NextResponse.json({ error: 'Missing Supabase environment variables' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    try {
        // 尝试查询数据，这会触发数据库连接
        // 我们查询刚才创建的表，只需要取一个 id 即可
        const { data, error } = await supabase
            .from('_keep_alive')
            .select('id')
            .limit(1)
            .maybeSingle();

        if (error) {
            console.error('Keep-alive ping failed:', error.message);
            return NextResponse.json({ status: 'error', error: error.message }, { status: 500 });
        }

        return NextResponse.json({
            status: 'ok',
            message: 'Database is active',
            timestamp: new Date().toISOString()
        });

    } catch (err: any) {
        console.error('Unexpected error in keep-alive:', err);
        return NextResponse.json({ status: 'error', error: err.message }, { status: 500 });
    }
}
