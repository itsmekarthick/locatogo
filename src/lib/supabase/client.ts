import { createBrowserClient } from "@supabase/ssr";

export function createSupabaseBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://xpqizarctxbexawnzogb.supabase.co";
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "sb_publishable_XFsYigKpFPQhMK9X73FBSQ_K25rV-xm";
  return createBrowserClient(url, key);
}
