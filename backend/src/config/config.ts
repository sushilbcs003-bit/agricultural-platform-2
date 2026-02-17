import dotenv from 'dotenv';

dotenv.config();

export const config = {
  // Server
  port: parseInt(process.env.PORT || '3001', 10),
  env: process.env.NODE_ENV || 'development',
  
  // Database
  databaseUrl: process.env.DATABASE_URL || 'postgresql://postgres:postgres123@localhost:5432/agricultural_platform',
  
  // Redis
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  
  // JWT
  jwt: {
    secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'your-super-secret-refresh-key-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },
  
  // Encryption
  encryptionKey: process.env.ENCRYPTION_KEY || 'your-32-char-encryption-key-here',
  
  // CORS
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  
  // File uploads
  uploads: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760', 10), // 10MB
    allowedImageTypes: (process.env.ALLOWED_IMAGE_TYPES || 'image/jpeg,image/png,image/webp').split(','),
    uploadToCloud: process.env.UPLOAD_TO_CLOUD === 'true',
  },
  
  // AWS S3
  aws: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION || 'ap-south-1',
    s3Bucket: process.env.AWS_S3_BUCKET,
  },
  
  // External services
  services: {
    twilio: {
      accountSid: process.env.TWILIO_ACCOUNT_SID,
      authToken: process.env.TWILIO_AUTH_TOKEN,
      phoneNumber: process.env.TWILIO_PHONE_NUMBER,
    },
    sendgrid: {
      apiKey: process.env.SENDGRID_API_KEY,
      fromEmail: process.env.SENDGRID_FROM_EMAIL || 'noreply@agricultural-platform.com',
    },
    razorpay: {
      keyId: process.env.RAZORPAY_KEY_ID,
      keySecret: process.env.RAZORPAY_KEY_SECRET,
    },
    aiService: {
      url: process.env.AI_SERVICE_URL || 'http://localhost:5000',
    },
  },
  
  // Rate limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW || '900000', 10), // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
    authMax: parseInt(process.env.AUTH_RATE_LIMIT_MAX || '5', 10),
  },
  
  // Business rules
  business: {
    otpExpiry: parseInt(process.env.OTP_EXPIRY_MINUTES || '10', 10),
    otpLength: parseInt(process.env.OTP_LENGTH || '6', 10),
    maxOtpAttempts: parseInt(process.env.MAX_OTP_ATTEMPTS || '3', 10),
    emailVerificationExpiry: parseInt(process.env.EMAIL_VERIFICATION_EXPIRY_HOURS || '24', 10),
    maxNegotiationRounds: parseInt(process.env.MAX_NEGOTIATION_ROUNDS || '2', 10),
    bidExpiryHours: parseInt(process.env.BID_EXPIRY_HOURS || '24', 10),
  },
  
  // Features
  features: {
    enableWebsockets: process.env.ENABLE_WEBSOCKETS === 'true',
    enableGraphQL: process.env.ENABLE_GRAPHQL !== 'false',
    mockSms: process.env.MOCK_SMS === 'true',
    mockEmail: process.env.MOCK_EMAIL === 'true',
    mockPayment: process.env.MOCK_PAYMENT === 'true',
  },
  
  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: process.env.LOG_FORMAT || 'json',
  },
};

// Validate required configuration
export function validateConfig() {
  const required = [
    'JWT_SECRET',
    'JWT_REFRESH_SECRET',
    'ENCRYPTION_KEY',
    'DATABASE_URL',
  ];
  
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
  
  if (config.encryptionKey.length !== 32) {
    throw new Error('ENCRYPTION_KEY must be exactly 32 characters long');
  }
}

// Validate configuration on import
if (process.env.NODE_ENV !== 'test') {
  validateConfig();
}