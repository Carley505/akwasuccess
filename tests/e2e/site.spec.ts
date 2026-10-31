import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

/**
 * Device width matrix from Spec 6.3 + 21 (280px foldable up to 1920px desktop).
 */
const WIDTHS = [280, 320, 360, 375, 390, 412, 600, 768, 820, 1024, 1280, 1440, 1920];

test.describe("Responsive & Accessibility checks", () => {
  test("No horizontal scroll across the device width matrix on Home, Shop, and Product pages", async ({
    page,
  }) => {
    const routes = [
      "/",
      "/shop",
      "/shop/basic-electrical-electronics-instrumentation-automation-ebook",
      "/cart",
    ];

    for (const route of routes) {
      await page.goto(route);
      for (const width of WIDTHS) {
        await page.setViewportSize({ width, height: 800 });
        const overflow = await page.evaluate(
          () => document.documentElement.scrollWidth > window.innerWidth,
        );
        expect(overflow, `Horizontal overflow at ${width}px on ${route}`).toBe(false);
      }
    }
  });

  test("Zero critical or serious axe accessibility issues on Home and Product page", async ({
    page,
  }) => {
    for (const route of [
      "/",
      "/shop/basic-electrical-electronics-instrumentation-automation-ebook",
    ]) {
      await page.goto(route);
      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
        .analyze();
      const seriousOrCritical = results.violations.filter(
        (v) => v.impact === "critical" || v.impact === "serious",
      );
      expect(seriousOrCritical).toEqual([]);
    }
  });
});

test.describe("Commerce & Redirect flows", () => {
  test("End-to-end guest checkout with M-Pesa STK Push sandbox and instant PDF download", async ({
    page,
  }) => {
    await page.goto("/shop/cryptocurrency-for-beginners");
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "Cryptocurrency for Beginners",
    );

    // Click Buy now -> goes to /checkout
    await page.getByRole("button", { name: "Buy now" }).first().click();
    await expect(page).toHaveURL(/\/checkout/);

    await page.getByLabel("Email address").fill("buyer@example.com");
    await page.getByLabel("M-Pesa phone number").fill("0712 345 678");
    await page.getByRole("button", { name: /Pay .* with M-Pesa/i }).click();

    // Waiting screen appears -> click Simulate PIN Approved
    await expect(
      page.getByRole("heading", { name: /Check your phone and enter your M-Pesa PIN/i }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Simulate PIN Approved" }).click();

    // Redirected to order confirmation with instant download link
    await expect(page).toHaveURL(/\/checkout\/order\//);
    await expect(page.getByRole("heading", { level: 1 })).toContainText("confirmed");
    const downloadLink = page.getByRole("link", { name: /Download PDF/i }).first();
    await expect(downloadLink).toBeVisible();
  });

  test("Legacy WordPress URLs redirect with 301/308 to the new routes", async ({ request }) => {
    const res = await request.get("/what-we-do/ebooks", { maxRedirects: 0 });
    expect([301, 308]).toContain(res.status());
    expect(res.headers()["location"]).toContain("/shop");
  });
});
