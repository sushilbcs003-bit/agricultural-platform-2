import { PrismaClient } from '@prisma/client';
import { ApiError } from '../utils/apiError';
import { encrypt, decrypt } from '../utils/encryption';

const prisma = new PrismaClient();

export class PaymentProfileService {
  // Get payment profile for user
  async getPaymentProfile(userId: string, role: string) {
    try {
      const profile = await prisma.paymentProfile.findUnique({
        where: { userId },
      });

      if (!profile) {
        return null;
      }

      // Decrypt account number if present
      const decrypted: any = { ...profile };
      if (profile.accountNumberEnc) {
        try {
          const encryptedText = profile.accountNumberEnc.toString('utf8');
          decrypted.accountNumber = decrypt(encryptedText);
        } catch (error) {
          console.error('Failed to decrypt account number:', error);
        }
      }

      // Mask sensitive data for display
      return this.maskPaymentProfile(decrypted, role);
    } catch (error) {
      throw new ApiError(500, 'Failed to fetch payment profile');
    }
  }

  // Create or update payment profile
  async upsertPaymentProfile(
    userId: string,
    role: string,
    data: {
      bankName?: string;
      accountHolderName?: string;
      accountNumber?: string;
      ifscCode?: string;
      upiId?: string;
      paytmId?: string;
      bharatpeId?: string;
      googlePayId?: string;
      applePayId?: string;
      preferredPayoutMethod?: string;
    }
  ) {
    try {
      // Validate based on role requirements
      this.validatePaymentProfile(data, role);

      // Encrypt account number if provided
      let accountNumberEnc: Buffer | null = null;
      if (data.accountNumber) {
        const encrypted = encrypt(data.accountNumber);
        accountNumberEnc = Buffer.from(encrypted, 'utf8');
      }

      // Validate IFSC if provided
      if (data.ifscCode && !this.validateIFSC(data.ifscCode)) {
        throw new ApiError(400, 'Invalid IFSC code format');
      }

      // Validate UPI ID if provided
      if (data.upiId && !this.validateUPI(data.upiId)) {
        throw new ApiError(400, 'Invalid UPI ID format');
      }

      // Check for duplicate payment IDs
      await this.checkDuplicatePaymentIds(userId, data);

      // Upsert payment profile
      const profile = await prisma.paymentProfile.upsert({
        where: { userId },
        create: {
          userId,
          bankName: data.bankName,
          accountHolderName: data.accountHolderName,
          accountNumberEnc,
          ifscCode: data.ifscCode,
          upiId: data.upiId,
          paytmId: data.paytmId,
          bharatpeId: data.bharatpeId,
          googlePayId: data.googlePayId,
          applePayId: data.applePayId,
          preferredPayoutMethod: data.preferredPayoutMethod as any,
        },
        update: {
          bankName: data.bankName,
          accountHolderName: data.accountHolderName,
          accountNumberEnc,
          ifscCode: data.ifscCode,
          upiId: data.upiId,
          paytmId: data.paytmId,
          bharatpeId: data.bharatpeId,
          googlePayId: data.googlePayId,
          applePayId: data.applePayId,
          preferredPayoutMethod: data.preferredPayoutMethod as any,
        },
      });

      // Create audit entry
      await this.createAuditEntry(userId, userId, profile);

      return this.maskPaymentProfile(profile, role);
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(500, 'Failed to save payment profile');
    }
  }

  // Validate payment profile based on role
  private validatePaymentProfile(data: any, role: string) {
    const hasBankAccount = !!(data.accountNumber && data.ifscCode);
    const hasUPI = !!data.upiId;
    const hasWallet = !!(data.paytmId || data.bharatpeId || data.googlePayId || data.applePayId);
    const hasAnyMethod = hasBankAccount || hasUPI || hasWallet;

    // Farmers and Suppliers must have at least one payment method
    if ((role === 'FARMER' || role === 'SUPPLIER') && !hasAnyMethod) {
      throw new ApiError(400, 'At least one payment method is required for farmers and suppliers');
    }

    // Buyers can have optional payment methods
    // No validation needed for buyers
  }

  // Validate IFSC code format
  private validateIFSC(ifsc: string): boolean {
    // IFSC format: 4 letters + 0 + 6 digits
    const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
    return ifscRegex.test(ifsc.toUpperCase());
  }

  // Validate UPI ID format
  private validateUPI(upiId: string): boolean {
    // UPI format: identifier@provider
    const upiRegex = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/;
    return upiRegex.test(upiId);
  }

  // Check for duplicate payment IDs
  private async checkDuplicatePaymentIds(userId: string, data: any) {
    const paymentIds = [
      { field: 'upiId', value: data.upiId },
      { field: 'paytmId', value: data.paytmId },
      { field: 'bharatpeId', value: data.bharatpeId },
      { field: 'googlePayId', value: data.googlePayId },
      { field: 'applePayId', value: data.applePayId },
    ].filter(item => item.value);

    for (const { field, value } of paymentIds) {
      const existing = await prisma.paymentProfile.findFirst({
        where: {
          [field]: value,
          userId: { not: userId },
        },
      });

      if (existing) {
        throw new ApiError(400, `${field} is already registered to another user`);
      }
    }
  }

  // Mask payment profile for display
  private maskPaymentProfile(profile: any, role: string) {
    const masked = { ...profile };

    // Mask account number (show last 4 digits)
    if (masked.accountNumber) {
      const accountNumber = masked.accountNumber;
      masked.accountNumber = accountNumber.length > 4
        ? '****' + accountNumber.slice(-4)
        : '****';
      delete masked.accountNumberEnc; // Never expose encrypted value
    }

    // For admin, mask all payment IDs
    if (role === 'ADMIN') {
      if (masked.upiId) masked.upiId = masked.upiId.replace(/(.{2}).*(@.+)/, '$1****$2');
      if (masked.paytmId) masked.paytmId = '****' + masked.paytmId.slice(-4);
      if (masked.bharatpeId) masked.bharatpeId = '****' + masked.bharatpeId.slice(-4);
      if (masked.googlePayId) masked.googlePayId = '****' + masked.googlePayId.slice(-4);
      if (masked.applePayId) masked.applePayId = '****' + masked.applePayId.slice(-4);
    }

    return masked;
  }

  // Create audit entry
  private async createAuditEntry(userId: string, changedByUserId: string, newProfile: any) {
    try {
      // Get old profile for comparison
      const oldProfile = await prisma.paymentProfile.findUnique({
        where: { userId },
      });

      if (oldProfile) {
        await prisma.paymentProfileAudit.create({
          data: {
            userId,
            changedByUserId,
            oldValueJson: oldProfile as any,
            newValueJson: newProfile as any,
          },
        });
      }
    } catch (error) {
      console.error('Failed to create audit entry:', error);
      // Don't throw - audit is non-critical
    }
  }
}

export const paymentProfileService = new PaymentProfileService();
