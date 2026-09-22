export type EmailType = "welcome" | "email_verified" | "password_reset_sent" | "listing_published";

export interface DefaultEmailTemplate {
  type: EmailType;
  name: string;
  description: string;
  subject: string;
  htmlContent: string;
  availableVariables: string[];
}

export const DEFAULT_EMAIL_TEMPLATES: Record<EmailType, DefaultEmailTemplate> = {
  welcome: {
    type: "welcome",
    name: "Welcome Email",
    description: "Sent to new users immediately after registering their account.",
    subject: "Welcome to LocaToGo, {{displayName}}! 🎉",
    availableVariables: ["displayName", "email", "appUrl", "year"],
    htmlContent: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to LocaToGo</title>
</head>
<body style="margin: 0; padding: 40px 16px; background-color: #f0f6ff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <div style="max-width: 580px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(14, 88, 161, 0.08);">
    <div style="background: linear-gradient(135deg, #0ea5e9 0%, #0369a1 100%); padding: 36px 32px; text-align: center;">
      <div style="font-size: 36px; margin-bottom: 6px;">📍</div>
      <div style="color: #ffffff; font-size: 26px; font-weight: 800; letter-spacing: -0.03em;">LocaToGo<span style="color: #fdba74;">.</span></div>
      <p style="color: rgba(255, 255, 255, 0.85); font-size: 13px; margin: 6px 0 0;">Global Tech Atlas & Ecosystem Directory</p>
    </div>
    <div style="padding: 36px 32px 24px;">
      <h1 style="color: #0f172a; font-size: 22px; font-weight: 700; margin: 0 0 16px;">Welcome, {{displayName}}! 🎉</h1>
      <p style="color: #475569; font-size: 15px; line-height: 1.6; margin: 0 0 14px;">
        You have joined <strong>LocaToGo</strong> — the real-time tech atlas mapping verified tech companies, startups, and open job roles across major tech hubs.
      </p>
      <p style="color: #475569; font-size: 15px; line-height: 1.6; margin: 0 0 24px;">
        Discover hiring companies near you, explore tech corridors, and connect directly with official careers portals.
      </p>
      <div style="text-align: center; margin: 32px 0;">
        <a href="{{appUrl}}/tech" style="display: inline-block; background-color: #0284c7; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 15px; padding: 14px 32px; border-radius: 9999px; box-shadow: 0 4px 14px rgba(2, 132, 199, 0.35);">
          🚀 Explore the Tech Atlas
        </a>
      </div>
      <div style="border-top: 1px solid #e2e8f0; margin: 28px 0 24px;"></div>
      <p style="color: #334155; font-size: 14px; font-weight: 600; margin: 0 0 10px;">What you can do on LocaToGo:</p>
      <ul style="color: #475569; font-size: 14px; line-height: 1.8; margin: 0; padding-left: 20px;">
        <li>🗺️ Interactive map search across top metro tech parks</li>
        <li>💼 Direct links to official ATS career job openings</li>
        <li>🔍 Filter by sector, company size, and technologies</li>
      </ul>
    </div>
    <div style="background-color: #f8fafc; border-top: 1px solid #f1f5f9; padding: 24px 32px; text-align: center;">
      <p style="color: #94a3b8; font-size: 12px; margin: 0 0 6px;">
        Sent to <span style="color: #64748b; font-weight: 500;">{{email}}</span>
      </p>
      <p style="color: #94a3b8; font-size: 12px; margin: 0;">
        © LocaToGo. All rights reserved. • <a href="{{appUrl}}" style="color: #0284c7; text-decoration: none;">locatogo.com</a>
      </p>
    </div>
  </div>
</body>
</html>`,
  },

  email_verified: {
    type: "email_verified",
    name: "Email Verified Confirmation",
    description: "Sent once a user verifies their email address via the confirmation link.",
    subject: "Your email has been verified — Welcome to LocaToGo! ✅",
    availableVariables: ["displayName", "email", "appUrl", "year"],
    htmlContent: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Email Verified</title>
</head>
<body style="margin: 0; padding: 40px 16px; background-color: #f0f6ff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <div style="max-width: 580px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(14, 88, 161, 0.08);">
    <div style="background: linear-gradient(135deg, #059669 0%, #047857 100%); padding: 36px 32px; text-align: center;">
      <div style="font-size: 36px; margin-bottom: 6px;">✅</div>
      <div style="color: #ffffff; font-size: 26px; font-weight: 800; letter-spacing: -0.03em;">Email Confirmed</div>
      <p style="color: rgba(255, 255, 255, 0.9); font-size: 13px; margin: 6px 0 0;">Your LocaToGo account is fully active</p>
    </div>
    <div style="padding: 36px 32px 24px;">
      <h1 style="color: #0f172a; font-size: 22px; font-weight: 700; margin: 0 0 16px;">Hello, {{displayName}}! 👋</h1>
      <p style="color: #475569; font-size: 15px; line-height: 1.6; margin: 0 0 20px;">
        Thank you for verifying your email address. Your account is now fully unlocked with full access to the tech directory, job feeds, and saved listings.
      </p>
      <div style="text-align: center; margin: 32px 0;">
        <a href="{{appUrl}}/tech" style="display: inline-block; background-color: #059669; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 15px; padding: 14px 32px; border-radius: 9999px; box-shadow: 0 4px 14px rgba(5, 150, 105, 0.35);">
          Start Exploring
        </a>
      </div>
    </div>
    <div style="background-color: #f8fafc; border-top: 1px solid #f1f5f9; padding: 24px 32px; text-align: center;">
      <p style="color: #94a3b8; font-size: 12px; margin: 0;">
        © LocaToGo • <a href="{{appUrl}}" style="color: #059669; text-decoration: none;">locatogo.com</a>
      </p>
    </div>
  </div>
</body>
</html>`,
  },

  password_reset_sent: {
    type: "password_reset_sent",
    name: "Password Reset Request",
    description: "Sent when a user requests a password reset.",
    subject: "Reset your LocaToGo password 🔐",
    availableVariables: ["email", "resetLink", "appUrl", "year"],
    htmlContent: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Password Reset</title>
</head>
<body style="margin: 0; padding: 40px 16px; background-color: #f0f6ff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <div style="max-width: 580px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(14, 88, 161, 0.08);">
    <div style="background: linear-gradient(135deg, #475569 0%, #1e293b 100%); padding: 36px 32px; text-align: center;">
      <div style="font-size: 36px; margin-bottom: 6px;">🔐</div>
      <div style="color: #ffffff; font-size: 26px; font-weight: 800;">Password Reset</div>
      <p style="color: rgba(255, 255, 255, 0.85); font-size: 13px; margin: 6px 0 0;">LocaToGo Account Security</p>
    </div>
    <div style="padding: 36px 32px 24px;">
      <h1 style="color: #0f172a; font-size: 20px; font-weight: 700; margin: 0 0 16px;">Reset your password</h1>
      <p style="color: #475569; font-size: 15px; line-height: 1.6; margin: 0 0 20px;">
        We received a request to reset the password for your account associated with <strong>{{email}}</strong>.
      </p>
      <div style="text-align: center; margin: 32px 0;">
        <a href="{{resetLink}}" style="display: inline-block; background-color: #2563eb; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 15px; padding: 14px 32px; border-radius: 9999px; box-shadow: 0 4px 14px rgba(37, 99, 235, 0.35);">
          Reset Password
        </a>
      </div>
      <p style="color: #64748b; font-size: 13px; line-height: 1.5; margin: 24px 0 0;">
        If you did not request this change, you can safely ignore this email. This link will expire shortly.
      </p>
    </div>
    <div style="background-color: #f8fafc; border-top: 1px solid #f1f5f9; padding: 24px 32px; text-align: center;">
      <p style="color: #94a3b8; font-size: 12px; margin: 0;">
        © LocaToGo • <a href="{{appUrl}}" style="color: #2563eb; text-decoration: none;">locatogo.com</a>
      </p>
    </div>
  </div>
</body>
</html>`,
  },

  listing_published: {
    type: "listing_published",
    name: "Listing Published Notification",
    description: "Sent when an admin or business owner publishes a company or place listing live.",
    subject: "Your company listing is now live on LocaToGo! 🚀",
    availableVariables: ["listingTitle", "listingUrl", "appUrl", "year"],
    htmlContent: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Listing Published</title>
</head>
<body style="margin: 0; padding: 40px 16px; background-color: #f0f6ff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <div style="max-width: 580px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(14, 88, 161, 0.08);">
    <div style="background: linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%); padding: 36px 32px; text-align: center;">
      <div style="font-size: 36px; margin-bottom: 6px;">🏢</div>
      <div style="color: #ffffff; font-size: 26px; font-weight: 800;">Listing is Live!</div>
      <p style="color: rgba(255, 255, 255, 0.85); font-size: 13px; margin: 6px 0 0;">LocaToGo Ecosystem Directory</p>
    </div>
    <div style="padding: 36px 32px 24px;">
      <h1 style="color: #0f172a; font-size: 20px; font-weight: 700; margin: 0 0 16px;">{{listingTitle}} is now published</h1>
      <p style="color: #475569; font-size: 15px; line-height: 1.6; margin: 0 0 20px;">
        Great news! The listing for <strong>{{listingTitle}}</strong> is now publicly visible on the LocaToGo interactive atlas. Users can discover your office location, open roles, and company website.
      </p>
      <div style="text-align: center; margin: 32px 0;">
        <a href="{{listingUrl}}" style="display: inline-block; background-color: #7c3aed; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 15px; padding: 14px 32px; border-radius: 9999px; box-shadow: 0 4px 14px rgba(124, 58, 237, 0.35);">
          View Listing Live
        </a>
      </div>
    </div>
    <div style="background-color: #f8fafc; border-top: 1px solid #f1f5f9; padding: 24px 32px; text-align: center;">
      <p style="color: #94a3b8; font-size: 12px; margin: 0;">
        © LocaToGo • <a href="{{appUrl}}" style="color: #7c3aed; text-decoration: none;">locatogo.com</a>
      </p>
    </div>
  </div>
</body>
</html>`,
  },
};
