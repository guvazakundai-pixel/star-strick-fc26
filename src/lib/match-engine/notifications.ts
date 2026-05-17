import { prisma } from "@/lib/prisma";

type NotificationType = "CHALLENGE" | "MATCH" | "RANK" | "CLUB" | "TOURNAMENT" | "ACHIEVEMENT";

interface SendNotificationParams {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
}

export async function sendNotification({
  userId,
  type,
  title,
  message,
  link,
}: SendNotificationParams): Promise<void> {
  await prisma.notification.create({
    data: { userId, type, title, message, link },
  });
}

export async function notifyChallengeReceived(userId: string, challengerName: string, token: string): Promise<void> {
  await sendNotification({
    userId,
    type: "CHALLENGE",
    title: "You've Been Challenged!",
    message: `${challengerName} has challenged you to a match.`,
    link: `/match/claim/${token}`,
  });
}

export async function notifyChallengeAccepted(userId: string, acceptorName: string, matchId: string): Promise<void> {
  await sendNotification({
    userId,
    type: "CHALLENGE",
    title: "Challenge Accepted!",
    message: `${acceptorName} accepted your challenge. The battle begins.`,
    link: `/matches/${matchId}`,
  });
}

export async function notifyScoreSubmitted(userId: string, opponentName: string, matchId: string): Promise<void> {
  await sendNotification({
    userId,
    type: "MATCH",
    title: "Score Submitted",
    message: `${opponentName} submitted their score. Confirm or dispute.`,
    link: `/matches/${matchId}`,
  });
}

export async function notifyMatchCompleted(userId: string, result: "won" | "lost" | "draw", matchId: string): Promise<void> {
  const titles = { won: "Victory!", lost: "Defeat", draw: "Draw" };
  const messages = {
    won: "Congratulations! You won your match. Check your updated rank.",
    lost: "You lost this battle. Review the match and come back stronger.",
    draw: "The match ended in a draw. Every point counts toward your rank.",
  };

  await sendNotification({
    userId,
    type: "MATCH",
    title: titles[result],
    message: messages[result],
    link: `/matches/${matchId}`,
  });
}

export async function notifyRankUp(userId: string, newRank: number, newDivision: string): Promise<void> {
  await sendNotification({
    userId,
    type: "RANK",
    title: "Rank Up!",
    message: `You climbed to #${newRank} in ${newDivision}. The ZW ladder is yours for the taking.`,
    link: "/rankings",
  });
}

export async function notifyDisputeOpened(userId: string, matchId: string): Promise<void> {
  await sendNotification({
    userId,
    type: "MATCH",
    title: "Match Disputed",
    message: "A match you participated in has been disputed. An admin will review it shortly.",
    link: `/matches/${matchId}`,
  });
}

export async function notifyDisputeResolved(userId: string, matchId: string, result: string): Promise<void> {
  await sendNotification({
    userId,
    type: "MATCH",
    title: "Dispute Resolved",
    message: `The dispute has been resolved: ${result}`,
    link: `/matches/${matchId}`,
  });
}
