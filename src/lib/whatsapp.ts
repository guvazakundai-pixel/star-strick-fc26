"use server";

const WHATSAPP_API_URL = "https://graph.facebook.com/v21.0";
const WHATSAPP_PHONE_ID = process.env.WHATSAPP_PHONE_ID ?? "";
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN ?? "";

type TemplateParams = Record<string, string>;

async function sendTemplate(
  to: string,
  templateName: string,
  params: TemplateParams,
): Promise<boolean> {
  if (!WHATSAPP_TOKEN || !WHATSAPP_PHONE_ID) return false;
  try {
    const components = [
      {
        type: "body",
        parameters: Object.entries(params).map(([_, value]) => ({
          type: "text",
          text: value,
        })),
      },
    ];
    const res = await fetch(
      `${WHATSAPP_API_URL}/${WHATSAPP_PHONE_ID}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${WHATSAPP_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: to.replace(/[^0-9]/g, ""),
          type: "template",
          template: { name: templateName, language: { code: "en" }, components },
        }),
      },
    );
    return res.ok;
  } catch {
    return false;
  }
}

async function sendText(to: string, text: string): Promise<boolean> {
  if (!WHATSAPP_TOKEN || !WHATSAPP_PHONE_ID) return false;
  try {
    const res = await fetch(
      `${WHATSAPP_API_URL}/${WHATSAPP_PHONE_ID}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${WHATSAPP_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: to.replace(/[^0-9]/g, ""),
          type: "text",
          text: { body: text },
        }),
      },
    );
    return res.ok;
  } catch {
    return false;
  }
}

export async function notifyChallengeReceived(
  phone: string,
  challengerName: string,
): Promise<boolean> {
  return sendText(
    phone,
    `⚔️ *Challenge Received!*\n\n${challengerName} has challenged you on Star Strick FC26!\n\nOpen the app to accept or decline.`,
  );
}

export async function notifyChallengeAccepted(
  phone: string,
  acceptorName: string,
): Promise<boolean> {
  return sendText(
    phone,
    `✅ *Challenge Accepted!*\n\n${acceptorName} accepted your challenge!\n\nOpen the app to arrange your match.`,
  );
}

export async function notifyTournamentStart(
  phone: string,
  tournamentName: string,
  round: number,
  opponentName: string,
): Promise<boolean> {
  return sendText(
    phone,
    `🏆 *${tournamentName} — Round ${round}*\n\nYour match vs ${opponentName} is ready!\n\nOpen the app to play and report your score.`,
  );
}

export async function notifyTournamentBracketAdvance(
  phone: string,
  tournamentName: string,
  nextRound: number,
  nextOpponent: string | null,
): Promise<boolean> {
  const vs = nextOpponent ? ` vs ${nextOpponent}` : "";
  return sendText(
    phone,
    `🎉 *You advanced!*\n\nRound ${nextRound} of ${tournamentName} is ready${vs}.\n\nOpen the app to see the bracket.`,
  );
}

export async function notifyPaymentRequest(
  phone: string,
  amount: number,
  reason: string,
): Promise<boolean> {
  return sendText(
    phone,
    `💰 *Payment Required*\n\n$${amount.toFixed(2)} USD — ${reason}\n\nYou'll receive an EcoCash prompt shortly.`,
  );
}

export async function notifyPaymentConfirmed(
  phone: string,
  amount: number,
  reason: string,
): Promise<boolean> {
  return sendText(
    phone,
    `✅ *Payment Confirmed*\n\n$${amount.toFixed(2)} USD received for ${reason}.\n\nYou're all set on Star Strick FC26!`,
  );
}

export async function notifyWagerResult(
  phone: string,
  won: boolean,
  amount: number,
  opponentName: string,
): Promise<boolean> {
  const header = won ? "🏆 *You Won!*" : "😔 *Match Lost*";
  const line = won
    ? `You won $${amount.toFixed(2)} from your wager vs ${opponentName}!`
    : `You lost $${amount.toFixed(2)} to ${opponentName}.`;
  return sendText(phone, `${header}\n\n${line}\n\nOpen the app for details.`);
}
