import { describe, expect, it } from "vitest";
import {
  formatKenyanPhone,
  isValidKenyanPhone,
  maskPhone,
  normalizeKenyanPhone,
} from "@/lib/phone";

describe("Kenyan M-Pesa phone normalization", () => {
  it("normalizes 07xx and 01xx numbers to 254...", () => {
    expect(normalizeKenyanPhone("0712 345 678")).toBe("254712345678");
    expect(normalizeKenyanPhone("0110-123-456")).toBe("254110123456");
    expect(normalizeKenyanPhone("+254 722 000 111")).toBe("254722000111");
    expect(normalizeKenyanPhone("712345678")).toBe("254712345678");
  });

  it("rejects non-Kenyan or malformed phone numbers", () => {
    expect(isValidKenyanPhone("0812345678")).toBe(false);
    expect(isValidKenyanPhone("07123456")).toBe(false);
    expect(isValidKenyanPhone("abc")).toBe(false);
  });

  it("formats and masks normalized numbers cleanly", () => {
    expect(formatKenyanPhone("254712345678")).toBe("0712 345 678");
    expect(maskPhone("254712345678")).toBe("0712 *** 678");
  });
});
