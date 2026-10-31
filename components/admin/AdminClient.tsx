"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Field, FormAlert, Input, Select, Textarea } from "@/components/ui/Form";
import { Tabs } from "@/components/ui/Tabs";
import { Badge } from "@/components/ui/Badge";
import { formatDate, formatKes } from "@/lib/utils";

type AdminProduct = {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  type: string;
  categorySlug: string;
  level: string;
  priceKes: number;
  status: string;
};

type AdminOrder = {
  id: string;
  number: string;
  email: string;
  status: string;
  totalKes: number;
  createdAt: string;
};

type AdminReview = {
  id: string;
  displayName: string;
  rating: number;
  body: string;
  status: string;
};

type AdminTestimonial = {
  id: string;
  name: string;
  quote: string;
  status: string;
};

export function AdminClient({
  stats,
  products,
  orders,
  reviews,
  testimonials,
  envStatus,
}: {
  stats: {
    revenueKes: number;
    paidOrders: number;
    pendingOrders: number;
    subscribersCount: number;
  };
  products: AdminProduct[];
  orders: AdminOrder[];
  reviews: AdminReview[];
  testimonials: AdminTestimonial[];
  envStatus: { mpesaConfigured: boolean; paystackConfigured: boolean; emailConfigured: boolean };
}) {
  const router = useRouter();
  const [msg, setMsg] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  async function callAdmin(payload: Record<string, unknown>) {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/admin/actions", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json()) as { message?: string; error?: string };
      if (!res.ok) {
        setMsg({ tone: "error", text: data.error ?? "Action failed." });
      } else {
        setMsg({ tone: "success", text: data.message ?? "Saved." });
        router.refresh();
      }
    } catch {
      setMsg({ tone: "error", text: "Network error." });
    } finally {
      setBusy(false);
    }
  }

  function onProductSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    callAdmin({
      action: "upsert-product",
      slug: fd.get("slug"),
      title: fd.get("title"),
      subtitle: fd.get("subtitle"),
      description: fd.get("description"),
      type: fd.get("type"),
      categorySlug: fd.get("categorySlug"),
      level: fd.get("level"),
      priceKes: fd.get("priceKes"),
      salePriceKes: fd.get("salePriceKes"),
      pages: fd.get("pages"),
      outcomesText: fd.get("outcomesText"),
      status: fd.get("status"),
    });
  }

  function onArticleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    callAdmin({
      action: "upsert-article",
      slug: fd.get("slug"),
      title: fd.get("title"),
      excerpt: fd.get("excerpt"),
      categorySlug: fd.get("categorySlug"),
      level: fd.get("level"),
      body: fd.get("body"),
      status: "published",
    });
  }

  return (
    <div className="space-y-8">
      {/* KPI cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card p-5">
          <p className="text-muted text-xs font-bold uppercase">Total revenue</p>
          <p className="mt-1 font-serif text-2xl font-bold">{formatKes(stats.revenueKes)}</p>
        </div>
        <div className="card p-5">
          <p className="text-muted text-xs font-bold uppercase">Paid orders</p>
          <p className="mt-1 font-serif text-2xl font-bold">{stats.paidOrders}</p>
        </div>
        <div className="card p-5">
          <p className="text-muted text-xs font-bold uppercase">Abandoned / pending</p>
          <p className="mt-1 font-serif text-2xl font-bold">{stats.pendingOrders}</p>
        </div>
        <div className="card p-5">
          <p className="text-muted text-xs font-bold uppercase">Newsletter subscribers</p>
          <p className="mt-1 font-serif text-2xl font-bold">{stats.subscribersCount}</p>
        </div>
      </div>

      {msg && <FormAlert tone={msg.tone}>{msg.text}</FormAlert>}

      <Tabs
        ariaLabel="Admin sections"
        items={[
          {
            id: "products",
            label: `Products (${products.length})`,
            content: (
              <div className="grid gap-8 lg:grid-cols-12">
                <div className="space-y-3 lg:col-span-7">
                  <h2 className="text-xl font-bold">Existing products</h2>
                  <ul className="space-y-2.5 text-sm">
                    {products.map((p) => (
                      <li
                        key={p.id}
                        className="card flex flex-wrap items-center justify-between gap-2 p-4"
                      >
                        <div>
                          <p className="font-bold">{p.title}</p>
                          <p className="text-muted text-xs">
                            Slug: <code>{p.slug}</code> • {p.type} • {p.categorySlug}
                          </p>
                        </div>
                        <span className="font-bold">{formatKes(p.priceKes)}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <form
                  onSubmit={onProductSubmit}
                  className="card space-y-4 p-6 lg:col-span-5"
                >
                  <h3 className="text-lg font-bold">Add or update product (by slug)</h3>
                  <Field id="adm-p-slug" label="Slug">
                    <Input
                      id="adm-p-slug"
                      name="slug"
                      required
                      placeholder="cryptocurrency-for-beginners"
                    />
                  </Field>
                  <Field id="adm-p-title" label="Title">
                    <Input id="adm-p-title" name="title" required />
                  </Field>
                  <Field id="adm-p-sub" label="Subtitle" optional>
                    <Input id="adm-p-sub" name="subtitle" />
                  </Field>
                  <div className="grid grid-cols-2 gap-3">
                    <Field id="adm-p-type" label="Type">
                      <Select id="adm-p-type" name="type" defaultValue="ebook">
                        <option value="ebook">eBook</option>
                        <option value="course">Course</option>
                        <option value="tutorial">Tutorial</option>
                        <option value="service">Service</option>
                        <option value="bundle">Bundle</option>
                      </Select>
                    </Field>
                    <Field id="adm-p-cat" label="Category">
                      <Select id="adm-p-cat" name="categorySlug" defaultValue="crypto">
                        <option value="crypto">Crypto</option>
                        <option value="finance">Finance</option>
                        <option value="technical">Technical</option>
                        <option value="psychology">Psychology</option>
                        <option value="services">Services</option>
                      </Select>
                    </Field>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <Field id="adm-p-price" label="Price (KES)">
                      <Input
                        id="adm-p-price"
                        name="priceKes"
                        type="number"
                        defaultValue="1000"
                      />
                    </Field>
                    <Field id="adm-p-sale" label="Sale (KES)" optional>
                      <Input id="adm-p-sale" name="salePriceKes" type="number" />
                    </Field>
                    <Field id="adm-p-pages" label="Pages" optional>
                      <Input id="adm-p-pages" name="pages" type="number" />
                    </Field>
                  </div>
                  <Field id="adm-p-desc" label="Description">
                    <Textarea id="adm-p-desc" name="description" />
                  </Field>
                  <Field
                    id="adm-p-outcomes"
                    label="What you will learn (one outcome per line)"
                    optional
                  >
                    <Textarea id="adm-p-outcomes" name="outcomesText" />
                  </Field>
                  <Field id="adm-p-status" label="Status">
                    <Select id="adm-p-status" name="status" defaultValue="published">
                      <option value="published">Published</option>
                      <option value="draft">Draft</option>
                    </Select>
                  </Field>
                  <Button type="submit" loading={busy}>
                    Save product
                  </Button>
                </form>
              </div>
            ),
          },
          {
            id: "orders",
            label: `Orders (${orders.length})`,
            content: (
              <div className="grid gap-8 lg:grid-cols-12">
                <div className="space-y-3 lg:col-span-7">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h2 className="text-xl font-bold">Recent orders</h2>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => callAdmin({ action: "send-abandoned-reminders" })}
                    >
                      Send abandoned-cart reminders
                    </Button>
                  </div>

                  <ul className="space-y-2.5 text-sm">
                    {orders.map((o) => (
                      <li
                        key={o.id}
                        className="card flex flex-wrap items-center justify-between gap-3 p-4"
                      >
                        <div>
                          <p className="font-bold">
                            #{o.number} — {o.email}
                          </p>
                          <p className="text-muted text-xs">
                            {formatDate(o.createdAt)} • <span className="capitalize">{o.status}</span>
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold">{formatKes(o.totalKes)}</span>
                          {o.status === "paid" && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() =>
                                callAdmin({ action: "refund-order", orderId: o.id })
                              }
                            >
                              Refund
                            </Button>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Manual Grant Access */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const fd = new FormData(e.currentTarget);
                    callAdmin({
                      action: "grant-access",
                      email: fd.get("email"),
                      productId: fd.get("productId"),
                    });
                  }}
                  className="card space-y-4 p-6 lg:col-span-5"
                >
                  <h3 className="text-lg font-bold">Manually grant product access</h3>
                  <Field id="grant-email" label="Customer email">
                    <Input id="grant-email" name="email" type="email" required />
                  </Field>
                  <Field id="grant-prod" label="Product">
                    <Select id="grant-prod" name="productId">
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.title}
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <Button type="submit" size="sm" loading={busy}>
                    Grant access
                  </Button>
                </form>
              </div>
            ),
          },
          {
            id: "articles",
            label: "Articles (CMS)",
            content: (
              <form onSubmit={onArticleSubmit} className="card max-w-2xl space-y-4 p-6">
                <h2 className="text-xl font-bold">Publish or update a free article</h2>
                <Field id="adm-a-slug" label="URL slug">
                  <Input
                    id="adm-a-slug"
                    name="slug"
                    required
                    placeholder="how-plc-sensors-work"
                  />
                </Field>
                <Field id="adm-a-title" label="Article title">
                  <Input id="adm-a-title" name="title" required />
                </Field>
                <Field id="adm-a-excerpt" label="Short summary">
                  <Input id="adm-a-excerpt" name="excerpt" required />
                </Field>
                <Field id="adm-a-cat" label="Category">
                  <Select id="adm-a-cat" name="categorySlug" defaultValue="crypto">
                    <option value="crypto">Crypto</option>
                    <option value="finance">Finance</option>
                    <option value="technical">Technical</option>
                    <option value="psychology">Psychology</option>
                  </Select>
                </Field>
                <Field id="adm-a-body" label="Markdown body">
                  <Textarea id="adm-a-body" name="body" required className="min-h-48" />
                </Field>
                <Button type="submit" loading={busy}>
                  Publish article
                </Button>
              </form>
            ),
          },
          {
            id: "moderation",
            label: "Reviews & Stories",
            content: (
              <div className="grid gap-8 md:grid-cols-2">
                <div className="space-y-3">
                  <h2 className="text-xl font-bold">Product reviews</h2>
                  {reviews.length === 0 ? (
                    <p className="text-muted text-sm">No reviews queued.</p>
                  ) : (
                    reviews.map((r) => (
                      <div key={r.id} className="card space-y-2 p-4 text-sm">
                        <div className="flex justify-between">
                          <span className="font-bold">
                            {r.displayName} ({r.rating}★)
                          </span>
                          <Badge>{r.status}</Badge>
                        </div>
                        <p>{r.body}</p>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() =>
                              callAdmin({
                                action: "moderate-review",
                                id: r.id,
                                status: "approved",
                              })
                            }
                          >
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() =>
                              callAdmin({
                                action: "moderate-review",
                                id: r.id,
                                status: "rejected",
                              })
                            }
                          >
                            Reject
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="space-y-3">
                  <h2 className="text-xl font-bold">Learner stories</h2>
                  {testimonials.length === 0 ? (
                    <p className="text-muted text-sm">No stories queued.</p>
                  ) : (
                    testimonials.map((t) => (
                      <div key={t.id} className="card space-y-2 p-4 text-sm">
                        <div className="flex justify-between">
                          <span className="font-bold">{t.name}</span>
                          <Badge>{t.status}</Badge>
                        </div>
                        <p>&ldquo;{t.quote}&rdquo;</p>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() =>
                              callAdmin({
                                action: "moderate-testimonial",
                                id: t.id,
                                status: "approved",
                              })
                            }
                          >
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() =>
                              callAdmin({
                                action: "moderate-testimonial",
                                id: t.id,
                                status: "rejected",
                              })
                            }
                          >
                            Reject
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ),
          },
          {
            id: "settings",
            label: "Coupons, Subscribers & Settings",
            content: (
              <div className="grid gap-8 md:grid-cols-2">
                <div className="space-y-6">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      const fd = new FormData(e.currentTarget);
                      callAdmin({
                        action: "create-coupon",
                        code: fd.get("code"),
                        type: fd.get("type"),
                        value: fd.get("value"),
                      });
                    }}
                    className="card space-y-3 p-5"
                  >
                    <h3 className="text-lg font-bold">Create coupon</h3>
                    <div className="grid grid-cols-3 gap-2">
                      <Input name="code" placeholder="KENYA15" required />
                      <Select name="type" defaultValue="percent">
                        <option value="percent">% off</option>
                        <option value="fixed">KES off</option>
                      </Select>
                      <Input name="value" type="number" defaultValue="15" required />
                    </div>
                    <Button type="submit" size="sm">
                      Save coupon
                    </Button>
                  </form>

                  <div className="card space-y-3 p-5">
                    <h3 className="text-lg font-bold">Newsletter subscribers export</h3>
                    <p className="text-muted text-xs">
                      Download all subscriber emails and timestamps as CSV.
                    </p>
                    <a
                      href="/api/admin/subscribers-csv"
                      className="bg-primary text-primary-fg inline-flex min-h-11 items-center rounded-md px-4 text-sm font-semibold no-underline"
                    >
                      Export subscribers CSV
                    </a>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="card space-y-2 p-5 text-sm">
                    <h3 className="text-lg font-bold">Integration keys status</h3>
                    <p>
                      M-Pesa Daraja:{" "}
                      <strong>
                        {envStatus.mpesaConfigured ? "Live keys set" : "Sandbox Simulator active"}
                      </strong>
                    </p>
                    <p>
                      Paystack Card:{" "}
                      <strong>
                        {envStatus.paystackConfigured
                          ? "Live keys set"
                          : "Sandbox Simulator active"}
                      </strong>
                    </p>
                    <p>
                      Transactional Email:{" "}
                      <strong>
                        {envStatus.emailConfigured ? "Resend active" : "Local outbox active"}
                      </strong>
                    </p>
                  </div>

                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      const fd = new FormData(e.currentTarget);
                      callAdmin({ action: "delete-user-data", email: fd.get("email") });
                    }}
                    className="card space-y-3 p-5"
                  >
                    <h3 className="text-lg font-bold">
                      Kenya Data Protection Act — Customer deletion tool
                    </h3>
                    <Input
                      name="email"
                      type="email"
                      required
                      placeholder="customer@example.com"
                    />
                    <Button type="submit" size="sm" variant="destructive">
                      Delete customer profile
                    </Button>
                  </form>
                </div>
              </div>
            ),
          },
        ]}
      />
    </div>
  );
}
