import { Router, type IRouter, type Request, type Response, type NextFunction } from "express";
import { db, supportMessagesTable } from "@workspace/db";
import { eq, desc, count } from "drizzle-orm";

const router: IRouter = Router();

function requireApiKey(req: Request, res: Response, next: NextFunction) {
  const apiKey = req.headers["x-api-key"];
  const expectedKey = process.env.MANAGEMENT_API_KEY;

  if (!expectedKey || !apiKey || apiKey !== expectedKey) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  next();
}

const VALID_STATUSES = ["new", "read", "in-progress", "resolved", "closed"];

router.use("/manage", requireApiKey);

router.get("/manage/app-info", async (_req: Request, res: Response) => {
  try {
    const [totalResult] = await db
      .select({ count: count() })
      .from(supportMessagesTable);

    const [newResult] = await db
      .select({ count: count() })
      .from(supportMessagesTable)
      .where(eq(supportMessagesTable.status, "new"));

    res.json({
      app: {
        name: "Text Capsule",
        urlSlug: "com-textcapsule-app",
        version: "1.0.0",
        bundleId: "com.textcapsule.app",
        status: "active",
        category: "Lifestyle",
        tagline: "Send a message to your future self. Get it back in 6 months or a year via SMS or WhatsApp.",
        fullDescription: "Text Capsule lets you write messages to your future self and have them delivered back to you in 6 months or 1 year via SMS or WhatsApp. Set goals, send positivity, capture gratitude, or share advice with the person you'll become. Your messages are stored securely and delivered right on schedule.",
        iconImageUrl: "",
        appStoreLink: "",
        features: "Future Message Delivery, SMS & WhatsApp Support, Inspiration Prompts, Message History, Secure Storage, Custom Delivery Timing",
        privacyPolicyText: "Your Privacy Matters\n\nText Capsule is built with your privacy in mind. We collect only the minimum information needed to deliver your future messages.\n\nWhat We Collect\n• Your email address (for account login)\n• Your phone number (to deliver messages via SMS or WhatsApp)\n• The messages you write (stored securely until delivery)\n• Your delivery preferences (SMS or WhatsApp)\n\nHow We Use Your Data\nYour data is used solely to provide the Text Capsule service. We use your phone number to deliver your messages at the scheduled time via Twilio (our messaging provider). We do not sell, share, or use your data for advertising.\n\nMessage Storage\nYour messages are stored securely in our database until they are delivered. After delivery, messages remain in your account history so you can look back on them. You can delete any message at any time.\n\nThird-Party Services\nWe use Twilio to send SMS and WhatsApp messages. When a message is delivered, your phone number and message content are shared with Twilio for the purpose of delivery only. Please refer to Twilio's privacy policy for more information on how they handle data.\n\nData Security\nYour password is securely hashed and never stored in plain text. All communication between the app and our servers is encrypted. We take reasonable measures to protect your personal information.\n\nYour Rights\nYou can:\n• View all your stored messages at any time\n• Delete any message before or after delivery\n• Update your phone number and delivery preferences\n• Request deletion of your account by contacting support\n\nContact Us\nIf you have any questions about this privacy policy or how we handle your data, please reach out through our support page in the app.",
      },
      supportMessages: {
        total: totalResult.count,
        new: newResult.count,
      },
    });
  } catch (err) {
    console.error("[MANAGE] Failed to fetch app info:", err);
    res.status(500).json({ error: "Failed to fetch app info" });
  }
});

router.get("/manage/messages", async (req: Request, res: Response) => {
  try {
    const status = req.query.status as string | undefined;
    const limit = Math.min(Math.max(parseInt(req.query.limit as string) || 50, 1), 200);
    const offset = Math.max(parseInt(req.query.offset as string) || 0, 0);

    if (status && !VALID_STATUSES.includes(status)) {
      res.status(400).json({
        error: `Invalid status filter. Must be one of: ${VALID_STATUSES.join(", ")}`,
      });
      return;
    }

    const statusCondition = status ? eq(supportMessagesTable.status, status) : undefined;

    const messages = await db
      .select()
      .from(supportMessagesTable)
      .where(statusCondition)
      .orderBy(desc(supportMessagesTable.createdAt))
      .limit(limit)
      .offset(offset);

    const [totalResult] = await db
      .select({ count: count() })
      .from(supportMessagesTable)
      .where(statusCondition);

    res.json({
      messages,
      pagination: {
        total: totalResult.count,
        limit,
        offset,
      },
    });
  } catch (err) {
    console.error("[MANAGE] Failed to fetch messages:", err);
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});

router.get("/manage/messages/:id", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({ error: "Invalid message ID" });
      return;
    }

    const [message] = await db
      .select()
      .from(supportMessagesTable)
      .where(eq(supportMessagesTable.id, id));

    if (!message) {
      res.status(404).json({ error: "Message not found" });
      return;
    }

    res.json({ message });
  } catch (err) {
    console.error("[MANAGE] Failed to fetch message:", err);
    res.status(500).json({ error: "Failed to fetch message" });
  }
});

router.patch("/manage/messages/:id/status", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({ error: "Invalid message ID" });
      return;
    }

    const { status } = req.body;
    if (!status || !VALID_STATUSES.includes(status)) {
      res.status(400).json({
        error: `Invalid status. Must be one of: ${VALID_STATUSES.join(", ")}`,
      });
      return;
    }

    const [updated] = await db
      .update(supportMessagesTable)
      .set({ status })
      .where(eq(supportMessagesTable.id, id))
      .returning();

    if (!updated) {
      res.status(404).json({ error: "Message not found" });
      return;
    }

    res.json({ message: updated });
  } catch (err) {
    console.error("[MANAGE] Failed to update message status:", err);
    res.status(500).json({ error: "Failed to update status" });
  }
});

export default router;
