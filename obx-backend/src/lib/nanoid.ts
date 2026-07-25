/**
 * Minimal nano-id implementation — no dependency needed.
 * ponytail: 10-char alphanumeric IDs are fine for this scale.
 * Ceiling: collision probability rises past ~10M rows; upgrade to crypto.randomUUID() then.
 */
const ALPHABET = "0123456789abcdefghijklmnopqrstuvwxyz";

export function nanoid(size = 12): string {
  const bytes = crypto.getRandomValues(new Uint8Array(size));
  return Array.from(bytes)
    .map((b) => ALPHABET[b % ALPHABET.length])
    .join("");
}
