import { Router, type IRouter, type Request, type Response } from "express";
import { getSession, getSessionId } from "../lib/auth";

const router: IRouter = Router();

router.post("/support", async (req: Request, res: Response) => {
  const { subject, message } = req.body;

  if (!subject || typeof subject !== "string" || !message || typeof message !== "string") {
    res.status(400).json({ error: "Subject and message are required" });
    return;
  }

  if (subject.length > 200 || message.length > 2000) {
    res.status(400).json({ error: "Subject or message is too long" });
    return;
  }

  let email = "anonymous";
  const sid = getSessionId(req);
  if (sid) {
    const session = await getSession(sid);
    if (session?.user?.email) {
      email = session.user.email;
    }
  }

  console.log(`[SUPPORT] From: ${email} | Subject: ${subject.substring(0, 50)}`);

  res.json({ success: true });
});

export default router;
