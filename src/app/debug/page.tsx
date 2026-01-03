"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function DebugPage() {
    const [profiles, setProfiles] = useState<any[]>([]);
    const [user, setUser] = useState<any>(null);
    const [session, setSession] = useState<any>(null);
    const [currentProfile, setCurrentProfile] = useState<any>(null);
    const [errors, setErrors] = useState<string[]>([]);
    const supabase = createClient();

    const addError = (msg: string) => setErrors(prev => [...prev, msg]);

    useEffect(() => {
        async function debug() {
            // 1. Check Session (important!)
            const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
            if (sessionError) {
                addError(`Session Error: ${sessionError.message}`);
            } else {
                setSession(sessionData.session);
            }

            // 2. Check User
            const { data: { user }, error: authError } = await supabase.auth.getUser();
            if (authError) {
                addError(`Auth Error: ${authError.message}`);
            }
            setUser(user);

            // 3. If user exists, get their profile
            if (user) {
                const { data: profile, error: profileErr } = await supabase
                    .from("profiles")
                    .select("*")
                    .eq("id", user.id)
                    .single();

                if (profileErr) {
                    addError(`Profile Query Error: ${profileErr.message} (Code: ${profileErr.code})`);
                } else {
                    setCurrentProfile(profile);
                }
            }

            // 4. Check All Profiles
            const { data: allProfiles, error: dbError } = await supabase
                .from("profiles")
                .select("*")
                .limit(10);

            if (dbError) {
                addError(`Profiles List Error: ${dbError.message}`);
            } else {
                setProfiles(allProfiles || []);
            }
        }
        debug();
    }, [supabase]);

    return (
        <div className="p-8 space-y-4 max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold">🔍 调试控制台</h1>

            {/* Session Status */}
            <div className="border p-4 rounded bg-blue-50">
                <h2 className="font-bold text-blue-800">📦 Session 状态</h2>
                <p className="text-sm">
                    {session ? (
                        <span className="text-green-600">✅ Session 存在 (过期时间: {new Date(session.expires_at * 1000).toLocaleString()})</span>
                    ) : (
                        <span className="text-red-600">❌ 无 Session - 用户未登录或Cookie丢失</span>
                    )}
                </p>
            </div>

            {/* Current User */}
            <div className="border p-4 rounded bg-gray-50">
                <h2 className="font-bold">👤 当前认证用户 (auth.getUser)</h2>
                {user ? (
                    <div className="text-sm space-y-1 mt-2">
                        <p><strong>ID:</strong> {user.id}</p>
                        <p><strong>Email:</strong> {user.email}</p>
                        <p><strong>Created:</strong> {new Date(user.created_at).toLocaleString()}</p>
                        <p><strong>User Metadata:</strong></p>
                        <pre className="bg-gray-200 p-2 rounded text-xs overflow-auto">
                            {JSON.stringify(user.user_metadata, null, 2)}
                        </pre>
                    </div>
                ) : (
                    <p className="text-red-500">未登录</p>
                )}
            </div>

            {/* Current User's Profile */}
            <div className="border p-4 rounded bg-green-50">
                <h2 className="font-bold text-green-800">📋 当前用户的 Profile (profiles表)</h2>
                {currentProfile ? (
                    <div className="text-sm space-y-1 mt-2">
                        <p><strong>ID:</strong> {currentProfile.id}</p>
                        <p><strong>Email:</strong> {currentProfile.email || <span className="text-red-500">⚠️ 空</span>}</p>
                        <p><strong>Username:</strong> {currentProfile.username || <span className="text-red-500">⚠️ 空</span>}</p>
                        <p><strong>Avatar:</strong> {currentProfile.avatar_url || <span className="text-gray-400">无</span>}</p>
                    </div>
                ) : user ? (
                    <p className="text-orange-600">⚠️ 用户已登录但没有找到对应的 Profile 记录</p>
                ) : (
                    <p className="text-gray-500">（请先登录）</p>
                )}
            </div>

            {/* Error Log */}
            <div className="border p-4 rounded bg-red-50">
                <h2 className="font-bold text-red-800">🚨 错误日志</h2>
                {errors.length > 0 ? (
                    <ul className="list-disc list-inside text-sm text-red-600 space-y-1 mt-2">
                        {errors.map((e, i) => <li key={i}>{e}</li>)}
                    </ul>
                ) : (
                    <p className="text-green-600 text-sm">✅ 无错误</p>
                )}
            </div>

            {/* All Profiles */}
            <div className="border p-4 rounded bg-gray-50">
                <h2 className="font-bold">📊 所有 Profiles (前10条)</h2>
                <div className="mt-2 overflow-x-auto">
                    <table className="w-full text-sm border-collapse">
                        <thead>
                            <tr className="bg-gray-200">
                                <th className="border p-2 text-left">ID (前8位)</th>
                                <th className="border p-2 text-left">Email</th>
                                <th className="border p-2 text-left">Username</th>
                                <th className="border p-2 text-left">Avatar</th>
                            </tr>
                        </thead>
                        <tbody>
                            {profiles.map(p => (
                                <tr key={p.id} className="hover:bg-gray-100">
                                    <td className="border p-2 font-mono text-xs">{p.id.substring(0, 8)}...</td>
                                    <td className="border p-2">{p.email || <span className="text-red-500">空</span>}</td>
                                    <td className="border p-2">{p.username || <span className="text-red-500">空</span>}</td>
                                    <td className="border p-2">{p.avatar_url || <span className="text-gray-400">无</span>}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {profiles.length === 0 && <p className="text-gray-500 mt-2">没有找到任何 profiles 记录</p>}
                </div>
            </div>

            {/* Action Hints */}
            <div className="border p-4 rounded bg-yellow-50">
                <h2 className="font-bold text-yellow-800">💡 修复建议</h2>
                <ul className="list-disc list-inside text-sm space-y-1 mt-2">
                    <li>如果 Session 为空：请重新登录 <a href="/login" className="text-blue-600 underline">前往登录</a></li>
                    <li>如果 Profile 数据为空：请在 Supabase SQL Editor 运行 <code className="bg-gray-200 px-1 rounded">20251228_urgent_profile_sync.sql</code></li>
                </ul>
            </div>
        </div>
    );
}

