import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { sendTemplatedEmail } from "@/lib/email/send";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/admin";
  const type = searchParams.get("type");

  if (code) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error) {
      // If it's a password recovery callback, redirect to reset-password form
      if (type === "recovery") {
        return NextResponse.redirect(`${origin}/auth/reset-password`);
      }
      
      // Check user role to determine redirect
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Send email_verified confirmation
        if (user.email) {
          const displayName =
            user.user_metadata?.display_name ||
            user.email.split("@")[0] ||
            "Member";

          sendTemplatedEmail({
            type: "email_verified",
            to: user.email,
            variables: {
              displayName,
              email: user.email,
            },
          }).catch((err) =>
            console.error("[auth] Failed to dispatch email_verified email:", err)
          );
        }

        const { data: profile } = await supabase.from("profiles").select("platform_role").eq("id", user.id).single();
        if (profile?.platform_role === "tech_user") {
          return NextResponse.redirect(`${origin}/tech`);
        }
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
    console.error("Auth callback error exchanging code:", error.message);
  }

  // Return to login with error notice if authentication failed
  return NextResponse.redirect(`${origin}/auth/login?error=Authentication failed or link expired.`);
}

