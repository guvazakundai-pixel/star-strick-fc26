const RESEND_API_KEY = process.env.RESEND_API_KEY || "";
const SMTP_HOST = process.env.SMTP_HOST || "";
const SMTP_PORT = parseInt(process.env.SMTP_PORT || "587");
const SMTP_USER = process.env.SMTP_USER || "";
const SMTP_PASS = process.env.SMTP_PASS || "";
const FROM_EMAIL = process.env.FROM_EMAIL || "noreply@zimfcpro.com";
const FROM_NAME = "ZimFC Pro";

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  console.log(`[Email] Preparing to send "${options.subject}" to ${options.to}`);

  if (RESEND_API_KEY) {
    try {
      const { Resend } = await import("resend");
      const resend = new Resend(RESEND_API_KEY);
      const { error } = await resend.emails.send({
        from: `${FROM_NAME} <${FROM_EMAIL}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
      });
      if (error) {
        console.error("[Email] Resend returned error:", error);
        return false;
      }
      console.log(`[Email] Sent via Resend to ${options.to}`);
      return true;
    } catch (err) {
      console.error("[Email] Resend failed, falling back to nodemailer:", err);
    }
  }

  if (SMTP_HOST && SMTP_USER && SMTP_PASS) {
    try {
      const { createTransport } = await import("nodemailer");
      const transporter = createTransport({
        host: SMTP_HOST,
        port: SMTP_PORT,
        secure: SMTP_PORT === 465,
        auth: { user: SMTP_USER, pass: SMTP_PASS },
      });
      await transporter.sendMail({
        from: `"${FROM_NAME}" <${FROM_EMAIL}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
      });
      console.log(`[Email] Sent via SMTP to ${options.to}`);
      return true;
    } catch (err) {
      console.error("[Email] SMTP failed:", err);
      return false;
    }
  }

  console.log(`[Email] No email provider configured. Would send:`, {
    to: options.to,
    subject: options.subject,
  });
  return false;
}

export function renderVerificationEmail(params: {
  username: string;
  verifyUrl: string;
}): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0D0D0F;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:40px 20px">
  <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#111214;border-radius:24px;border:1px solid rgba(255,255,255,0.06)">
    <tr><td style="padding:40px 32px 32px;text-align:center">
      <h1 style="color:#00ff85;font-size:28px;font-weight:900;letter-spacing:-0.5px;margin:0 0 8px;text-transform:uppercase">ZimFC Pro</h1>
      <p style="color:#8E909A;font-size:14px;margin:0 0 32px">Verify Your Email Address</p>
    </td></tr>
    <tr><td style="padding:0 32px">
      <p style="color:#EDEDED;font-size:16px;margin:0 0 16px">Hi <strong style="color:#00ff85">${params.username}</strong>,</p>
      <p style="color:#B0B2BA;font-size:14px;margin:0 0 24px;line-height:1.6">Welcome to ZimFC Pro! Please verify your email address by clicking the button below. This helps us keep your account secure.</p>
    </td></tr>
    <tr><td style="padding:0 32px 32px;text-align:center">
      <a href="${params.verifyUrl}" style="display:inline-block;padding:14px 32px;background:#00ff85;color:#000;text-decoration:none;font-weight:700;font-size:14px;border-radius:12px;text-transform:uppercase;letter-spacing:1px">Verify Email Address</a>
      <p style="color:#6B6D78;font-size:12px;margin:16px 0 0">Or copy this link: <span style="color:#22d3ee;font-size:11px;word-break:break-all">${params.verifyUrl}</span></p>
      <p style="color:#6B6D78;font-size:11px;margin:12px 0 0">This link expires in 24 hours. If you didn't create an account, you can ignore this email.</p>
    </td></tr>
  </table>
</td></tr></table>
</body>
</html>`;
}

export function renderPasswordResetEmail(params: {
  username: string;
  code: string;
}): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0D0D0F;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:40px 20px">
  <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#111214;border-radius:24px;border:1px solid rgba(255,255,255,0.06)">
    <tr><td style="padding:40px 32px 32px;text-align:center">
      <h1 style="color:#00ff85;font-size:28px;font-weight:900;letter-spacing:-0.5px;margin:0 0 8px;text-transform:uppercase">ZimFC Pro</h1>
      <p style="color:#8E909A;font-size:14px;margin:0 0 32px">Password Reset Code</p>
    </td></tr>
    <tr><td style="padding:0 32px">
      <p style="color:#EDEDED;font-size:16px;margin:0 0 16px">Hi <strong style="color:#00ff85">${params.username}</strong>,</p>
      <p style="color:#B0B2BA;font-size:14px;margin:0 0 24px;line-height:1.6">We received a request to reset your password. Use the code below to set a new password. This code expires in 15 minutes.</p>
    </td></tr>
    <tr><td style="padding:0 32px 24px;text-align:center">
      <div style="display:inline-block;background:rgba(0,255,133,0.08);border:1px solid rgba(0,255,133,0.20);border-radius:16px;padding:20px 40px;letter-spacing:8px;font-size:36px;font-weight:900;color:#00ff85;font-family:monospace">${params.code}</div>
    </td></tr>
    <tr><td style="padding:0 32px 32px;text-align:center">
      <p style="color:#6B6D78;font-size:12px;margin:0">If you didn't request a password reset, you can safely ignore this email.</p>
    </td></tr>
  </table>
</td></tr></table>
</body>
</html>`;
}

export function renderChallengeEmail(params: {
  challengerName: string;
  challengeCode: string;
  acceptUrl: string;
}): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0D0D0F;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:40px 20px">
  <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#111214;border-radius:24px;border:1px solid rgba(255,255,255,0.06)">
    <tr><td style="padding:40px 32px 32px;text-align:center">
      <h1 style="color:#00ff85;font-size:28px;font-weight:900;letter-spacing:-0.5px;margin:0 0 8px;text-transform:uppercase">ZimFC Pro</h1>
      <p style="color:#8E909A;font-size:14px;margin:0 0 32px">You've Been Challenged!</p>
    </td></tr>
    <tr><td style="padding:0 32px">
      <p style="color:#EDEDED;font-size:16px;margin:0 0 16px"><strong style="color:#00ff85">${params.challengerName}</strong> has challenged you on ZimFC Pro.</p>
      <p style="color:#B0B2BA;font-size:14px;margin:0 0 24px;line-height:1.6">Challenge Code: <strong style="color:#22d3ee;font-size:18px;letter-spacing:2px">${params.challengeCode}</strong></p>
    </td></tr>
    <tr><td style="padding:0 32px 32px;text-align:center">
      <a href="${params.acceptUrl}" style="display:inline-block;padding:14px 32px;background:#00ff85;color:#000;text-decoration:none;font-weight:700;font-size:14px;border-radius:12px;text-transform:uppercase;letter-spacing:1px">Accept Challenge &rarr;</a>
      <p style="color:#6B6D78;font-size:12px;margin:16px 0 0">You have 48 hours to respond. After that the challenge expires.</p>
    </td></tr>
  </table>
</td></tr></table>
</body>
</html>`;
}

export function renderWelcomeEmail(params: {
  username: string;
  displayName: string;
  globalRank: number;
  division: string;
  referralCode: string;
  referralLink: string;
  platform: string;
}): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0D0D0F;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:40px 20px">
  <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#111214;border-radius:24px;border:1px solid rgba(255,255,255,0.06)">
    <tr><td style="padding:40px 32px 32px;text-align:center">
      <h1 style="color:#00ff85;font-size:28px;font-weight:900;letter-spacing:-0.5px;margin:0 0 8px;text-transform:uppercase">ZimFC Pro</h1>
      <p style="color:#8E909A;font-size:14px;margin:0 0 32px">Your Competitive Journey Starts Now</p>
    </td></tr>

    <tr><td style="padding:0 32px">
      <div style="background:rgba(0,255,133,0.06);border:1px solid rgba(0,255,133,0.12);border-radius:16px;padding:24px;text-align:center;margin-bottom:24px">
        <p style="color:#EDEDED;font-size:16px;margin:0 0 4px">Welcome, <strong style="color:#00ff85">${params.displayName || params.username}</strong></p>
        <p style="color:#8E909A;font-size:13px;margin:0">Thank you for joining ZimFC Pro! We're excited to have you in Zimbabwe's competitive FC ecosystem.</p>
      </div>
    </td></tr>

    <tr><td style="padding:0 32px">
      <div style="background:rgba(34,211,238,0.04);border:1px solid rgba(34,211,238,0.10);border-radius:12px;padding:20px;margin-bottom:24px">
        <p style="color:#22d3ee;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin:0 0 10px">About ZimFC Pro</p>
        <p style="color:#B0B2BA;font-size:13px;margin:0;line-height:1.6">ZimFC Pro is Zimbabwe's home for competitive EA Sports FC. Play matches, join tournaments, climb divisions, and earn your spot among the nation's elite. Whether you're in Harare, Bulawayo, or anywhere in ZW — the pitch is waiting.</p>
      </div>
    </td></tr>

    <tr><td style="padding:0 32px">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td width="50%" style="padding:8px;vertical-align:top">
            <div style="background:rgba(18,20,24,0.5);border:1px solid rgba(255,255,255,0.04);border-radius:12px;padding:16px;text-align:center">
              <p style="color:#6B6D78;font-size:10px;text-transform:uppercase;letter-spacing:1px;margin:0 0 4px">Global Rank</p>
              <p style="color:#EDEDED;font-size:24px;font-weight:900;margin:0">#${params.globalRank}</p>
            </div>
          </td>
          <td width="50%" style="padding:8px;vertical-align:top">
            <div style="background:rgba(18,20,24,0.5);border:1px solid rgba(255,255,255,0.04);border-radius:12px;padding:16px;text-align:center">
              <p style="color:#6B6D78;font-size:10px;text-transform:uppercase;letter-spacing:1px;margin:0 0 4px">Division</p>
              <p style="color:#00ff85;font-size:24px;font-weight:900;margin:0">${params.division}</p>
            </div>
          </td>
        </tr>
        <tr>
          <td width="50%" style="padding:8px;vertical-align:top">
            <div style="background:rgba(18,20,24,0.5);border:1px solid rgba(255,255,255,0.04);border-radius:12px;padding:16px;text-align:center">
              <p style="color:#6B6D78;font-size:10px;text-transform:uppercase;letter-spacing:1px;margin:0 0 4px">Platform</p>
              <p style="color:#EDEDED;font-size:16px;font-weight:700;margin:0">${params.platform}</p>
            </div>
          </td>
          <td width="50%" style="padding:8px;vertical-align:top">
            <div style="background:rgba(18,20,24,0.5);border:1px solid rgba(255,255,255,0.04);border-radius:12px;padding:16px;text-align:center">
              <p style="color:#6B6D78;font-size:10px;text-transform:uppercase;letter-spacing:1px;margin:0 0 4px">Referral Code</p>
              <p style="color:#ffb800;font-size:16px;font-weight:700;margin:0">${params.referralCode}</p>
            </div>
          </td>
        </tr>
      </table>
    </td></tr>

    <tr><td style="padding:24px 32px 0">
      <div style="background:rgba(255,184,0,0.04);border:1px solid rgba(255,184,0,0.10);border-radius:12px;padding:16px">
        <p style="color:#ffb800;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin:0 0 12px">Your Referral Code</p>
        <p style="color:#EDEDED;font-size:14px;margin:0 0 4px">Share your code: <strong style="color:#ffb800;font-size:18px">${params.referralCode}</strong></p>
        <p style="color:#666;font-size:12px;margin:0">Your referral link: <a href="${params.referralLink}" style="color:#00ff85">${params.referralLink}</a></p>
        <p style="color:#666;font-size:11px;margin:8px 0 0">Invite friends → earn +10 XP per referral → climb the rankings faster</p>
      </div>
    </td></tr>

    <tr><td style="padding:24px 32px 0">
      <div style="background:rgba(34,211,238,0.04);border:1px solid rgba(34,211,238,0.10);border-radius:12px;padding:16px">
        <p style="color:#22d3ee;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin:0 0 12px">Next Steps</p>
        <table cellpadding="0" cellspacing="0" style="color:#EDEDED;font-size:13px">
          <tr><td style="padding:4px 0">1. Play your first match → earn +50 XP</td></tr>
          <tr><td style="padding:4px 0">2. Join a tournament → earn +75 XP</td></tr>
          <tr><td style="padding:4px 0">3. Invite friends → earn +10 XP each</td></tr>
          <tr><td style="padding:4px 0">4. Create a club → earn +100 XP</td></tr>
        </table>
      </div>
    </td></tr>

    <tr><td style="padding:32px;text-align:center">
      <a href="https://zimfcpro.co.zw/dashboard" style="display:inline-block;padding:14px 32px;background:#00ff85;color:#000;text-decoration:none;font-weight:700;font-size:14px;border-radius:12px;text-transform:uppercase;letter-spacing:1px">Go to Your Dashboard</a>
    </td></tr>

    <tr><td style="padding:0 32px 32px;text-align:center">
      <p style="color:#6B6D78;font-size:11px;margin:0">Build your football legacy.</p>
      <p style="color:#6B6D78;font-size:11px;margin:4px 0 0">ZimFC Pro — The Official Competitive FC Ecosystem of Zimbabwe</p>
    </td></tr>
  </table>
</td></tr></table>
</body>
</html>`;
}
