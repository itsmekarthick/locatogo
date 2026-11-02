import { NextResponse } from "next/server";
import { Resend } from "resend";
import { render } from "@react-email/render";
import { timingSafeEqual } from "node:crypto";
import { Webhook } from "standardwebhooks";
import { z } from "zod";
import VerificationEmail from "@/components/emails/verification-email";

const payloadSchema = z.object({
  user: z.object({ email: z.string().email() }),
  email_data: z.object({
    email_action_type: z.string(),
    token_hash: z.string().min(1),
    redirect_to: z.string().url(),
  }),
});

export async function POST(req: Request) {
  try {
    const expectedSecret = process.env.SUPABASE_WEBHOOK_SECRET;
    const signingSecret = process.env.SEND_EMAIL_HOOK_SECRET || (expectedSecret?.startsWith("v1,whsec_") ? expectedSecret : undefined);
    if (!expectedSecret && !signingSecret) {
      console.error("[Auth Webhook] Hook authentication is not configured.");
      return NextResponse.json({ error: "Email hook is not configured." }, { status: 503 });
    }
    const { searchParams } = new URL(req.url);
    const providedSecret = searchParams.get("secret");
    const body = await req.text();
    let authenticated = false;
    if (providedSecret && expectedSecret && !expectedSecret.startsWith("v1,whsec_")) {
      const provided = Buffer.from(providedSecret);
      const expected = Buffer.from(expectedSecret);
      authenticated = provided.length === expected.length && timingSafeEqual(provided, expected);
    }
    if (!authenticated && signingSecret) {
      try {
        new Webhook(signingSecret.replace(/^v1,whsec_/, "")).verify(body, Object.fromEntries(req.headers));
        authenticated = true;
      } catch {
        console.error("[Auth Webhook] Invalid webhook signature.");
      }
    }
    if (!authenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let payload: unknown;
    try {
      payload = JSON.parse(body);
    } catch {
      return NextResponse.json({ error: "Invalid email hook payload." }, { status: 400 });
    }
    const parsed = payloadSchema.safeParse(payload);
    if (!parsed.success) return NextResponse.json({ error: "Invalid email hook payload." }, { status: 400 });
    const { user, email_data } = parsed.data;
    const { email_action_type, token_hash, redirect_to } = email_data;

    if (email_action_type !== "signup") {
      console.log(`[Auth Webhook] Ignoring action type: ${email_action_type}`);
      return NextResponse.json({ message: "Action ignored" });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
    if (!supabaseUrl || !process.env.RESEND_API_KEY) {
      console.error("[Auth Webhook] Supabase URL or Resend API key is missing.");
      return NextResponse.json({ error: "Email delivery is not configured." }, { status: 503 });
    }
    const verificationUrl = new URL("/auth/v1/verify", supabaseUrl);
    verificationUrl.search = new URLSearchParams({ token: token_hash, type: email_action_type, redirect_to }).toString();
    const emailHtml = await render(
      VerificationEmail({
        userEmail: user.email,
        verificationLink: verificationUrl.toString(),
      })
    );

    const resend = new Resend(process.env.RESEND_API_KEY);
    const { error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || "LocaToGo <support@locatogo.com>",
      to: [user.email],
      subject: "Welcome to LocaToGo! Please verify your email.",
      html: emailHtml,
    });

    if (error) {
      console.error("[Auth Webhook] Resend delivery failed:", error.name);
      return NextResponse.json({ error: "Unable to deliver the verification email." }, { status: 502 });
    }

    return NextResponse.json({});
  } catch (error: unknown) {
    console.error("[Auth Webhook] Processing failed:", error instanceof Error ? error.name : "Unknown error");
    return NextResponse.json({ error: "Unable to process the verification email." }, { status: 500 });
  }
}
