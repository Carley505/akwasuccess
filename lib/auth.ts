import "server-only";
import crypto from "node:crypto";
import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { and, eq, gt, isNull } from "drizzle-orm";
import { getDb, schema as s } from "@/lib/db";

const SESSION_COOKIE = "akwa_session";

function getSecretKey() {
  const secret =
    process.env.AUTH_SECRET || "akwasuccess-dev-secret-key-please-change-in-production-32chars";
  return new TextEncoder().encode(secret);
}

export type SessionPayload = {
  userId: string;
  email: string;
  role: "customer" | "admin";
};

export async function createSessionToken(payload: SessionPayload): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(getSecretKey());
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    if (typeof payload.userId !== "string" || typeof payload.email !== "string") return null;
    return {
      userId: payload.userId,
      email: payload.email,
      role: payload.role === "admin" ? "admin" : "customer",
    };
  } catch {
    return null;
  }
}

export async function setSessionCookie(payload: SessionPayload) {
  const token = await createSessionToken(payload);
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function clearSessionCookie() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

export async function getSessionUser(): Promise<s.User | null> {
  const store = await cookies();
  const raw = store.get(SESSION_COOKIE)?.value;
  if (!raw) return null;
  const session = await verifySessionToken(raw);
  if (!session) return null;
  const db = await getDb();
  const [user] = await db.select().from(s.users).where(eq(s.users.id, session.userId));
  return user ?? null;
}

export async function findOrCreateUser(opts: {
  email: string;
  name?: string | null;
  phone?: string | null;
  marketingConsent?: boolean;
}): Promise<s.User> {
  const db = await getDb();
  const cleanEmail = opts.email.toLowerCase().trim();
  const adminEmail = (process.env.ADMIN_EMAIL ?? "owner@akwasuccess.com").toLowerCase().trim();
  const role: "customer" | "admin" = cleanEmail === adminEmail ? "admin" : "customer";

  const [existing] = await db.select().from(s.users).where(eq(s.users.email, cleanEmail));
  if (existing) {
    const [updated] = await db
      .update(s.users)
      .set({
        name: opts.name || existing.name,
        phone: opts.phone || existing.phone,
        role: existing.role === "admin" ? "admin" : role,
        marketingConsent: opts.marketingConsent ?? existing.marketingConsent,
        updatedAt: new Date(),
      })
      .where(eq(s.users.id, existing.id))
      .returning();
    return updated!;
  }

  const [created] = await db
    .insert(s.users)
    .values({
      email: cleanEmail,
      name: opts.name ?? null,
      phone: opts.phone ?? null,
      role,
      marketingConsent: Boolean(opts.marketingConsent),
    })
    .returning();
  return created!;
}

function sha256(input: string) {
  return crypto.createHash("sha256").update(input).digest("hex");
}

export async function issueMagicLoginToken(email: string, redirectTo = "/account") {
  const db = await getDb();
  const rawToken = crypto.randomBytes(24).toString("hex");
  const tokenHash = sha256(rawToken);
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

  await db.insert(s.loginTokens).values({
    email: email.toLowerCase().trim(),
    tokenHash,
    redirectTo,
    expiresAt,
  });

  return rawToken;
}

export async function consumeMagicLoginToken(rawToken: string) {
  const db = await getDb();
  const tokenHash = sha256(rawToken);
  const [row] = await db
    .select()
    .from(s.loginTokens)
    .where(
      and(
        eq(s.loginTokens.tokenHash, tokenHash),
        isNull(s.loginTokens.usedAt),
        gt(s.loginTokens.expiresAt, new Date()),
      ),
    );
  if (!row) return null;

  await db
    .update(s.loginTokens)
    .set({ usedAt: new Date() })
    .where(eq(s.loginTokens.id, row.id));

  const user = await findOrCreateUser({ email: row.email });
  await db
    .update(s.users)
    .set({ lastLoginAt: new Date() })
    .where(eq(s.users.id, user.id));

  return { user, redirectTo: row.redirectTo || "/account" };
}
