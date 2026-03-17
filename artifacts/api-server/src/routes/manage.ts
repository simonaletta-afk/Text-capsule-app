import { Router, type IRouter, type Request, type Response, type NextFunction } from "express";
import { db, supportMessagesTable, messagesTable } from "@workspace/db";
import { eq, desc, count, sql } from "drizzle-orm";

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
        version: "1.0.0",
        bundleId: "com.textcapsule.app",
        status: "active",
        category: "Lifestyle",
        description: "Send a message to your future self. Get it back in 6 months or a year via SMS or WhatsApp.",
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

    let query = db
      .select()
      .from(supportMessagesTable)
      .orderBy(desc(supportMessagesTable.createdAt))
      .limit(limit)
      .offset(offset);

    if (status) {
      query = query.where(eq(supportMessagesTable.status, status)) as typeof query;
    }

    const messages = await query;

    const [totalResult] = await db
      .select({ count: count() })
      .from(supportMessagesTable);

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

const VALID_STATUSES = ["new", "read", "in-progress", "resolved", "closed"];

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
