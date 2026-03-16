import { Router, type IRouter, type Request, type Response } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

router.get("/phone", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const [user] = await db
    .select({
      phoneNumber: usersTable.phoneNumber,
      deliveryChannel: usersTable.deliveryChannel,
    })
    .from(usersTable)
    .where(eq(usersTable.id, req.user.id));

  res.json({
    phoneNumber: user?.phoneNumber ?? null,
    deliveryChannel: user?.deliveryChannel ?? "whatsapp",
  });
});

router.post("/phone", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const { phoneNumber, deliveryChannel } = req.body;
  if (!phoneNumber || typeof phoneNumber !== "string") {
    res.status(400).json({ error: "Phone number is required" });
    return;
  }

  const cleaned = phoneNumber.replace(/[^\d+]/g, "");
  if (cleaned.length < 10) {
    res.status(400).json({ error: "Invalid phone number" });
    return;
  }

  const formatted = cleaned.startsWith("+") ? cleaned : `+1${cleaned}`;
  const channel = deliveryChannel === "sms" ? "sms" : "whatsapp";

  await db
    .update(usersTable)
    .set({ phoneNumber: formatted, deliveryChannel: channel })
    .where(eq(usersTable.id, req.user.id));

  res.json({ success: true, phoneNumber: formatted, deliveryChannel: channel });
});

export default router;
