import { Router, type IRouter, type Request, type Response } from "express";
import bcrypt from "bcryptjs";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  createSession,
  deleteSession,
  getSessionId,
  clearSession,
  SESSION_COOKIE,
  SESSION_TTL,
} from "../lib/auth";

const router: IRouter = Router();

function setSessionCookie(res: Response, sid: string) {
  res.cookie(SESSION_COOKIE, sid, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL,
  });
}

router.post("/auth/signup", async (req: Request, res: Response) => {
  const { email, password, firstName } = req.body;

  if (!email || !password) {
    res.status(400).json({ error: "Email and password are required" });
    return;
  }

  if (password.length < 6) {
    res.status(400).json({ error: "Password must be at least 6 characters" });
    return;
  }

  const existing = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(eq(usersTable.email, email.toLowerCase().trim()));

  if (existing.length > 0) {
    res.status(409).json({ error: "An account with this email already exists" });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const [user] = await db
    .insert(usersTable)
    .values({
      email: email.toLowerCase().trim(),
      passwordHash,
      firstName: firstName || null,
    })
    .returning();

  const sid = await createSession({
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      profileImageUrl: user.profileImageUrl,
    },
  });

  setSessionCookie(res, sid);
  res.status(201).json({
    token: sid,
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      profileImageUrl: user.profileImageUrl,
      phoneNumber: user.phoneNumber,
      deliveryChannel: user.deliveryChannel ?? "sms",
    },
  });
});

router.post("/auth/login", async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ error: "Email and password are required" });
    return;
  }

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, email.toLowerCase().trim()));

  if (!user || !user.passwordHash) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  const sid = await createSession({
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      profileImageUrl: user.profileImageUrl,
    },
  });

  setSessionCookie(res, sid);
  res.json({
    token: sid,
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      profileImageUrl: user.profileImageUrl,
      phoneNumber: user.phoneNumber,
      deliveryChannel: user.deliveryChannel ?? "sms",
    },
  });
});

router.get("/auth/user", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    res.json({ user: null });
    return;
  }

  const [dbUser] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, req.user.id));

  if (!dbUser) {
    res.json({ user: null });
    return;
  }

  res.json({
    user: {
      id: dbUser.id,
      email: dbUser.email,
      firstName: dbUser.firstName,
      lastName: dbUser.lastName,
      profileImageUrl: dbUser.profileImageUrl,
      phoneNumber: dbUser.phoneNumber,
      deliveryChannel: dbUser.deliveryChannel ?? "sms",
    },
  });
});

router.post("/auth/logout", async (req: Request, res: Response) => {
  const sid = getSessionId(req);
  await clearSession(res, sid);
  res.json({ success: true });
});

router.delete("/auth/account", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    await db
      .delete(usersTable)
      .where(eq(usersTable.id, req.user.id));

    const sid = getSessionId(req);
    await clearSession(res, sid);

    res.json({ success: true });
  } catch (err) {
    console.error("[AUTH] Failed to delete account:", err);
    res.status(500).json({ error: "Failed to delete account" });
  }
});

export default router;
