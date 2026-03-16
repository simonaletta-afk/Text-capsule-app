import { Router, type IRouter, type Request, type Response } from "express";
import { db, messagesTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import {
  CreateMessageBody,
  GetMessagesResponse,
  DeleteMessageResponse,
  MarkMessageReadResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

function getDeliveryDate(frequency: string): Date {
  const now = new Date();
  if (frequency === "biannual") {
    return new Date(now.getFullYear(), now.getMonth() + 6, now.getDate());
  }
  return new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());
}

function serializeMessage(msg: typeof messagesTable.$inferSelect) {
  return {
    id: msg.id,
    userId: msg.userId,
    content: msg.content,
    frequency: msg.frequency,
    createdAt: msg.createdAt.toISOString(),
    deliverAt: msg.deliverAt.toISOString(),
    isDelivered: msg.isDelivered,
    isRead: msg.isRead,
  };
}

router.get("/messages", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const messages = await db
    .select()
    .from(messagesTable)
    .where(eq(messagesTable.userId, req.user.id))
    .orderBy(messagesTable.createdAt);

  const now = new Date();
  for (const msg of messages) {
    if (!msg.isDelivered && msg.deliverAt <= now) {
      await db
        .update(messagesTable)
        .set({ isDelivered: true })
        .where(eq(messagesTable.id, msg.id));
      msg.isDelivered = true;
    }
  }

  res.json(
    GetMessagesResponse.parse({
      messages: messages.map(serializeMessage),
    }),
  );
});

router.post("/messages", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const parsed = CreateMessageBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  const { content, frequency } = parsed.data;
  const deliverAt = getDeliveryDate(frequency);

  const [message] = await db
    .insert(messagesTable)
    .values({
      userId: req.user.id,
      content,
      frequency,
      deliverAt,
    })
    .returning();

  res.status(201).json({ message: serializeMessage(message) });
});

router.delete("/messages/:id", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid message ID" });
    return;
  }

  const [deleted] = await db
    .delete(messagesTable)
    .where(and(eq(messagesTable.id, id), eq(messagesTable.userId, req.user.id)))
    .returning();

  if (!deleted) {
    res.status(404).json({ error: "Message not found" });
    return;
  }

  res.json(DeleteMessageResponse.parse({ success: true }));
});

router.post("/messages/:id/read", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid message ID" });
    return;
  }

  const [updated] = await db
    .update(messagesTable)
    .set({ isRead: true })
    .where(and(eq(messagesTable.id, id), eq(messagesTable.userId, req.user.id)))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "Message not found" });
    return;
  }

  res.json(
    MarkMessageReadResponse.parse({
      message: serializeMessage(updated),
    }),
  );
});

export default router;
