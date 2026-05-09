import crypto from "crypto";

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || process.env.JWT_SECRET;
const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

/**
 * Encrypt sensitive data (medical records, personal information)
 * Uses AES-256-GCM authenticated encryption
 */
export const encrypt = (text) => {
  if (!text || text === "") return "";
  
  try {
    const iv = crypto.randomBytes(IV_LENGTH);
    const key = crypto.scryptSync(ENCRYPTION_KEY, "healthyai_salt", 32);
    
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    const encrypted = Buffer.concat([cipher.update(text, "utf8"), cipher.final()]);
    const authTag = cipher.getAuthTag();
    
    // Format: iv:authTag:encryptedData
    return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted.toString("hex")}`;
  } catch (error) {
    console.error("Encryption error:", error);
    return text;
  }
};

/**
 * Decrypt sensitive data
 */
export const decrypt = (encryptedText) => {
  if (!encryptedText || encryptedText === "" || !encryptedText.includes(":")) {
    return encryptedText;
  }
  
  try {
    const [ivHex, authTagHex, encryptedHex] = encryptedText.split(":");
    
    if (!ivHex || !authTagHex || !encryptedHex) {
      return encryptedText;
    }
    
    const iv = Buffer.from(ivHex, "hex");
    const authTag = Buffer.from(authTagHex, "hex");
    const encrypted = Buffer.from(encryptedHex, "hex");
    const key = crypto.scryptSync(ENCRYPTION_KEY, "healthyai_salt", 32);
    
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    
    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
    return decrypted.toString("utf8");
  } catch (error) {
    console.error("Decryption error:", error);
    return encryptedText;
  }
};

/**
 * Hash sensitive data for storage (non-reversible)
 * Use for data that only needs verification (not retrieval)
 */
export const hashData = (data) => {
  return crypto
    .createHmac("sha256", ENCRYPTION_KEY)
    .update(data)
    .digest("hex");
};

/**
 * Verify hash matches data
 */
export const verifyHash = (data, hash) => {
  const computedHash = hashData(data);
  return crypto.timingSafeEqual(Buffer.from(computedHash), Buffer.from(hash));
};

/**
 * Generate secure random token
 */
export const generateSecureToken = (length = 32) => {
  return crypto.randomBytes(length).toString("hex");
};

export default {
  encrypt,
  decrypt,
  hashData,
  verifyHash,
  generateSecureToken,
};
