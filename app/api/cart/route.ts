import { NextResponse, type NextRequest } from "next/server";
import { and, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { getSessionUser } from "@/lib/auth";
import { getDb, schema as s } from "@/lib/db";
import { effectivePrice } from "@/lib/pricing";

const cartItemSchema = z.object({
  productId: z.string(),
  slug: z.string(),
  title: z.string(),
  type: z.string(),
  categorySlug: z.string(),
  priceCents: z.number().int().min(0),
});

const putCartSchema = z.object({
  items: z.array(cartItemSchema).max(50),
  merge: z.boolean().optional().default(false),
});

/**
 * Returns the signed-in user's persisted cart (with refreshed authoritative
 * prices) and authentication status for the Cart & Checkout guest/account UI.
 */
export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({
      authenticated: false,
      user: null,
      items: [],
    });
  }

  const db = await getDb();
  const [row] = await db.select().from(s.carts).where(eq(s.carts.userId, user.id));
  const savedItems = row?.items ?? [];

  if (savedItems.length === 0) {
    return NextResponse.json({
      authenticated: true,
      user: { email: user.email, name: user.name },
      items: [],
    });
  }

  // Refresh prices and titles against current published products
  const ids = savedItems.map((i) => i.productId);
  const prods = await db
    .select()
    .from(s.products)
    .where(and(inArray(s.products.id, ids), eq(s.products.status, "published")));
  const byId = new Map(prods.map((p) => [p.id, p]));

  const refreshed: s.PersistedCartItem[] = [];
  for (const item of savedItems) {
    const p = byId.get(item.productId);
    if (p) {
      refreshed.push({
        productId: p.id,
        slug: p.slug,
        title: p.title,
        type: p.type,
        categorySlug: p.categorySlug,
        priceCents: effectivePrice(p),
      });
    } else {
      refreshed.push(item);
    }
  }

  return NextResponse.json({
    authenticated: true,
    user: { email: user.email, name: user.name },
    items: refreshed,
  });
}

/**
 * Saves or merges the signed-in user's cart into the `carts` table so their
 * cart persists across devices and browsers.
 */
export async function PUT(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ authenticated: false, items: [] });
  }

  const parsed = putCartSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid cart items." }, { status: 400 });
  }

  const db = await getDb();
  let nextItems: s.PersistedCartItem[] = parsed.data.items;

  if (parsed.data.merge) {
    const [existing] = await db.select().from(s.carts).where(eq(s.carts.userId, user.id));
    const mergedById = new Map<string, s.PersistedCartItem>();
    for (const item of existing?.items ?? []) {
      mergedById.set(item.productId, item);
    }
    for (const item of parsed.data.items) {
      mergedById.set(item.productId, item);
    }
    nextItems = Array.from(mergedById.values());
  }

  await db
    .insert(s.carts)
    .values({
      userId: user.id,
      items: nextItems,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: s.carts.userId,
      set: { items: nextItems, updatedAt: new Date() },
    });

  return NextResponse.json({
    authenticated: true,
    items: nextItems,
  });
}
