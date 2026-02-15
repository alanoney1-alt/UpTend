/**
 * Simple AES-256 encryption for integration credentials
 */
import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";

function getKey(): Buffer {
  const key = process.env.INTEGRATION_ENCRYPTION_KEY;
  if (!key) {
    // In dev mode, use a deterministic key (NOT for production)
    return crypto.createHash("sha256").update("dev-integration-key").digest();
  }
  return crypto.createHash("sha256").update(key).digest();
}

export function encryptCredentials(data: Record<string, any>): string {
  const key = getKey();
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(JSON.stringify(data), "utf8", "hex");
  encrypted += cipher.final("hex");
  const authTag = cipher.getAuthTag().toString("hex");
  return `${iv.toString("hex")}:${authTag}:${encrypted}`;
}

export function decryptCredentials(encrypted: string): Record<string, any> {
  const key = getKey();
  const [ivHex, authTagHex, data] = encrypted.split(":");
  if (!ivHex || !authTagHex || !data) {
    throw new Error("Invalid encrypted credential format");
  }
  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(authTagHex, "hex");
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  let decrypted = decipher.update(data, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return JSON.parse(decrypted);
}
