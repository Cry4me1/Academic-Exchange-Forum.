import { createBrowserClient } from "@supabase/ssr";

let clientSingleton: ReturnType<typeof createBrowserClient> | null = null;

export function createClient() {
  if (!clientSingleton) {
    clientSingleton = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }
  return clientSingleton;
}
