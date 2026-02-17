import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default-key-change-in-production';
const ALGORITHM = 'aes-256-gcm';

if (ENCRYPTION_KEY.length !== 32) {
  throw new Error('ENCRYPTION_KEY must be exactly 32 characters long');
}

export function encrypt(text: string): string {
  try {
    const iv = crypto.randomBytes(16);
    const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    // Combine iv, authTag, and encrypted data
    return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
  } catch (error) {
    throw new Error('Encryption failed: ' + (error as Error).message);
  }
}

export function decrypt(encryptedText: string): string {
  try {
    const parts = encryptedText.split(':');
    if (parts.length !== 3) {
      throw new Error('Invalid encrypted data format');
    }

    const iv = Buffer.from(parts[0], 'hex');
    const authTag = Buffer.from(parts[1], 'hex');
    const encrypted = parts[2];
    const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    throw new Error('Decryption failed: ' + (error as Error).message);
  }
}

// Hash function for passwords and sensitive data
export function hash(data: string): string {
  return crypto.createHash('sha256').update(data).digest('hex');
}

// Generate random tokens
export function generateToken(length = 32): string {
  return crypto.randomBytes(length).toString('hex');
}

// Generate OTP
export function generateOTP(length = 6): string {
  const digits = '0123456789';
  let otp = '';
  
  for (let i = 0; i < length; i++) {
    otp += digits[Math.floor(Math.random() * digits.length)];
  }
  
  return otp;
}

// Encrypt sensitive fields in database
export function encryptSensitiveData(data: any, fields: string[]): any {
  const result = { ...data };
  
  fields.forEach(field => {
    if (result[field]) {
      result[`${field}Encrypted`] = encrypt(result[field]);
      delete result[field];
    }
  });
  
  return result;
}

// Decrypt sensitive fields from database
export function decryptSensitiveData(data: any, fields: string[]): any {
  const result = { ...data };
  
  fields.forEach(field => {
    const encryptedField = `${field}Encrypted`;
    if (result[encryptedField]) {
      try {
        result[field] = decrypt(result[encryptedField]);
        delete result[encryptedField];
      } catch (error) {
        // If decryption fails, remove the field
        delete result[encryptedField];
      }
    }
  });
  
  return result;
}

// Validate encrypted data format
export function isValidEncryptedFormat(data: string): boolean {
  const parts = data.split(':');
  return parts.length === 3 && parts.every(part => /^[a-f0-9]+$/i.test(part));
}