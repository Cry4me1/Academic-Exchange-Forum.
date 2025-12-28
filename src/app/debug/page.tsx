"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function DebugPage() {
    const [profiles, setProfiles] = useState<any[]>([]);
    const [user, setUser] = useState<any>(null);
    const [error, setError] = useState<string>("");
    const supabase = createClient();

    useEffect(() => {
        async function debug() {
            // 1. Check Auth
            const { data: { user }, error: authError } = await supabase.auth.getUser();
            setUser(user);
            if (authError) setError(prev => prev + "\nAuth Error: " + authError.message);

            // 2. Check Profiles (Top 10)
            const { data: allProfiles, error: dbError } = await supabase
                .from("profiles")
                .select("*")
                .limit(10);

            if (dbError) {
                setError(prev => prev + "\nProfiles Error: " + dbError.message + "\nDetails: " + JSON.stringify(dbError));
            } else {
                setProfiles(allProfiles || []);
            }
        }
        debug();
    }, []);

    return (
        <div className="p-8 space-y-4">
            <h1 className="text-2xl font-bold">Debug Console</h1>

            <div className="border p-4 rounded bg-gray-50">
                <h2 className="font-bold">Current User</h2>
                <pre>{user ? JSON.stringify(user, null, 2) : "Not Logged In"}</pre>
            </div>

            <div className="border p-4 rounded bg-gray-50">
                <h2 className="font-bold">Error Log</h2>
                <pre className="text-red-500">{error || "No Errors"}</pre>
            </div>

            <div className="border p-4 rounded bg-gray-50">
                <h2 className="font-bold">All Profiles (Limit 10)</h2>
                <div className="space-y-2">
                    {profiles.map(p => (
                        <div key={p.id} className="border-b pb-2">
                            <p>ID: {p.id}</p>
                            <p>Email: {p.email}</p>
                            <p>Username: {p.username}</p>
                            <p>Avatar: {p.avatar_url}</p>
                        </div>
                    ))}
                </div>
                {profiles.length === 0 && <p>No profiles found via client query.</p>}
            </div>
        </div>
    );
}
