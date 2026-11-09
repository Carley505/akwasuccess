"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Field, FormAlert, Input, Select, Textarea } from "@/components/ui/Form";
import { Tabs } from "@/components/ui/Tabs";
import { Badge } from "@/components/ui/Badge";
import { centsToDollars, formatDate, formatMoney } from "@/lib/utils";

type AdminProduct = {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  type: string;
  categorySlug: string;
  level: string;
  priceCents: number;
  salePriceCents: number | null;
  pages: number | null;
  featured: boolean;
  isSample: boolean;
  coverUrl: string | null;
  outcomes: string[];
  toc: string[];
  status: string;
  wooId?: number | null;
};

type AdminOrder = {
  id: string;
  number: string;
  email: string;
  status: string;
  totalCents: number;
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
    revenueCents: number;
    paidOrders: number;
    pendingOrders: number;
    subscribersCount: number;
  };
  products: AdminProduct[];
  orders: AdminOrder[];
  reviews: AdminReview[];
  testimonials: AdminTestimonial[];
  envStatus: {
    paystackConfigured: boolean;
    emailConfigured: boolean;
    woocommerceConfigured?: boolean;
    woocommerceUrl?: string;
  };
}) {
  const router = useRouter();
  const [msg, setMsg] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState<AdminProduct | null>(null);
  const [formKey, setFormKey] = useState(0);

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

  async function onProductSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    fd.set("action", "upsert-product");

    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/admin/actions", {
        method: "POST",
        body: fd,
      });
      const data = (await res.json()) as { message?: string; error?: string };
      if (!res.ok) {
        setMsg({ tone: "error", text: data.error ?? "Could not save product." });
      } else {
        setMsg({ tone: "success", text: data.message ?? "Product saved." });
        router.refresh();
      }
    } catch {
      setMsg({ tone: "error", text: "Network error while saving product." });
    } finally {
      setBusy(false);
    }
  }

  function selectForEdit(p: AdminProduct) {
    setEditing(p);
    setFormKey((k) => k + 1);
  }

  function clearProductForm() {
    setEditing(null);
    setFormKey((k) => k + 1);
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
          <p className="mt-1 font-serif text-2xl font-bold">{formatMoney(stats.revenueCents)}</p>
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
              <div className="grid items-start gap-8 lg:grid-cols-12">
                <div className="space-y-3 lg:col-span-7">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h2 className="text-xl font-bold">Store catalog ({products.length})</h2>
                    <div className="flex flex-wrap items-center gap-2">
                      {envStatus.woocommerceConfigured && (
                        <Button
                          size="sm"
                          variant="primary"
                          loading={busy}
                          onClick={() => callAdmin({ action: "sync-woocommerce" })}
                        >
                          Sync from WooCommerce now
                        </Button>
                      )}
                      <Button size="sm" variant="secondary" onClick={clearProductForm}>
                        + New product
                      </Button>
                    </div>
                  </div>
                  <ul className="space-y-2.5 text-sm">
                    {products.map((p) => (
                      <li
                        key={p.id}
                        className="card flex flex-wrap items-center justify-between gap-3 p-4"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          {p.coverUrl && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={
                                p.coverUrl.startsWith("/uploads/")
                                  ? `/api${p.coverUrl}`
                                  : p.coverUrl
                              }
                              alt={`${p.title} cover`}
                              className="border-line h-14 w-9 shrink-0 rounded border object-cover"
                            />
                          )}
                          <div className="min-w-0 space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="font-bold">{p.title}</p>
                              <Badge tone="green">{p.categorySlug}</Badge>
                              <Badge>{p.type}</Badge>
                              {p.wooId && <Badge tone="outline-gold">WC #{p.wooId}</Badge>}
                              {p.isSample && <Badge tone="gold">Mockup</Badge>}
                            </div>
                            <p className="text-muted break-all text-xs">
                              Slug: <code>{p.slug}</code> • {p.status}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-bold">{formatMoney(p.priceCents)}</span>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => selectForEdit(p)}
                          >
                            Edit
                          </Button>
                          <Link
                            href={`/shop/${p.slug}`}
                            className="text-link px-2 text-xs font-semibold no-underline hover:underline"
                          >
                            View
                          </Link>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() =>
                              callAdmin({ action: "delete-product", productId: p.id })
                            }
                          >
                            Delete
                          </Button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>

                <form
                  key={formKey}
                  onSubmit={onProductSubmit}
                  className="card min-w-0 space-y-4 p-4 sm:p-6 lg:col-span-5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-lg font-bold">
                      {editing ? `Edit: ${editing.title}` : "Add or update product"}
                    </h3>
                    {editing && (
                      <button
                        type="button"
                        onClick={clearProductForm}
                        className="text-link text-xs font-semibold underline"
                      >
                        Clear form
                      </button>
                    )}
                  </div>

                  <Field id="adm-p-slug" label="URL Slug">
                    <Input
                      id="adm-p-slug"
                      name="slug"
                      required
                      defaultValue={editing?.slug ?? ""}
                      placeholder="e.g. solar-inverter-installation-guide"
                    />
                  </Field>
                  <Field id="adm-p-title" label="Title">
                    <Input
                      id="adm-p-title"
                      name="title"
                      required
                      defaultValue={editing?.title ?? ""}
                      placeholder="e.g. Practical Solar & Inverter Installation Guide"
                    />
                  </Field>
                  <Field id="adm-p-sub" label="Subtitle" optional>
                    <Input
                      id="adm-p-sub"
                      name="subtitle"
                      defaultValue={editing?.subtitle ?? ""}
                      placeholder="Short one-sentence summary shown on cards"
                    />
                  </Field>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <Field id="adm-p-type" label="Format / Type">
                      <Select
                        id="adm-p-type"
                        name="type"
                        defaultValue={editing?.type ?? "ebook"}
                      >
                        <option value="ebook">eBook</option>
                        <option value="course">Course</option>
                        <option value="tutorial">Tutorial</option>
                        <option value="service">Service</option>
                        <option value="bundle">Bundle</option>
                      </Select>
                    </Field>
                    <Field id="adm-p-cat" label="Category">
                      <Select
                        id="adm-p-cat"
                        name="categorySlug"
                        defaultValue={editing?.categorySlug ?? "crypto"}
                      >
                        <option value="crypto">Crypto</option>
                        <option value="finance">Finance</option>
                        <option value="technical">Technical</option>
                        <option value="psychology">Psychology</option>
                        <option value="marketing">Marketing</option>
                        <option value="services">Services</option>
                      </Select>
                    </Field>
                    <Field id="adm-p-level" label="Level">
                      <Select
                        id="adm-p-level"
                        name="level"
                        defaultValue={editing?.level ?? "beginner"}
                      >
                        <option value="beginner">Beginner</option>
                        <option value="intermediate">Intermediate</option>
                        <option value="advanced">Advanced</option>
                      </Select>
                    </Field>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <Field id="adm-p-price" label="Price (USD)">
                      <Input
                        id="adm-p-price"
                        name="priceUsd"
                        type="number"
                        min="0"
                        step="0.01"
                        inputMode="decimal"
                        defaultValue={
                          editing ? centsToDollars(editing.priceCents) : "12.00"
                        }
                      />
                    </Field>
                    <Field id="adm-p-sale" label="Sale (USD)" optional>
                      <Input
                        id="adm-p-sale"
                        name="salePriceUsd"
                        type="number"
                        min="0"
                        step="0.01"
                        inputMode="decimal"
                        defaultValue={
                          editing?.salePriceCents
                            ? centsToDollars(editing.salePriceCents)
                            : ""
                        }
                      />
                    </Field>
                    <Field id="adm-p-pages" label="Pages" optional>
                      <Input
                        id="adm-p-pages"
                        name="pages"
                        type="number"
                        defaultValue={editing?.pages ?? ""}
                      />
                    </Field>
                  </div>

                  <Field id="adm-p-desc" label="Description">
                    <Textarea
                      id="adm-p-desc"
                      name="description"
                      defaultValue={editing?.description ?? ""}
                    />
                  </Field>

                  <Field
                    id="adm-p-outcomes"
                    label="What you will learn (one bullet per line)"
                    optional
                  >
                    <Textarea
                      id="adm-p-outcomes"
                      name="outcomesText"
                      defaultValue={editing?.outcomes.join("\n") ?? ""}
                    />
                  </Field>

                  <Field
                    id="adm-p-toc"
                    label="Table of contents (one chapter/part title per line)"
                    optional
                  >
                    <Textarea
                      id="adm-p-toc"
                      name="tocText"
                      defaultValue={editing?.toc.join("\n") ?? ""}
                    />
                  </Field>

                  <div className="border-line space-y-3 rounded-lg border p-3.5">
                    <p className="text-xs font-bold tracking-wider uppercase">
                      File &amp; Cover Uploads (optional)
                    </p>
                    <Field
                      id="adm-p-cover"
                      label="Cover image (2:3 ratio, JPG/PNG/WebP)"
                      optional
                    >
                      <Input id="adm-p-cover" name="coverFile" type="file" accept="image/*" />
                    </Field>
                    <Field
                      id="adm-p-file"
                      label="Full digital eBook file (PDF or EPUB — delivered to buyers)"
                      optional
                    >
                      <Input
                        id="adm-p-file"
                        name="productFile"
                        type="file"
                        accept=".pdf,.epub,application/pdf,application/epub+zip"
                      />
                    </Field>
                    <Field
                      id="adm-p-sample"
                      label="Free sample chapter (PDF — public preview)"
                      optional
                    >
                      <Input
                        id="adm-p-sample"
                        name="sampleFile"
                        type="file"
                        accept=".pdf,application/pdf"
                      />
                    </Field>
                  </div>

                  <div className="grid grid-cols-1 items-center gap-3 sm:grid-cols-2">
                    <Field id="adm-p-status" label="Status">
                      <Select
                        id="adm-p-status"
                        name="status"
                        defaultValue={editing?.status ?? "published"}
                      >
                        <option value="published">Published</option>
                        <option value="draft">Draft</option>
                      </Select>
                    </Field>
                    <label className="mt-1 flex items-center gap-2 text-sm font-medium sm:mt-6">
                      <input
                        type="checkbox"
                        name="featured"
                        defaultChecked={editing?.featured ?? false}
                        className="size-4 rounded"
                      />
                      <span>Feature on Home page</span>
                    </label>
                  </div>

                  <Button type="submit" loading={busy} block>
                    {editing ? "Update product" : "Create product"}
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
                            {formatDate(o.createdAt)} •{" "}
                            <span className="capitalize">{o.status}</span>
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold">{formatMoney(o.totalCents)}</span>
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
                      <Input name="code" placeholder="WELCOME15" required />
                      <Select name="type" defaultValue="percent">
                        <option value="percent">% off</option>
                        <option value="fixed">USD off</option>
                      </Select>
                      <Input
                        name="value"
                        type="number"
                        min="1"
                        step="0.01"
                        defaultValue="15"
                        required
                      />
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
                      Paystack Card (USD):{" "}
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
                      Privacy requests (GDPR / CCPA) — Customer deletion tool
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
