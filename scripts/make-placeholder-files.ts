import fs from "node:fs";
import path from "node:path";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

type DocSpec = {
  outPath: string;
  title: string;
  subtitle: string;
  body: string[];
  disclaimer?: string;
};

async function createPdf(spec: DocSpec) {
  const doc = await PDFDocument.create();
  const page = doc.addPage([595.28, 841.89]); // A4
  const serif = await doc.embedFont(StandardFonts.TimesRomanBold);
  const sans = await doc.embedFont(StandardFonts.Helvetica);

  // Header band
  page.drawRectangle({
    x: 0,
    y: 760,
    width: 595.28,
    height: 81.89,
    color: rgb(8 / 255, 71 / 255, 42 / 255),
  });
  page.drawText("AKWASUCCESS — LEARN, BUILD, UNDERSTAND & GROW", {
    x: 48,
    y: 795,
    size: 11,
    font: sans,
    color: rgb(212 / 255, 160 / 255, 23 / 255),
  });

  page.drawText(spec.title, {
    x: 48,
    y: 705,
    size: 20,
    font: serif,
    color: rgb(20 / 255, 35 / 255, 27 / 255),
    maxWidth: 500,
    lineHeight: 26,
  });

  page.drawText(spec.subtitle, {
    x: 48,
    y: 650,
    size: 12,
    font: sans,
    color: rgb(74 / 255, 90 / 255, 82 / 255),
    maxWidth: 500,
  });

  let y = 605;
  for (const line of spec.body) {
    page.drawText(line, {
      x: 48,
      y,
      size: 11,
      font: sans,
      color: rgb(20 / 255, 35 / 255, 27 / 255),
      maxWidth: 500,
      lineHeight: 16,
    });
    y -= 38;
  }

  if (spec.disclaimer) {
    page.drawText(spec.disclaimer, {
      x: 48,
      y: 90,
      size: 9,
      font: sans,
      color: rgb(74 / 255, 90 / 255, 82 / 255),
      maxWidth: 500,
      lineHeight: 13,
    });
  }

  const bytes = await doc.save();
  fs.mkdirSync(path.dirname(spec.outPath), { recursive: true });
  fs.writeFileSync(spec.outPath, bytes);
}

async function main() {
  const cryptoDisclaimer =
    "Educational notice: Cryptocurrency and digital assets involve significant risks. Information provided by Akwasuccess is educational and is not a guarantee of profit or personalised, regulated investment advice.";
  const healthDisclaimer =
    "This content is for education and awareness only. It is not a substitute for professional medical diagnosis or treatment.";

  const specs: DocSpec[] = [
    {
      outPath: "public/samples/basic-electrical-sample.pdf",
      title: "Sample Chapter: Basic Electrical, Electronics & Instrumentation",
      subtitle: "Free preview chapter from Akwasuccess (TODO: owner to replace with final sample)",
      body: [
        "1. Understanding Voltage, Current, and Resistance",
        "Think of electricity in a wire like water flowing through a pipe: voltage is the pressure pushing it forward, current is the rate of flow, and resistance is anything that narrows the pipe.",
        "2. Safety First in Every Installation",
        "Always isolate the supply, lock out the breaker, and test for dead with a working meter before touching any conductor.",
        "3. From Sensors to Automation",
        "Sensors measure temperature, pressure, level, and flow so controllers and PLCs can keep processes running safely.",
      ],
    },
    {
      outPath: "public/samples/psychology-clinic-sample.pdf",
      title: "Sample Chapter: Psychology Clinic — Health Tips for Long Life",
      subtitle: "Free preview chapter from Akwasuccess (TODO: owner to replace with final sample)",
      body: [
        "1. How Daily Habits Shape Wellbeing",
        "Small, steady habits in sleep, movement, nutrition, and stress management add up over years.",
        "2. Understanding Emotional Signals",
        "Stress and fatigue are signals to pause, reflect, and seek support early rather than pushing through silently.",
      ],
      disclaimer: healthDisclaimer,
    },
    {
      outPath: "public/samples/genuine-money-sample.pdf",
      title: "Sample Chapter: The Secrets of Genuine Money",
      subtitle: "Free preview chapter from Akwasuccess (TODO: owner to replace with final sample)",
      body: [
        "1. Why Money Exists",
        "Money solved the problem of barter by serving as a medium of exchange, a unit of account, and a store of value.",
        "2. Financial Literacy Starts with Clarity",
        "Track what comes in, what goes out, and build a safety buffer before taking on financial risk.",
      ],
      disclaimer: cryptoDisclaimer,
    },
    {
      outPath: "public/samples/crypto-beginners-sample.pdf",
      title: "Sample Chapter: Cryptocurrency for Beginners",
      subtitle: "Free preview chapter from Akwasuccess (TODO: owner to replace with final sample)",
      body: [
        "1. What Is Cryptocurrency?",
        "Cryptocurrency is digital money recorded on a shared public ledger called a blockchain.",
        "2. Protecting Your Recovery Phrase",
        "Never share your 12- or 24-word recovery phrase with anyone, and never type it into a website link sent via SMS, WhatsApp, or email.",
      ],
      disclaimer: cryptoDisclaimer,
    },
    {
      outPath: "public/samples/crypto-safety-checklist.pdf",
      title: "Free Resource: Cryptocurrency Safety Checklist",
      subtitle: "Keep this 1-page safety checklist before using any wallet or exchange.",
      body: [
        "[ ] Write your recovery phrase on paper and store it offline in two safe places.",
        "[ ] Never screenshot your recovery phrase or store it in cloud notes or email.",
        "[ ] Enable app-based two-factor authentication (2FA) on any exchange account.",
        "[ ] Double-check the network and address before sending any transfer.",
        "[ ] On P2P, confirm funds in your actual bank or payment app—never trust an SMS or screenshot alone.",
        "[ ] Ignore anyone promising guaranteed returns or asking you to send crypto to 'unlock' profits.",
      ],
      disclaimer: cryptoDisclaimer,
    },
    {
      outPath: "storage/private/products/basic-electrical-electronics.pdf",
      title: "Basic Electrical, Electronics & Instrumentation Automation Technologies",
      subtitle: "Full eBook placeholder — owner will upload the final edition in /admin.",
      body: [
        "Thank you for purchasing this eBook from Akwasuccess.",
        "Part 1: Electrical Basics — Voltage, current, resistance, power, and safe working practices.",
        "Part 2: Electronics — Resistors, capacitors, diodes, transistors, and reading schematics.",
        "Part 3: Instrumentation — Measuring temperature, pressure, level, and flow.",
        "Part 4: Automation — Control loops, PLC fundamentals, and systematic troubleshooting.",
      ],
    },
    {
      outPath: "storage/private/products/psychology-clinic.pdf",
      title: "Psychology Clinic: Health Tips for Long Life",
      subtitle: "Full eBook placeholder — owner will upload the final edition in /admin.",
      body: [
        "Thank you for purchasing this eBook from Akwasuccess.",
        "Chapter 1: Understanding the Mind",
        "Chapter 2: Emotional Wellbeing",
        "Chapter 3: Healthy Lifestyle Habits",
        "Chapter 4: Personal Development",
      ],
      disclaimer: healthDisclaimer,
    },
    {
      outPath: "storage/private/products/secrets-of-genuine-money.pdf",
      title: "The Secrets of Genuine Money",
      subtitle: "Full eBook placeholder — owner will upload the final edition in /admin.",
      body: [
        "Thank you for purchasing this eBook from Akwasuccess.",
        "Chapter 1: The History of Money",
        "Chapter 2: Understanding Money Today",
        "Chapter 3: Money Management & Financial Literacy",
        "Chapter 4: Understanding Wealth & the Future of Money",
      ],
      disclaimer: cryptoDisclaimer,
    },
    {
      outPath: "storage/private/products/cryptocurrency-for-beginners.pdf",
      title: "Cryptocurrency for Beginners",
      subtitle: "Full eBook placeholder — owner will upload the final edition in /admin.",
      body: [
        "Thank you for purchasing this eBook from Akwasuccess.",
        "Chapter 1: What Is Cryptocurrency & Blockchain?",
        "Chapter 2: Wallets & Recovery Phrase Security",
        "Chapter 3: Exchanges, P2P Transactions & Stablecoins",
        "Chapter 4: Fundamental & Technical Analysis Basics",
      ],
      disclaimer: cryptoDisclaimer,
    },
  ];

  for (const s of specs) {
    await createPdf(s);
  }
  console.log(`Generated ${specs.length} placeholder PDFs.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
