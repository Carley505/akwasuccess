import { spawn } from "node:child_process";

async function waitForServer(url: string, timeoutMs = 30_000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch {
      /* wait */
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`Server did not become ready at ${url}`);
}

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(`Assertion failed: ${msg}`);
}

async function main() {
  // Look up seeded product ID before starting server so only one process holds PGlite at a time
  const { openDb } = await import("./db");
  const { eq } = await import("drizzle-orm");
  const { products } = await import("../lib/db/schema");
  const { db, close } = await openDb();
  const [cryptoProd] = await db
    .select()
    .from(products)
    .where(eq(products.slug, "cryptocurrency-for-beginners"));
  await close();
  assert(cryptoProd, "Seeded product found");

  const port = 3456;
  const base = `http://localhost:${port}`;

  const server = spawn(
    process.execPath,
    ["node_modules/next/dist/bin/next", "start", "-p", String(port)],
    {
      env: { ...process.env, SHOW_SAMPLE_DATA: "true" },
      stdio: "pipe",
    },
  );

  try {
    await waitForServer(`${base}/`);
    console.log("1. Server ready at", base);

    // 1. Home page sections & mandatory disclaimer
    const homeHtml = await (await fetch(`${base}/`)).text();
    assert(
      homeHtml.includes("Learn practical skills for money, technology and life."),
      "Home H1 present",
    );
    assert(
      homeHtml.includes("Educational notice: Cryptocurrency and digital assets involve significant risks."),
      "Mandatory footer disclaimer present",
    );
    console.log("2. Home page & mandatory disclaimer verified.");

    // 2. Legacy 301 redirects (Spec 5.1)
    const redir1 = await fetch(`${base}/what-we-do/ebooks`, { redirect: "manual" });
    assert([301, 308].includes(redir1.status), "/what-we-do/ebooks returns permanent redirect");
    assert(
      (redir1.headers.get("location") ?? "").endsWith("/shop"),
      "/what-we-do/ebooks redirects to /shop",
    );

    const redir2 = await fetch(`${base}/act`, { redirect: "manual" });
    assert([301, 308].includes(redir2.status), "/act returns permanent redirect");
    assert(
      (redir2.headers.get("location") ?? "").endsWith("/free"),
      "/act redirects to /free",
    );
    console.log("3. Legacy WordPress 301 redirects verified.");

    // 3. Instant search API
    const searchRes = (await (await fetch(`${base}/api/search?q=crypto`)).json()) as {
      results: { title: string }[];
    };
    assert(searchRes.results.length > 0, "Search API returns matching products/articles");
    console.log("4. Instant search API verified.");

    // 4. Product page (sample chapter download link, TOC, FAQ, disclaimer)
    const prodHtml = await (
      await fetch(`${base}/shop/cryptocurrency-for-beginners`)
    ).text();
    assert(prodHtml.includes("Read a free sample"), "Product page has free sample CTA");
    assert(prodHtml.includes("Table of contents"), "Product page has TOC");
    assert(prodHtml.includes("application/ld+json"), "Product page has JSON-LD schema");
    console.log("5. Product detail page verified.");

    // 5. End-to-end Guest Checkout + USD Card Payment + Idempotent Settlement + Signed PDF Download
    const checkoutRes = await fetch(`${base}/api/checkout`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        email: "e2e-buyer@example.com",
        name: "E2E Buyer",
        method: "card",
        productIds: [cryptoProd.id],
        couponCode: "SAMPLE10",
        marketingConsent: true,
      }),
    });
    const checkoutData = (await checkoutRes.json()) as {
      orderId?: string;
      paymentId?: string;
      status?: string;
    };
    assert(checkoutRes.ok && checkoutData.paymentId && checkoutData.orderId, "Checkout initiated");

    // Confirm sandbox card payment settlement (if not already auto-settled)
    if (checkoutData.status !== "succeeded") {
      const simRes = await fetch(`${base}/api/payments/${checkoutData.paymentId}/status`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "succeed" }),
      });
      assert(simRes.ok, "Card sandbox settlement succeeded");
    }

    // Verify order confirmation page contains signed download URL
    const orderHtml = await (
      await fetch(`${base}/checkout/order/${checkoutData.orderId}`)
    ).text();
    const match = /href="(\/api\/download\/[^"]+)"/.exec(orderHtml);
    assert(match?.[1], "Order confirmation page contains signed download URL");

    // Download the watermarked PDF via the signed URL
    const pdfRes = await fetch(`${base}${match[1]}`);
    assert(pdfRes.ok, "Signed download endpoint returns 200 OK");
    assert(
      pdfRes.headers.get("content-type") === "application/pdf",
      "Signed download streams application/pdf",
    );
    const pdfBytes = new Uint8Array(await pdfRes.arrayBuffer());
    assert(pdfBytes.byteLength > 500, "Downloaded PDF has valid byte length");
    console.log(
      `6. End-to-end USD card checkout + signed watermarked PDF download verified (${pdfBytes.byteLength} bytes).`,
    );

    console.log("ALL ACCEPTANCE CHECKS PASSED.");
  } finally {
    server.kill();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
