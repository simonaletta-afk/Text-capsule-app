import { Router, type IRouter, type Request, type Response } from "express";
import { db, supportMessagesTable } from "@workspace/db";
import { Resend } from "resend";

const router: IRouter = Router();

const resend = new Resend(process.env.RESEND_API_KEY);
const NOTIFY_EMAIL = "simonaletta@hotmail.co.uk";
const APP_NAME = "Text Capsule";

router.post("/contact", async (req: Request, res: Response) => {
  const { name, subject, message } = req.body;

  if (!name || typeof name !== "string" || name.trim().length === 0) {
    res.status(400).json({ error: "Name is required" });
    return;
  }
  if (!subject || typeof subject !== "string" || subject.trim().length === 0) {
    res.status(400).json({ error: "Subject is required" });
    return;
  }
  if (!message || typeof message !== "string" || message.trim().length === 0) {
    res.status(400).json({ error: "Message is required" });
    return;
  }
  if (name.trim().length > 100) {
    res.status(400).json({ error: "Name must be 100 characters or less" });
    return;
  }
  if (subject.trim().length > 200) {
    res.status(400).json({ error: "Subject must be 200 characters or less" });
    return;
  }
  if (message.trim().length > 5000) {
    res.status(400).json({ error: "Message must be 5000 characters or less" });
    return;
  }

  try {
    await db.insert(supportMessagesTable).values({
      name: name.trim(),
      subject: subject.trim(),
      message: message.trim(),
    });

    try {
      await resend.emails.send({
        from: `${APP_NAME} Support <onboarding@resend.dev>`,
        to: NOTIFY_EMAIL,
        subject: `[${APP_NAME} Support] ${subject.trim()}`,
        html: `
          <h2>New Support Message</h2>
          <p><strong>From:</strong> ${name.trim()}</p>
          <p><strong>Subject:</strong> ${subject.trim()}</p>
          <hr />
          <p>${message.trim().replace(/\n/g, "<br />")}</p>
        `,
      });
    } catch (emailErr) {
      console.error("[CONTACT] Failed to send email notification:", emailErr);
    }

    res.json({ success: true });
  } catch (err) {
    console.error("[CONTACT] Failed to save support message:", err);
    res.status(500).json({ error: "Failed to submit message" });
  }
});

export default router;
