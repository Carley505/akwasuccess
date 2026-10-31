/**
 * Kenyan mobile number helpers for M-Pesa.
 * Accepts 07xxxxxxxx, 01xxxxxxxx, 7xxxxxxxx, 1xxxxxxxx, 2547xxxxxxxx,
 * 2541xxxxxxxx and +254... (spaces/dashes ignored). Normalises to 2547xxxxxxxx
 * or 2541xxxxxxxx, the format Daraja expects.
 */
export function normalizeKenyanPhone(input: string): string | null {
  const digits = input.replace(/[\s\-().]/g, "").replace(/^\+/, "");
  if (!/^\d+$/.test(digits)) return null;

  let local: string | null = null;
  if (/^254[17]\d{8}$/.test(digits)) local = digits.slice(3);
  else if (/^0[17]\d{8}$/.test(digits)) local = digits.slice(1);
  else if (/^[17]\d{8}$/.test(digits)) local = digits;

  return local ? `254${local}` : null;
}

export function isValidKenyanPhone(input: string) {
  return normalizeKenyanPhone(input) !== null;
}

/** 254712345678 -> 0712 345 678 (for display). */
export function formatKenyanPhone(normalized: string) {
  const local = `0${normalized.slice(3)}`;
  return `${local.slice(0, 4)} ${local.slice(4, 7)} ${local.slice(7)}`;
}

/** 254712345678 -> 0712 *** 678 (for receipts and logs). */
export function maskPhone(normalized: string) {
  const local = `0${normalized.slice(3)}`;
  return `${local.slice(0, 4)} *** ${local.slice(7)}`;
}
