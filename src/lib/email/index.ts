import nodemailer from "nodemailer"

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST ?? "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT ?? "587"),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

export async function sendWelcomeEmail(email: string, username: string) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"

  await transporter.sendMail({
    from: `"Star Strick FC26" <${process.env.SMTP_FROM ?? "noreply@starstrick.com"}>`,
    to: email,
    subject: "Welcome to Star Strick — Start Your Rise",
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { margin: 0; padding: 0; background: #050505; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
          .container { max-width: 600px; margin: 0 auto; background: #0a0a0a; }
          .header { background: linear-gradient(135deg, #00ff85 0%, #00cc6a 100%); padding: 40px 30px; text-align: center; }
          .header h1 { margin: 0; color: #050505; font-size: 28px; font-weight: 900; letter-spacing: 2px; }
          .content { padding: 40px 30px; color: #ffffff; }
          .content h2 { color: #00ff85; font-size: 22px; margin-top: 0; }
          .content p { color: #ffffff99; line-height: 1.6; font-size: 16px; }
          .cta { display: inline-block; background: #00ff85; color: #050505; padding: 14px 32px; text-decoration: none; font-weight: 900; letter-spacing: 1px; border-radius: 4px; margin: 20px 0; }
          .steps { background: #111111; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .steps h3 { color: #00ff85; margin-top: 0; font-size: 16px; }
          .steps ol { color: #ffffff99; padding-left: 20px; }
          .steps li { margin: 8px 0; }
          .footer { padding: 30px; text-align: center; color: #ffffff40; font-size: 12px; border-top: 1px solid #1a1a1a; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>STAR STRICK FC26</h1>
          </div>
          <div class="content">
            <h2>Welcome, ${username}! 🎮</h2>
            <p>You've just joined the most competitive esports ladder in Zimbabwe. Your rise starts now.</p>

            <div class="steps">
              <h3>🚀 Your First 3 Steps:</h3>
              <ol>
                <li><strong>Join a Club</strong> — Teams compete together. Find yours or create one.</li>
                <li><strong>Play Your First Match</strong> — Challenge another player and prove your skill.</li>
                <li><strong>Get Ranked</strong> — After your first verified match, you'll be placed on the leaderboard.</li>
              </ol>
            </div>

            <p><strong>How Rankings Work:</strong></p>
            <p>Every match matters. Wins earn points, goals boost your score, and your recent form affects your ranking. Beat higher-ranked players for bigger jumps.</p>

            <p style="text-align: center;">
              <a href="${appUrl}/onboarding" class="cta">PLAY YOUR FIRST MATCH →</a>
            </p>

            <p>See players near you and start competing. The ladder is waiting.</p>
          </div>
          <div class="footer">
            <p>Star Strick FC26 — Competitive Esports Platform</p>
            <p>If you didn't create this account, ignore this email.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  })
}

export async function sendVerificationEmail(email: string, username: string, token: string) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"

  await transporter.sendMail({
    from: `"Star Strick FC26" <${process.env.SMTP_FROM ?? "noreply@starstrick.com"}>`,
    to: email,
    subject: "Verify Your Email — Star Strick FC26",
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { margin: 0; padding: 0; background: #050505; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
          .container { max-width: 600px; margin: 0 auto; background: #0a0a0a; }
          .header { background: linear-gradient(135deg, #00ff85 0%, #00cc6a 100%); padding: 40px 30px; text-align: center; }
          .header h1 { margin: 0; color: #050505; font-size: 28px; font-weight: 900; letter-spacing: 2px; }
          .content { padding: 40px 30px; color: #ffffff; text-align: center; }
          .cta { display: inline-block; background: #00ff85; color: #050505; padding: 14px 32px; text-decoration: none; font-weight: 900; letter-spacing: 1px; border-radius: 4px; }
          .footer { padding: 30px; text-align: center; color: #ffffff40; font-size: 12px; border-top: 1px solid #1a1a1a; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>STAR STRICK FC26</h1>
          </div>
          <div class="content">
            <h2 style="color: #00ff85;">Verify Your Email</h2>
            <p style="color: #ffffff99;">Click the button below to verify your account and start competing.</p>
            <a href="${appUrl}/api/auth/verify?token=${token}" class="cta">VERIFY EMAIL →</a>
            <p style="color: #ffffff40; margin-top: 30px; font-size: 14px;">This link expires in 24 hours.</p>
          </div>
          <div class="footer">
            <p>Star Strick FC26 — Competitive Esports Platform</p>
          </div>
        </div>
      </body>
      </html>
    `,
  })
}

export async function sendMatchRequestEmail(email: string, username: string, senderName: string) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"

  await transporter.sendMail({
    from: `"Star Strick FC26" <${process.env.SMTP_FROM ?? "noreply@starstrick.com"}>`,
    to: email,
    subject: `${senderName} wants to play a match — Star Strick FC26`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { margin: 0; padding: 0; background: #050505; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
          .container { max-width: 600px; margin: 0 auto; background: #0a0a0a; }
          .header { background: linear-gradient(135deg, #ffb800 0%, #ff9500 100%); padding: 40px 30px; text-align: center; }
          .header h1 { margin: 0; color: #050505; font-size: 28px; font-weight: 900; letter-spacing: 2px; }
          .content { padding: 40px 30px; color: #ffffff; text-align: center; }
          .cta { display: inline-block; background: #ffb800; color: #050505; padding: 14px 32px; text-decoration: none; font-weight: 900; letter-spacing: 1px; border-radius: 4px; }
          .footer { padding: 30px; text-align: center; color: #ffffff40; font-size: 12px; border-top: 1px solid #1a1a1a; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>MATCH REQUEST</h1>
          </div>
          <div class="content">
            <h2 style="color: #ffb800;">${senderName} challenged you!</h2>
            <p style="color: #ffffff99;">A match request is waiting for your response. Accept or decline to continue.</p>
            <a href="${appUrl}/matches/requests" class="cta">VIEW REQUEST →</a>
          </div>
          <div class="footer">
            <p>Star Strick FC26 — Competitive Esports Platform</p>
          </div>
        </div>
      </body>
      </html>
    `,
  })
}
