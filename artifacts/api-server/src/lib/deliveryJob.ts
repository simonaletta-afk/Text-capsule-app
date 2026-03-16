import { db, messagesTable, usersTable } from "@workspace/db";
import { eq, and, lte } from "drizzle-orm";
import { sendSMS } from "./twilio";

export async function checkAndDeliverMessages() {
  const now = new Date();

  const dueMessages = await db
    .select({
      messageId: messagesTable.id,
      content: messagesTable.content,
      userId: messagesTable.userId,
      deliverAt: messagesTable.deliverAt,
    })
    .from(messagesTable)
    .where(
      and(
        eq(messagesTable.isDelivered, false),
        lte(messagesTable.deliverAt, now),
      ),
    );

  if (dueMessages.length === 0) return;

  for (const msg of dueMessages) {
    const [user] = await db
      .select({ phoneNumber: usersTable.phoneNumber })
      .from(usersTable)
      .where(eq(usersTable.id, msg.userId));

    if (user?.phoneNumber) {
      try {
        const smsBody = `Text Capsule from your past self:\n\n"${msg.content}"`;
        await sendSMS(user.phoneNumber, smsBody);
        console.log(`SMS sent to ${user.phoneNumber} for message ${msg.messageId}`);
      } catch (err) {
        console.error(`Failed to send SMS for message ${msg.messageId}:`, err);
      }
    }

    await db
      .update(messagesTable)
      .set({ isDelivered: true })
      .where(eq(messagesTable.id, msg.messageId));
  }
}

export function startDeliveryScheduler() {
  console.log("SMS delivery scheduler started (checks every 60s)");
  setInterval(checkAndDeliverMessages, 60 * 1000);
  checkAndDeliverMessages();
}
