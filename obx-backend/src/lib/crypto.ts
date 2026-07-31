export async function encryptKey(plainText: string, hexSecret: string): Promise<string> {
  if (!plainText) return "";
  const key = await importKey(hexSecret);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(plainText);

  const cipherText = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    encoded
  );

  const ivHex = Array.from(iv).map((b) => b.toString(16).padStart(2, "0")).join("");
  const cipherHex = Array.from(new Uint8Array(cipherText)).map((b) => b.toString(16).padStart(2, "0")).join("");

  return `${ivHex}:${cipherHex}`;
}

export async function decryptKey(encryptedText: string, hexSecret: string): Promise<string> {
  if (!encryptedText) return "";
  const parts = encryptedText.split(":");
  if (parts.length !== 2) throw new Error("Invalid encrypted format");

  const [ivHex, cipherHex] = parts;
  const iv = new Uint8Array(ivHex.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16)));
  const cipherBytes = new Uint8Array(cipherHex.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16)));

  const key = await importKey(hexSecret);
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    cipherBytes
  );

  return new TextDecoder().decode(decrypted);
}

async function importKey(hexSecret: string): Promise<CryptoKey> {
  // Pad or truncate to 32 bytes (256 bits) for AES-256
  const secretBytes = new TextEncoder().encode(hexSecret);
  const keyBuffer = new Uint8Array(32);
  keyBuffer.set(secretBytes.slice(0, 32));

  return crypto.subtle.importKey(
    "raw",
    keyBuffer,
    { name: "AES-GCM" },
    false,
    ["encrypt", "decrypt"]
  );
}
