import { NextResponse } from "next/server";
import { Resend } from "resend";
import { render } from "@react-email/render";
import VerificationEmail from "@/components/emails/verification-email";

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY || "re_fallback");

export async function POST(req: Request) {
  try {
    // Basic Auth Check (To ensure only Supabase can hit this hook)
    // You set this secret in the Supabase Dashboard when you add the webhook URL
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.SUPABASE_WEBHOOK_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = await req.json();
    const { user, email_data } = payload;
    const { email_action_type, token_hash, redirect_to } = email_data;

    // We only care about signups (you can easily add password resets later!)
    if (email_action_type !== "signup") {
      return NextResponse.json({ message: "Action ignored" });
    }

    // Construct the standard Supabase verification URL that automatically issues the callback
    const verificationUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/verify?token=${token_hash}&type=${email_action_type}&redirect_to=${redirect_to}`;

    // Render the beautiful React Email template into HTML
    const emailHtml = await render(
      VerificationEmail({
        userEmail: user.email,
        verificationLink: verificationUrl,
      })
    );

    // Send the email via Resend
    const { data, error } = await resend.emails.send({
      from: "Mapora <hello@mapora.co>", // Change this to your verified Resend domain!
      to: [user.email],
      subject: "Welcome to Mapora! Please verify your email.",
      html: emailHtml,
    });

    if (error) {
      console.error("Resend error:", error);
      return NextResponse.json({ error }, { status: 400 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error("Webhook error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
