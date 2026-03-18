import { Router, type IRouter, type Request, type Response } from "express";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { db, usersTable, passwordResetTokensTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { Resend } from "resend";

const router: IRouter = Router();

const resend = new Resend(process.env.RESEND_API_KEY);
const APP_NAME = "Text Capsule";

function generateCode(): string {
  return crypto.randomInt(100000, 999999).toString();
}

router.post("/auth/forgot-password", async (req: Request, res: Response) => {
  const { email } = req.body;

  if (!email || typeof email !== "string") {
    res.status(400).json({ error: "Email is required" });
    return;
  }

  const normalizedEmail = email.toLowerCase().trim();

  const [user] = await db
    .select({ id: usersTable.id, email: usersTable.email })
    .from(usersTable)
    .where(eq(usersTable.email, normalizedEmail));

  if (!user) {
    res.json({ success: true });
    return;
  }

  const code = generateCode();
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

  await db.insert(passwordResetTokensTable).values({
    userId: user.id,
    code,
    expiresAt,
  });

  try {
    await resend.emails.send({
      from: `${APP_NAME} <onboarding@resend.dev>`,
      to: normalizedEmail,
      subject: `${APP_NAME} - Password Reset Code`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;">
          <h2 style="color: #1A1A1A; margin-bottom: 8px;">${APP_NAME}</h2>
          <p style="color: #6B7280; font-size: 15px; line-height: 1.5;">You requested a password reset. Enter this code in the app:</p>
          <div style="background: #F3F4F6; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0;">
            <span style="font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #6366F1;">${code}</span>
          </div>
          <p style="color: #9CA3AF; font-size: 13px;">This code expires in 15 minutes. If you didn't request this, you can safely ignore this email.</p>
        </div>
      `,
    });
  } catch (err) {
    console.error("[PASSWORD-RESET] Failed to send email:", err);
  }

  res.json({ success: true });
});

router.post("/auth/reset-password", async (req: Request, res: Response) => {
  const { email, code, newPassword } = req.body;

  if (!email || !code || !newPassword) {
    res.status(400).json({ error: "Email, code, and new password are required" });
    return;
  }

  if (typeof newPassword !== "string" || newPassword.length < 6) {
    res.status(400).json({ error: "Password must be at least 6 characters" });
    return;
  }

  const normalizedEmail = email.toLowerCase().trim();

  const [user] = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(eq(usersTable.email, normalizedEmail));

  if (!user) {
    res.status(400).json({ error: "Invalid code or email" });
    return;
  }

  const [token] = await db
    .select()
    .from(passwordResetTokensTable)
    .where(
      and(
        eq(passwordResetTokensTable.userId, user.id),
        eq(passwordResetTokensTable.code, code.trim()),
        eq(passwordResetTokensTable.used, false),
      ),
    );

  if (!token || token.expiresAt < new Date()) {
    res.status(400).json({ error: "Invalid or expired code" });
    return;
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);

  await db
    .update(usersTable)
    .set({ passwordHash })
    .where(eq(usersTable.id, user.id));

  await db
    .update(passwordResetTokensTable)
    .set({ used: true })
    .where(eq(passwordResetTokensTable.id, token.id));

  res.json({ success: true });
});

export default router;
