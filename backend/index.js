// Initialize OpenTelemetry BEFORE any other imports (optional - disabled for now)
// TODO: Fix Resource import issue in tracing.js
// try {
//   require('./src/tracing');
// } catch (error) {
//   console.warn('⚠️  OpenTelemetry tracing not available, continuing without tracing');
// }

const crypto = require('crypto');
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const logger = require('./utils/logger');
const { PrismaClient } = require('@prisma/client');

// Initialize Prisma Client
const prisma = new PrismaClient();

// Tracing middleware (optional - disabled for now)
const tracingMiddleware = (req, res, next) => next(); // No-op middleware

const app = express();

// ============================================
// API VERSIONING HELPER
// ============================================
// Helper function to register routes at both /api/* and /api/v1/* for backward compatibility
// Usage: registerVersionedRoute('get', '/users', handler1, handler2, ...)
const registerVersionedRoute = (method, path, ...handlers) => {
  // Register at /api/v1/* (primary versioned route)
  app[method](`/api/v1${path}`, ...handlers);
  // Also register at /api/* for backward compatibility (temporary during migration)
  app[method](`/api${path}`, ...handlers);
};

// Middleware
app.use(cors());
app.use(express.json());

// OpenTelemetry tracing middleware (must be before routes)
app.use(tracingMiddleware);

// ============================================
// RATE LIMITING
// ============================================
// OTP Request Rate Limiter - 5 requests per 15 minutes
const otpRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: {
    success: false,
    error: {
      message: 'Too many OTP requests. Please try again after 15 minutes.'
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => process.env.NODE_ENV !== 'production' || req.path === '/health' || req.path === '/api/health'
});

// Registration Rate Limiter
const registrationRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  message: {
    success: false,
    error: {
      message: 'Too many registration attempts. Please try again after 1 hour.'
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => process.env.NODE_ENV !== 'production'
});

// Login Rate Limiter - 10 requests per 15 minutes
const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: {
    success: false,
    error: {
      message: 'Too many login attempts. Please try again after 15 minutes.'
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => process.env.NODE_ENV !== 'production'
});

// General API Rate Limiter
const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: {
    success: false,
    error: {
      message: 'Too many requests. Please slow down.'
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => process.env.NODE_ENV !== 'production' || req.path === '/health' || req.path === '/api/health'
});

// Apply general API rate limiting to all routes
app.use('/api', apiRateLimiter);

// OTP storage (temporary/caching only - acceptable for OTP)
const otps = [];

// REMOVED: All other in-memory arrays (users, products, lands, bids, offers, etc.)
// All data now comes from database via Prisma - no in-memory persistence

// Initialize test data
const initializeTestData = () => {
  // Test Farmers
  const testFarmer = {
    id: 'farmer_test_001',
    role: 'FARMER',
    name: 'Ravi Kumar',
    phone: '+919876543210',
    email: 'ravi@farmer.com',
    phoneVerified: true,
    emailVerified: true,
    farmerProfile: {
      aadhaar: '123456789012',
      village: 'Rampur',
      district: 'Meerut',
      state: 'Uttar Pradesh',
      locations: [
        { village: 'Rampur', district: 'Meerut', state: 'Uttar Pradesh' },
        { village: 'Baraut', district: 'Baghpat', state: 'Uttar Pradesh' }
      ],
      stateCode: 'UP',
      selectedProducts: {
        CROPS: [0, 1],
        VEGETABLES: [0, 1, 2]
      },
      customProducts: [],
      landDetails: {
        area: 5.5,
        unit: 'HECTARE',
        mainRoadConnectivity: true,
        irrigationSource: 'canal',
        ownershipType: 'owned'
      },
      about: 'Organic farming specialist with 10+ years experience',
      rating: 4.5,
      totalRatings: 23,
      profileStatus: 'AVAILABLE_FOR_BID'
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const testBuyer = {
    id: 'buyer_test_001',
    role: 'BUYER',
    name: 'Krishna Traders',
    email: 'krishna@traders.com',
    phone: '+919876543211',
    passwordHash: null,
    emailVerified: true,
    phoneVerified: false,
    buyerProfile: {
      gst: '09AAACH7409R1ZZ',
      businessName: 'Krishna Traders',
      businessType: 'Wholesale Trading',
      businessAddress: 'Market Road, Azadpur Mandi, Delhi',
      district: 'New Delhi',
      state: 'Delhi',
      stateCode: 'DL',
      pincode: '110033',
      contactPerson: 'Krishna Sharma',
      rating: 4.2,
      totalRatings: 15,
      selectedFarmers: ['farmer_test_001'],
      cart: []
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  // Add registered users (persist across restarts)
  const registeredFarmer = {
    id: 'farmer_sushil_001',
    role: 'FARMER',
    name: 'Sushil Yadav',
    phone: '+919560812266',
    email: null,
    phoneVerified: true,
    emailVerified: false,
    farmerProfile: {
      aadhaar: '123456789012', // Placeholder - update with actual if needed
      village: 'Saraighasi',
      tehsil: null,
      district: 'Bulandshahr',
      state: 'Uttar Pradesh',
      stateCode: 'UP',
      locations: [
        { village: 'Saraighasi', district: 'Bulandshahr', state: 'Uttar Pradesh' }
      ],
      selectedProducts: {},
      customProducts: [],
      landDetails: {
        area: 30,
        unit: 'BIGHA',
        mainRoadConnectivity: false,
        irrigationSource: null,
        ownershipType: 'owned'
      },
      about: null,
      rating: null,
      totalRatings: 0,
      profileStatus: 'AVAILABLE_FOR_BID'
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const registeredBuyer = {
    id: 'buyer_rahul_001',
    role: 'BUYER',
    name: 'Rahul Yadav',
    email: null,
    phone: '+919768776656',
    phoneVerified: true,
    emailVerified: false,
    buyerProfile: {
      gst: '09AAACH7409R1ZR',
      businessName: 'Rahul Yadav',
      businessType: null,
      businessAddress: null,
      district: null,
      state: null,
      stateCode: null,
      pincode: null,
      contactPerson: 'Rahul Yadav',
      rating: null,
      totalRatings: 0,
      selectedFarmers: [],
      cart: []
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  users.push(testFarmer, testBuyer);

  // Test Products
  const testProducts = [
    {
      id: 'prod_001',
      farmerId: 'farmer_test_001',
      name: 'Organic Wheat',
      nameHi: 'जैविक गेहूं',
      category: 'CROPS',
      quantity: 100,
      unit: 'quintal',
      expectedPrice: 2500,
      finalPrice: null,
      status: 'AVAILABLE_FOR_BID',
      availableForBrowse: true,
      harvestDate: '2024-03-15',
      images: ['wheat1.jpg', 'wheat2.jpg'],
      description: 'Premium quality organic wheat',
      createdAt: new Date().toISOString()
    },
    {
      id: 'prod_002',
      farmerId: 'farmer_test_001',
      name: 'Fresh Tomatoes',
      nameHi: 'ताजा टमाटर',
      category: 'VEGETABLES',
      quantity: 500,
      unit: 'kg',
      expectedPrice: 30,
      finalPrice: null,
      status: 'UNDER_BID',
      availableForBrowse: true,
      harvestDate: '2024-03-20',
      images: ['tomato1.jpg'],
      description: 'Fresh red tomatoes',
      createdAt: new Date().toISOString()
    }
  ];

  products.push(...testProducts);

  // Test Offers
  const testOffers = [
    {
      id: 'offer_001',
      farmerId: 'farmer_test_001',
      productId: 'prod_002',
      buyerId: 'buyer_test_001',
      buyerName: 'Krishna Traders',
      productName: 'Fresh Tomatoes',
      offeredPrice: 32,
      quantity: 300,
      message: 'Interested in bulk purchase for premium quality tomatoes',
      status: 'PENDING',
      negotiationRound: 1,
      maxNegotiations: 2,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    }
  ];

  offers.push(...testOffers);

  // Test Machinery
  const testMachinery = [
    {
      id: 'mach_001',
      providerId: 'provider_001',
      providerName: 'AgriTech Solutions',
      name: 'Tractor - Mahindra 575 DI',
      nameHi: 'ट्रैक्टर - महिंद्रा 575 DI',
      category: 'TRACTOR',
      rentPerDay: 1500,
      specifications: 'HP: 47, Fuel Type: Diesel, 4WD Available',
      images: ['tractor1.jpg'],
      location: 'Meerut, UP',
      available: true,
      rating: 4.3
    },
    {
      id: 'mach_002',
      providerId: 'provider_001',
      providerName: 'AgriTech Solutions',
      name: 'Harvester - John Deere',
      nameHi: 'हार्वेस्टर - जॉन डियर',
      category: 'HARVESTER',
      rentPerDay: 3000,
      specifications: 'Cutting Width: 3.6m, Engine: 140HP',
      images: ['harvester1.jpg'],
      location: 'Meerut, UP',
      available: true,
      rating: 4.7
    }
  ];

  machinery.push(...testMachinery);

  // Test Transport
  const testTransport = [
    {
      id: 'trans_001',
      providerId: 'provider_002',
      providerName: 'Logistics Pro',
      vehicleType: 'Truck',
      vehicleTypeHi: 'ट्रक',
      capacity: '10 Tons',
      pricePerKm: 25,
      driverName: 'Suresh Singh',
      driverPhone: '+919876543212',
      location: 'Meerut, UP',
      available: true,
      rating: 4.1
    },
    {
      id: 'trans_002',
      providerId: 'provider_003',
      providerName: 'Fast Transport',
      vehicleType: 'Mini Truck',
      vehicleTypeHi: 'छोटा ट्रक',
      capacity: '3 Tons',
      pricePerKm: 18,
      driverName: 'Rajesh Kumar',
      driverPhone: '+919876543213',
      location: 'Delhi, DL',
      available: true,
      rating: 4.4
    }
  ];

  transport.push(...testTransport);

  // Test Providers
  const testTestProviders = [
    {
      id: 'test_prov_001',
      name: 'AgriQuality Labs',
      nameHi: 'एग्रीक्वालिटी लैब्स',
      location: 'Meerut, UP',
      services: ['Soil Testing', 'Grain Quality', 'Pesticide Residue'],
      pricePerTest: 500,
      rating: 4.6,
      available: true
    },
    {
      id: 'test_prov_002',
      name: 'Farm Test Center',
      nameHi: 'फार्म टेस्ट सेंटर',
      location: 'Delhi, DL',
      services: ['Quality Analysis', 'Nutritional Testing'],
      pricePerTest: 750,
      rating: 4.2,
      available: true
    }
  ];

  testProviders.push(...testTestProviders);

  // Test Orders
  const testOrders = [
    {
      id: 'order_001',
      farmerId: 'farmer_test_001',
      buyerId: 'buyer_test_001',
      productId: 'prod_001',
      productName: 'Organic Wheat',
      quantity: 50,
      agreedPrice: 2600,
      totalAmount: 130000,
      status: 'COMPLETED',
      paymentStatus: 'PAID',
      testProvider: 'AgriQuality Labs',
      transportProvider: 'Logistics Pro',
      deliveryDate: '2024-02-15',
      createdAt: '2024-01-15T10:00:00.000Z',
      completedAt: '2024-02-15T14:30:00.000Z'
    }
  ];

  orders.push(...testOrders);

  // Test Results
  const testTestResults = [
    {
      id: 'result_001',
      productId: 'prod_001',
      farmerId: 'farmer_test_001',
      testProviderId: 'test_prov_001',
      overallGrade: 'A+',
      qualityScore: 94,
      moistureContent: 12.5,
      proteinContent: 11.8,
      defects: { broken: 2, foreign: 0.5 },
      recommendations: [
        'Excellent quality wheat suitable for premium markets',
        'Recommended price: ₹2600-2800 per quintal',
        'Storage in moisture-controlled environment advised'
      ],
      images: ['test_wheat1.jpg', 'test_wheat2.jpg'],
      priceRecommendation: { min: 2600, max: 2800, suggested: 2700 },
      confidence: 96,
      testDate: '2024-01-20T09:00:00.000Z',
      createdAt: '2024-01-20T15:00:00.000Z'
    }
  ];

  testResults.push(...testTestResults);

  // Test Suppliers
  const testSuppliers = [
    {
      id: 'supplier_test_001',
      role: 'SUPPLIER',
      name: 'Agri Supplies Co.',
      phone: '+919876543214',
      email: 'sales@agrisupplies.com',
      gst: '09SUPPLIER001Z1',
      address: 'Industrial Area, Meerut',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];

  suppliers.push(...testSuppliers);

  logger.info('✅ Test data initialized successfully');
};

// Initialize test data on startup - DISABLED for clean testing
// initializeTestData();

// Clear OTP array on startup (only in-memory array remaining - used for temporary OTP caching)
otps.length = 0;
logger.info('🧹 All in-memory arrays cleared for clean testing - using Prisma/database only');

// Graceful shutdown for Prisma
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

// Master data (keeping existing structure)
const INDIAN_STATES = [
  { value: 'UP', label: 'Uttar Pradesh', hindi: 'उत्तर प्रदेश' },
  { value: 'MH', label: 'Maharashtra', hindi: 'महाराष्ट्र' },
  { value: 'DL', label: 'Delhi', hindi: 'दिल्ली' },
  { value: 'PB', label: 'Punjab', hindi: 'पंजाब' },
  { value: 'HR', label: 'Haryana', hindi: 'हरियाणा' },
  { value: 'RJ', label: 'Rajasthan', hindi: 'राजस्थान' },
  { value: 'MP', label: 'Madhya Pradesh', hindi: 'मध्य प्रदेश' },
  { value: 'GJ', label: 'Gujarat', hindi: 'गुजरात' },
  { value: 'BR', label: 'Bihar', hindi: 'बिहार' },
  { value: 'WB', label: 'West Bengal', hindi: 'पश्चिम बंगाल' },
  { value: 'TN', label: 'Tamil Nadu', hindi: 'तमिलनाडु' },
  { value: 'KA', label: 'Karnataka', hindi: 'कर्नाटक' },
  { value: 'KL', label: 'Kerala', hindi: 'केरल' },
  { value: 'AP', label: 'Andhra Pradesh', hindi: 'आंध्र प्रदेश' },
  { value: 'TS', label: 'Telangana', hindi: 'तेलंगाना' },
  { value: 'OR', label: 'Odisha', hindi: 'ओडिशा' },
  { value: 'JH', label: 'Jharkhand', hindi: 'झारखंड' },
  { value: 'CH', label: 'Chhattisgarh', hindi: 'छत्तीसगढ़' },
  { value: 'HP', label: 'Himachal Pradesh', hindi: 'हिमाचल प्रदेश' },
  { value: 'UK', label: 'Uttarakhand', hindi: 'उत्तराखंड' },
  { value: 'AS', label: 'Assam', hindi: 'असम' },
  { value: 'TR', label: 'Tripura', hindi: 'त्रिपुरा' },
  { value: 'GA', label: 'Goa', hindi: 'गोवा' }
];

const PRODUCT_CATEGORIES = {
  CROPS: {
    nameEn: 'Crops',
    nameHi: 'फसलें',
    products: [
      { nameEn: 'Wheat', nameHi: 'गेहूं' },
      { nameEn: 'Rice', nameHi: 'चावल' },
      { nameEn: 'Maize', nameHi: 'मक्का' }
    ]
  },
  VEGETABLES: {
    nameEn: 'Vegetables',
    nameHi: 'सब्ज़ियां',
    products: [
      { nameEn: 'Tomato', nameHi: 'टमाटर' },
      { nameEn: 'Onion', nameHi: 'प्याज' },
      { nameEn: 'Potato', nameHi: 'आलू' }
    ]
  }
};

const sanitizeLocation = (location = {}) => ({
  village: location.village?.toString().trim(),
  district: location.district?.toString().trim(),
  state: location.state?.toString().trim()
});

const validateLocation = (location = {}) =>
  Boolean(location.village && location.district && location.state);

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    message: 'Agricultural Platform API v3.0 with Enhanced Farmer Portal! 🌱',
    version: '3.0.0',
    features: [
      'Complete Farmer Portal',
      'Product Management',
      'Offers & Bidding System',
      'Machinery & Transport Booking',
      'Quality Testing Integration',
      'Payment & Order Management'
    ]
  });
});

// Get master data - versioned endpoint
const handleGetMasterData = (req, res) => {
  res.json({
    success: true,
    data: {
      states: INDIAN_STATES,
      productCategories: PRODUCT_CATEGORIES,
      irrigationSources: [
        { value: 'TUBE_WELL', label: 'Tube Well', hindi: 'ट्यूबवेल' },
        { value: 'CANAL', label: 'Canal', hindi: 'नहर' },
        { value: 'RAINWATER', label: 'Rainwater', hindi: 'वर्षा आधारित' },
        { value: 'RIVER', label: 'River', hindi: 'नदी' },
        { value: 'POND', label: 'Pond', hindi: 'तालाब' },
        { value: 'OTHER', label: 'Other', hindi: 'अन्य' }
      ],
      ownershipTypes: [
        { value: 'OWNED', label: 'Owned', hindi: 'स्वामित्व' },
        { value: 'LEASED', label: 'Leased', hindi: 'पट्टा' },
        { value: 'SHARED', label: 'Shared', hindi: 'साझा' }
      ],
      landUnits: [
        { value: 'ACRE', label: 'Acre', hindi: 'एकड़' },
        { value: 'HECTARE', label: 'Hectare', hindi: 'हेक्टेयर' },
        { value: 'BIGHA', label: 'Bigha', hindi: 'बीघा' },
        { value: 'KATHA', label: 'Katha', hindi: 'कठा' },
        { value: 'GUNTHA', label: 'Guntha', hindi: 'गुंठा' }
      ]
    }
  });
};

// Register master data endpoint at both /api/v1/* and /api/*
registerVersionedRoute('get', '/master-data', handleGetMasterData);

// Auth endpoints - versioned endpoints
const handleCheckPhone = async (req, res) => {
  try {
    const { phone } = req.body;
    const normalizedPhone = normalizePhone(phone);
    const phoneRegex = /^\+91[6-9]\d{9}$/;
    
    if (!normalizedPhone || !phoneRegex.test(normalizedPhone)) {
      return res.status(400).json({
        success: false,
        error: { message: 'Invalid Indian phone number format' }
      });
    }
    
    // Check database
    const existingUser = await prisma.user.findUnique({
      where: { phone: normalizedPhone }
    });
    
    res.json({
      success: true,
      exists: !!existingUser,
      phone: normalizedPhone
    });
  } catch (error) {
    logger.error('Error checking phone:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to check phone number. Please try again.' }
    });
  }
};

const handleRequestOTP = async (req, res) => {
  try {
    const { phone, purpose = 'LOGIN' } = req.body;
    const normalizedPhone = normalizePhone(phone);
    const phoneRegex = /^\+91[6-9]\d{9}$/;
    
    if (!normalizedPhone || !phoneRegex.test(normalizedPhone)) {
      return res.status(400).json({
        success: false,
        error: { message: 'Invalid Indian phone number format. Use +91 followed by 10 digits starting with 6-9.' }
      });
    }
    
    // Validate purpose
    const validPurposes = ['LOGIN', 'REGISTRATION'];
    const normalizedPurpose = (purpose && String(purpose).toUpperCase()) || 'LOGIN';
    if (!validPurposes.includes(normalizedPurpose)) {
      return res.status(400).json({
        success: false,
        error: { message: 'Invalid purpose. Must be LOGIN or REGISTRATION' }
      });
    }
    
    // Check if phone exists (raw SQL to avoid Prisma schema/DB column mismatch)
    let phoneExists = false;
    try {
      const rows = await prisma.$queryRawUnsafe(
        'SELECT 1 FROM users WHERE phone = $1 LIMIT 1',
        normalizedPhone
      );
      phoneExists = Array.isArray(rows) && rows.length > 0;
    } catch (dbErr) {
      logger.error('handleRequestOTP: DB lookup failed', dbErr?.message);
      return res.status(503).json({
        success: false,
        error: { message: 'Service temporarily unavailable. Please try again.' }
      });
    }

    if (normalizedPurpose === 'REGISTRATION') {
      if (phoneExists) {
        return res.status(409).json({
          success: false,
          error: {
            message: 'Phone number already registered. Please login to check your account.',
            messageHi: 'फ़ोन नंबर पहले से पंजीकृत है। कृपया अपने खाते की जांच के लिए लॉगिन करें।'
          }
        });
      }
    } else if (normalizedPurpose === 'LOGIN') {
      if (!phoneExists) {
        return res.status(404).json({
          success: false,
          error: {
            message: 'Phone number not registered. Please register first.',
            messageHi: 'फ़ोन नंबर पंजीकृत नहीं है। कृपया पहले पंजीकरण करें।'
          }
        });
      }
    }
    
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
    // Normalize purpose to lowercase for consistency
    const dbPurpose = normalizedPurpose === 'REGISTRATION' ? 'registration' : 'login';
    const otpEntry = {
      phone: normalizedPhone,
      otp,
      purpose: dbPurpose,
      verified: false,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      createdAt: new Date()
    };
    
    const otpIndex = otps.findIndex(o => normalizePhone(o.phone) === normalizedPhone);
    if (otpIndex !== -1) {
      otps.splice(otpIndex, 1);
    }
    
    otps.push(otpEntry);
    logger.debug(`📱 OTP for ${normalizedPhone}: ${otp}`);
    
    res.json({
      success: true,
      message: 'OTP sent successfully',
      phone: normalizedPhone,
      otp
    });
  } catch (error) {
    logger.error('Error requesting OTP:', error);
    const msg = error?.message || 'Failed to send OTP. Please try again.';
    res.status(500).json({
      success: false,
      error: { message: msg }
    });
  }
};

const handleVerifyOTP = async (req, res) => {
  try {
    const { phone, otp, purpose } = req.body;
    const normalizedPhone = normalizePhone(phone);
    const otpBypassEnabled = process.env.OTP_BYPASS === 'true';
    
    // Normalize OTP to string for comparison
    const normalizedOtp = String(otp).trim();

    // Log for debugging
    logger.debug(`🔍 Verifying OTP: phone=${normalizedPhone}, otp=${normalizedOtp}, purpose=${purpose}`);
    logger.debug(`📋 Total OTPs in memory: ${otps.length}`);

    if (!otpBypassEnabled) {
      // Check in-memory OTPs (idempotent verification allowed)
      const otpEntry = otps.find(o => {
        const phoneMatch = normalizePhone(o.phone) === normalizedPhone;
        const otpMatch = String(o.otp).trim() === normalizedOtp;
        const notExpired = o.expiresAt > new Date();

        logger.debug(`  Checking OTP entry: phoneMatch=${phoneMatch}, otpMatch=${otpMatch}, verified=${o.verified}, notExpired=${notExpired}, expiresAt=${o.expiresAt}, now=${new Date()}`);

        return phoneMatch && otpMatch && notExpired;
      });

      if (!otpEntry) {
        // Provide more detailed error message
        const matchingPhone = otps.find(o => normalizePhone(o.phone) === normalizedPhone);
        if (matchingPhone) {
          if (matchingPhone.expiresAt <= new Date()) {
            logger.debug(`❌ OTP expired. ExpiresAt: ${matchingPhone.expiresAt}, Now: ${new Date()}`);
            return res.status(400).json({
              success: false,
              error: { message: 'OTP has expired. Please request a new OTP.' }
            });
          }
          logger.debug(`❌ OTP mismatch. Expected: ${matchingPhone.otp}, Received: ${normalizedOtp}`);
        } else {
          logger.debug(`❌ No OTP found for phone: ${normalizedPhone}`);
        }

        return res.status(400).json({
          success: false,
          error: { message: 'Invalid or expired OTP. Please request a new OTP.' }
        });
      }

      if (!otpEntry.verified) {
        otpEntry.verified = true;
      }
    } else {
      logger.warn(`⚠️ OTP bypass enabled - skipping OTP verification for ${normalizedPhone}`);
    }
    
    // Check database for existing user
    let existingUser = null;
    if (otpBypassEnabled) {
      try {
        existingUser = await prisma.user.findUnique({
          where: { phone: normalizedPhone }
        });
      } catch (error) {
        logger.warn(`⚠️ OTP bypass fallback: user lookup failed for ${normalizedPhone}`);
      }
    } else {
      existingUser = await prisma.user.findUnique({
        where: { phone: normalizedPhone },
        include: {
          farmerProfile: true,
          buyerProfile: true,
          supplierProfile: true
        }
      });
    }
    
    if (existingUser) {
      // User exists - this is a LOGIN
      if (otpBypassEnabled) {
        return res.json({
          success: true,
          user: {
            id: existingUser.id,
            role: existingUser.role,
            phone: existingUser.phone,
            email: existingUser.email || null
          },
          token: `jwt_token_${existingUser.id}`,
          message: 'Login successful!'
        });
      }

      return res.json({
        success: true,
        user: {
          id: existingUser.id,
          role: existingUser.role,
          name: existingUser.name,
          phone: existingUser.phone,
          email: existingUser.email,
          phoneVerified: existingUser.phoneVerified,
          emailVerified: existingUser.emailVerified,
          dateOfBirth: existingUser.dateOfBirth,
          farmerProfile: existingUser.farmerProfile,
          buyerProfile: existingUser.buyerProfile,
          supplierProfile: existingUser.supplierProfile,
          createdAt: existingUser.createdAt,
          updatedAt: existingUser.updatedAt
        },
        token: `jwt_token_${existingUser.id}`,
        message: 'Login successful!'
      });
    }

    if (otpBypassEnabled) {
      return res.json({
        success: true,
        user: {
          id: `dev_${normalizedPhone}`,
          role: 'FARMER',
          phone: normalizedPhone,
          email: null
        },
        token: `jwt_token_dev_${normalizedPhone}`,
        message: 'Login successful!'
      });
    }
    
    // User doesn't exist - check purpose
    // If purpose is REGISTRATION, return newUser: true
    // If purpose is LOGIN, this is an error
    const normalizedPurpose = purpose ? purpose.toUpperCase() : 'LOGIN';
    if (normalizedPurpose === 'REGISTRATION') {
      return res.json({
        success: true,
        message: 'OTP verified successfully!',
        newUser: true,
        phone: normalizedPhone
      });
    } else {
      // For LOGIN, user should exist - this is an error
      return res.status(404).json({
        success: false,
        error: { 
          message: 'Phone number not registered. Please register first.',
          messageHi: 'फ़ोन नंबर पंजीकृत नहीं है। कृपया पहले पंजीकरण करें।'
        }
      });
    }
  } catch (error) {
    logger.error('Error verifying OTP:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to verify OTP. Please try again.' }
    });
  }
};

const handleRegisterFarmer = async (req, res) => {
  try {
    const farmerData = req.body;
    
    if (!farmerData.phone || !farmerData.name || !farmerData.aadhaar) {
      return res.status(400).json({
        success: false,
        error: { message: 'Required fields missing' }
      });
    }
    // Aadhaar must be exactly 12 digits (numeric only)
    const aadhaarDigits = String(farmerData.aadhaar).replace(/\D/g, '');
    if (aadhaarDigits.length !== 12) {
      return res.status(400).json({
        success: false,
        error: { message: 'Aadhaar must be exactly 12 digits (numeric only)' }
      });
    }
    farmerData.aadhaar = aadhaarDigits;
    
    // Normalize phone number
    const normalizedPhone = normalizePhone(farmerData.phone);
    
    // Check if phone number already exists (raw SQL to avoid Prisma schema drift with last_login etc)
    const existingRows = await prisma.$queryRawUnsafe(
      `SELECT u.id, (SELECT 1 FROM farmer_profiles fp WHERE fp.user_id = u.id LIMIT 1) as has_profile FROM users u WHERE u.phone = $1`,
      normalizedPhone
    );
    const existingUser = Array.isArray(existingRows) && existingRows.length > 0 ? existingRows[0] : null;
    
    // If user exists WITH a profile, they're fully registered - block duplicate
    if (existingUser && existingUser.has_profile) {
      return res.status(409).json({
        success: false,
        error: { message: 'Phone number already registered. Please login to check your account.' }
      });
    }
    
    // If user exists WITHOUT a profile (orphaned from failed registration), delete them first
    if (existingUser && !existingUser.has_profile) {
      logger.warn(`⚠️ Found orphaned user without profile for ${normalizedPhone}, cleaning up...`);
      await prisma.$executeRawUnsafe(`DELETE FROM users WHERE id = $1`, existingUser.id);
    }
    
    // Encrypt Aadhaar (simple base64 for now - use proper encryption in production)
    const aadhaarEncrypted = farmerData.aadhaar ? Buffer.from(farmerData.aadhaar).toString('base64') : null;

    // Normalize irrigation source to match database enum
    const normalizeIrrigationSource = (source) => {
      if (!source) return null;
      const upper = source.toUpperCase().trim();
      const mapping = {
        'BOREWELL': 'TUBE_WELL',
        'TUBEWELL': 'TUBE_WELL',
        'WELL': 'TUBE_WELL',
        'RAIN': 'RAINWATER',
        'RAIN WATER': 'RAINWATER',
        'RAINFED': 'RAINWATER'
      };
      const normalized = mapping[upper] || upper;
      const validValues = ['RAINWATER', 'TUBE_WELL', 'CANAL', 'RIVER', 'POND', 'OTHER'];
      return validValues.includes(normalized) ? normalized : null;
    };
    
    // Normalize ownership type to match database enum
    const normalizeOwnershipType = (type) => {
      if (!type) return null;
      const upper = type.toUpperCase().trim();
      const validValues = ['OWNED', 'LEASED', 'SHARED'];
      return validValues.includes(upper) ? upper : 'OWNED'; // Default to OWNED if invalid
    };
    
    // Normalize land area unit to match database enum
    const normalizeLandAreaUnit = (unit) => {
      if (!unit) return null;
      const upper = unit.toUpperCase().trim();
      const validValues = ['BIGHA', 'HECTARE', 'ACRE', 'KATHA', 'GUNTHA'];
      return validValues.includes(upper) ? upper : null;
    };
    
    // Prepare normalized values
    const normalizedIrrigationSource = normalizeIrrigationSource(farmerData.irrigationSource);
    const normalizedOwnershipType = normalizeOwnershipType(farmerData.ownershipType);
    const normalizedLandAreaUnit = normalizeLandAreaUnit(farmerData.landUnit || farmerData.landAreaUnit);
    const landAreaValue = farmerData.landArea || farmerData.landAreaValue ? parseFloat(farmerData.landArea || farmerData.landAreaValue) : null;
    
    // Use a TRANSACTION to ensure both user and profile are created together
    // If either fails, both are rolled back - no orphaned users
    const farmer = await prisma.$transaction(async (tx) => {
      // Create user in database
      const newUser = await tx.user.create({
        data: {
          role: 'FARMER',
          name: farmerData.name,
          phone: normalizedPhone,
          email: farmerData.email || null,
          phoneVerified: true,
          emailVerified: false,
          dateOfBirth: farmerData.dateOfBirth ? new Date(farmerData.dateOfBirth) : null,
          aadhaarEncrypted: aadhaarEncrypted
        }
      });
      
      // Create farmer profile in the same transaction
      await tx.farmerProfile.create({
        data: {
          userId: newUser.id,
          village: farmerData.village || null,
          tehsil: farmerData.tehsil || null,
          district: farmerData.district,
          state: farmerData.state,
          pincode: farmerData.pincode || null,
          about: farmerData.about || null,
          mainRoadConnectivity: farmerData.mainRoadConnectivity || false,
          landAreaValue: landAreaValue,
          landAreaUnit: normalizedLandAreaUnit,
          irrigationSource: normalizedIrrigationSource,
          ownershipType: normalizedOwnershipType,
          // Also set normalized fields if provided
          fullName: farmerData.name || null,
          dob: farmerData.dateOfBirth ? new Date(farmerData.dateOfBirth) : null,
          aadhaarEnc: farmerData.aadhaar ? Buffer.from(farmerData.aadhaar) : null,
          aadhaarLast4: farmerData.aadhaar ? farmerData.aadhaar.slice(-4) : null
        }
      });
      
      return newUser;
    });
    
    // Fetch the created farmer profile using Prisma
    const farmerProfile = await prisma.farmerProfile.findUnique({
      where: { userId: farmer.id }
    });
    
    // Create land record in `lands` table (same params as Add Land)
    let createdLandId = null;
    if (farmerData.village || farmerData.landArea || farmerData.khasraNumber || farmerData.landAreaValue) {
      try {
        const landAreaVal = landAreaValue || 0;
        const landUnit = (normalizedLandAreaUnit || 'HECTARE').toString();
        const ownershipTypeVal = (normalizedOwnershipType || 'OWNED').toString();
        const villageName = (farmerData.village || farmerData.village_name || '').trim() || null;
        const districtCode = (farmerData.district || farmerData.district_code || '').toString().trim().slice(0, 10) || null;
        const stateCode = (farmerData.state || farmerData.state_code || '').toString().trim().slice(0, 10) || null;
        const tehsilCode = (farmerData.tehsil || farmerData.subdistrict_code || '').toString().trim().slice(0, 10) || null;
        const landName = (farmerData.land_name || farmerData.landName || farmerData.khasraNumber || 'Main Land').toString().trim();
        await prisma.$executeRawUnsafe(
          `INSERT INTO lands (id, farmer_id, land_name, village_name, state_code, district_code, subdistrict_code, land_area, land_unit, ownership_type, status, created_at, updated_at)
           VALUES (gen_random_uuid(), CAST($1 AS uuid), $2, $3, $4, $5, $6, $7, $8::"LandAreaUnit", $9::"OwnershipType", 'SAVED', NOW(), NOW())`,
          farmer.id,
          landName,
          villageName || '',
          stateCode,
          districtCode,
          tehsilCode,
          landAreaVal,
          landUnit,
          ownershipTypeVal
        );
        const rows = await prisma.$queryRawUnsafe(
          'SELECT id FROM lands WHERE farmer_id = CAST($1 AS uuid) ORDER BY created_at DESC LIMIT 1',
          farmer.id
        );
        createdLandId = rows?.[0]?.id || null;
      } catch (error) {
        logger.error('Error creating land record:', error);
        // Continue without land record - don't fail registration
      }
    }
    
    // Create Product records in `products` table (schema: farmer_id, name_en, quantity, unit, expected_price, status, category)
    const selectedProductsData = farmerData.selectedProducts || {};
    const productsWithCategory = [];
    if (typeof selectedProductsData === 'object') {
      Object.entries(selectedProductsData).forEach(([categoryKey, productsList]) => {
        if (Array.isArray(productsList) && categoryKey && typeof categoryKey === 'string') {
          productsList.forEach((name) => {
            if (name && typeof name === 'string') productsWithCategory.push({ name: name.trim(), category: categoryKey.trim().toUpperCase() });
          });
        }
      });
    }
    const customProductsData = farmerData.customProducts || [];
    if (Array.isArray(customProductsData)) {
      customProductsData.forEach((name) => {
        if (name && typeof name === 'string') productsWithCategory.push({ name: name.trim(), category: 'OTHER' });
      });
    }
    const seen = new Set();
    const uniqueProducts = productsWithCategory.filter((p) => {
      const k = p.name.toLowerCase();
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
    logger.debug(`Creating ${uniqueProducts.length} products for farmer ${farmer.id}`);
    for (const { name: productName, category: productCategory } of uniqueProducts) {
      if (!productName) continue;
      const categoryVal = productCategory && productCategory !== 'OTHER' ? productCategory.slice(0, 50) : 'OTHER';
      try {
        await prisma.$executeRawUnsafe(
          `INSERT INTO products (id, farmer_user_id, name, price, stock_qty, unit, is_available, status, category, created_at, updated_at)
           VALUES (gen_random_uuid(), CAST($1 AS uuid), $2, 0, 0, 'KG'::product_unit, false, 'DRAFT'::product_status, $3, NOW(), NOW())`,
          farmer.id,
          productName,
          categoryVal
        );
      } catch (err) {
        if (err?.message?.includes('column') || err?.code === '42703') {
          try {
            await prisma.$executeRawUnsafe(
              `INSERT INTO products (id, farmer_user_id, name, price, stock_qty, unit, is_available, status, created_at, updated_at)
               VALUES (gen_random_uuid(), CAST($1 AS uuid), $2, 0, 0, 'KG'::product_unit, false, 'DRAFT'::product_status, NOW(), NOW())`,
              farmer.id,
              productName
            );
          } catch (fallbackErr) {
            logger.error(`Error creating product "${productName}":`, fallbackErr?.message);
          }
        } else {
          logger.error(`Error creating product "${productName}":`, err?.message);
        }
      }
    }
    
    // REMOVED: All duplicate code - land and products already created above with Prisma
    
    // Fetch complete user with profile for response
    const userWithProfile = await prisma.user.findUnique({
      where: { id: farmer.id },
      include: {
        farmerProfile: true
      }
    });
    
    res.status(201).json({
      success: true,
      user: {
        id: userWithProfile.id,
        role: userWithProfile.role,
        name: userWithProfile.name,
        phone: userWithProfile.phone,
        email: userWithProfile.email,
        phoneVerified: userWithProfile.phoneVerified,
        emailVerified: userWithProfile.emailVerified,
        dateOfBirth: userWithProfile.dateOfBirth,
        farmerProfile: userWithProfile.farmerProfile,
        createdAt: userWithProfile.createdAt,
        updatedAt: userWithProfile.updatedAt
      },
      token: `jwt_token_${farmer.id}`,
      message: 'Farmer registration successful!'
    });
  } catch (error) {
    logger.error('Error registering farmer:', error);
    res.status(500).json({
      success: false,
      error: { message: error.message || 'Failed to register farmer. Please try again.' }
    });
  }
};

// Register auth endpoints at both /api/v1/* and /api/*
registerVersionedRoute('post', '/auth/check-phone', handleCheckPhone);
// Apply rate limiting to OTP endpoints
registerVersionedRoute('post', '/auth/otp/request', otpRateLimiter, handleRequestOTP);
registerVersionedRoute('post', '/auth/otp/verify', loginRateLimiter, handleVerifyOTP);
registerVersionedRoute('post', '/auth/register/farmer', registrationRateLimiter, handleRegisterFarmer);

// Buyer registration and login (keeping existing) - with rate limiting
app.post('/api/auth/register/buyer', registrationRateLimiter, async (req, res) => {
  try {
    const buyerData = req.body;
    
    // Validate required fields
    if (!buyerData.phone) {
      return res.status(400).json({
        success: false,
        error: { message: 'Phone number is required' }
      });
    }
    
    if (!buyerData.gst) {
      return res.status(400).json({
        success: false,
        error: { message: 'GST number is required' }
      });
    }
    
    // Normalize phone and GST before checking/storing
    const normalizedPhone = normalizePhone(buyerData.phone);
    const normalizedGST = normalizeGST(buyerData.gst);
    
    // Check if phone already exists in database
    const existingPhone = await prisma.user.findUnique({
      where: { phone: normalizedPhone }
    });
    
    if (existingPhone) {
      return res.status(409).json({
        success: false,
        error: { message: 'Phone number already registered' }
      });
    }
    
    // Check if GST already exists in database
    const existingGST = await prisma.user.findUnique({
      where: { gstNumber: normalizedGST }
    });
    
    if (existingGST) {
      return res.status(409).json({
        success: false,
        error: { message: 'GST number already registered' }
      });
    }
    
    // Create buyer in database using Prisma
    const buyer = await prisma.user.create({
      data: {
        role: 'BUYER',
        name: buyerData.businessName,
        email: buyerData.email || null,
        phone: normalizedPhone,
        gstNumber: normalizedGST,
        passwordHash: null,
        emailVerified: false,
        phoneVerified: true,
        buyerProfile: {
          create: {
            fullName: buyerData.contactPerson || buyerData.businessName || 'Buyer',
            dob: buyerData.dateOfBirth ? new Date(buyerData.dateOfBirth) : new Date('2000-01-01'),
            businessName: buyerData.businessName,
            gstNumber: normalizedGST
          }
        }
      },
      include: {
        buyerProfile: true
      }
    });
    // Save address details via raw SQL (columns may exist from migration)
    try {
      await prisma.$executeRawUnsafe(
        `UPDATE buyer_profiles SET business_address = $1, village = $2, tehsil = $3, district = $4, state = $5, pincode = $6, contact_person = $7 WHERE user_id = CAST($8 AS uuid)`,
        buyerData.businessAddress || null,
        buyerData.village || null,
        buyerData.tehsil || null,
        buyerData.district || null,
        buyerData.state || null,
        buyerData.pincode || null,
        buyerData.contactPerson || buyerData.businessName || null,
        buyer.id
      );
    } catch (addrErr) {
      logger.debug('Buyer address update skipped (columns may not exist):', addrErr?.message);
    }
    
    res.status(201).json({
      success: true,
      user: {
        id: buyer.id,
        role: buyer.role,
        name: buyer.name,
        phone: buyer.phone,
        email: buyer.email,
        phoneVerified: buyer.phoneVerified,
        emailVerified: buyer.emailVerified,
        buyerProfile: buyer.buyerProfile,
        createdAt: buyer.createdAt,
        updatedAt: buyer.updatedAt
      },
      token: `jwt_token_${buyer.id}`,
      message: 'Buyer registration successful!'
    });
  } catch (error) {
    logger.error('Error registering buyer:', error);
    res.status(500).json({
      success: false,
      error: { message: error.message || 'Failed to register buyer. Please try again.' }
    });
  }
});

app.post('/api/auth/login', loginRateLimiter, (req, res) => {
  res.status(410).json({
    success: false,
    error: { message: 'Password-based login is disabled. Use OTP login instead.' }
  });
});

// Helper function to normalize phone number
const normalizePhone = (phone) => {
  if (!phone) return '';
  // Remove all non-digit characters except +
  let normalized = phone.replace(/[^\d+]/g, '');
  // Ensure it starts with +91 for Indian numbers
  if (normalized.startsWith('91') && !normalized.startsWith('+91')) {
    normalized = '+' + normalized;
  } else if (normalized.length === 10) {
    normalized = '+91' + normalized;
  }
  return normalized;
};

// Helper function to normalize GST (uppercase, trim whitespace)
const normalizeGST = (gst) => {
  if (!gst) return '';
  return gst.trim().toUpperCase();
};

// Buyer login via OTP (Phone + GST -> OTP verification)
app.post('/api/auth/login/buyer/request-otp', async (req, res) => {
  const { phone, gst } = req.body;
  
  // Both phone and GST are required
  if (!phone || !gst) {
    return res.status(400).json({
      success: false,
      error: { message: 'Phone number and GST number are required' }
    });
  }
  
  // Normalize phone and GST for comparison
  const normalizedPhone = normalizePhone(phone);
  const normalizedGST = normalizeGST(gst);
  
  // Find buyer in database by matching both phone AND GST
  const buyer = await prisma.user.findFirst({
    where: {
      role: 'BUYER',
      phone: normalizedPhone,
      gstNumber: normalizedGST
    }
  });

  if (!buyer) {
    return res.status(404).json({
      success: false,
      error: { message: 'Buyer not found. Phone number and GST number must match.' }
    });
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const otpEntry = {
    phone: buyer.phone,
    otp,
    verified: false,
    expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    createdAt: new Date()
  };

  const existingIdx = otps.findIndex(o => o.phone === buyer.phone);
  if (existingIdx !== -1) otps.splice(existingIdx, 1);
  otps.push(otpEntry);
  logger.debug(`📱 Buyer OTP for ${buyer.phone} (GST ${gst}): ${otp}`);

  res.json({
    success: true,
    message: 'OTP sent to buyer phone',
    gst,
    phone: buyer.phone,
    otp
  });
});

app.post('/api/auth/login/buyer/verify-otp', loginRateLimiter, async (req, res) => {
  try {
    const { phone, gst, otp } = req.body;
    const otpBypassEnabled = process.env.OTP_BYPASS === 'true';
    
    // Both phone and GST are required
    if (!phone || !gst) {
      return res.status(400).json({
        success: false,
        error: { message: 'Phone number and GST number are required' }
      });
    }
    
    // Normalize phone and GST for comparison
    const normalizedPhone = normalizePhone(phone);
    const normalizedGST = normalizeGST(gst);
    
    // Find buyer in database by matching both phone AND GST (normalized)
    const buyer = await prisma.user.findFirst({
      where: {
        role: 'BUYER',
        phone: normalizedPhone,
        gstNumber: normalizedGST
      },
      include: {
        buyerProfile: true
      }
    });

    if (!buyer) {
      return res.status(404).json({
        success: false,
        error: { message: 'Buyer not found. Phone number and GST number must match.' }
      });
    }

  if (!otpBypassEnabled) {
    const normalizedOtp = String(otp).trim();
    const otpEntry = otps.find(o =>
      o.phone === buyer.phone &&
      String(o.otp).trim() === normalizedOtp &&
      !o.verified &&
      o.expiresAt > new Date()
    );

    if (!otpEntry) {
      return res.status(400).json({
        success: false,
        error: { message: 'Invalid or expired OTP' }
      });
    }

    otpEntry.verified = true;
  } else {
    logger.warn(`⚠️ OTP bypass enabled - skipping buyer OTP verification for ${buyer.phone}`);
  }

    res.json({
      success: true,
      user: {
        id: buyer.id,
        role: buyer.role,
        name: buyer.name,
        email: buyer.email,
        phone: buyer.phone,
        phoneVerified: buyer.phoneVerified,
        emailVerified: buyer.emailVerified,
        buyerProfile: buyer.buyerProfile,
        createdAt: buyer.createdAt,
        updatedAt: buyer.updatedAt
      },
      token: `jwt_token_${buyer.id}`,
      message: 'Buyer login successful!'
    });
  } catch (error) {
    logger.error('Error verifying buyer OTP:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to verify OTP. Please try again.' }
    });
  }
});

// Supplier registration - Using Prisma
app.post('/api/auth/register/supplier', registrationRateLimiter, async (req, res) => {
  try {
    const supplierData = req.body;
    
    if (!supplierData.phone) {
      return res.status(400).json({
        success: false,
        error: { message: 'Phone number is required' }
      });
    }
    
    if (!supplierData.organizationName || !supplierData.email) {
      return res.status(400).json({
        success: false,
        error: { message: 'Organization name and email are required' }
      });
    }
    
    const normalizedPhone = normalizePhone(supplierData.phone);
    const normalizedGST = normalizeGST(supplierData.gstNumber || '');
    
    const [existingPhone, existingEmail] = await Promise.all([
      prisma.user.findUnique({ where: { phone: normalizedPhone } }),
      prisma.user.findUnique({ where: { email: supplierData.email } })
    ]);
    if (existingPhone) {
      return res.status(409).json({
        success: false,
        error: { message: 'Phone number already registered. Please login to check your account.' }
      });
    }
    if (existingEmail) {
      return res.status(409).json({
        success: false,
        error: { message: 'Email already registered' }
      });
    }
    
    const supplier = await prisma.user.create({
      data: {
        role: 'SUPPLIER',
        name: supplierData.organizationName,
        phone: normalizedPhone,
        email: supplierData.email,
        phoneVerified: true,
        emailVerified: false,
        gstNumber: normalizedGST || null,
        supplierProfile: {
          create: {
            organizationName: supplierData.organizationName,
            contactName: supplierData.contactName || supplierData.organizationName,
            gstNumber: normalizedGST
          }
        }
      },
      include: { supplierProfile: true }
    });
    // Save address details via raw SQL (columns may exist from migration)
    try {
      await prisma.$executeRawUnsafe(
        `UPDATE supplier_profiles SET business_address = $1, village = $2, tehsil = $3, district = $4, state = $5, pincode = $6 WHERE user_id = CAST($7 AS uuid)`,
        supplierData.businessAddress || null,
        supplierData.village || null,
        supplierData.tehsil || null,
        supplierData.district || null,
        supplierData.state || null,
        supplierData.pincode || null,
        supplier.id
      );
    } catch (addrErr) {
      logger.debug('Supplier address update skipped (columns may not exist):', addrErr?.message);
    }

    // Save supplier types: map frontend codes to DB codes
    const codeMap = { TRANSPORT: 'TRANSPORT_MACHINERY', MACHINERY: 'FARMING_MACHINERY', LABOUR: 'LABOUR_SERVICES' };
    const dbCodes = (supplierData.supplierTypes || [])
      .map(t => codeMap[t] || (t === 'TEST' ? null : t))
      .filter(Boolean);
    if (dbCodes.length > 0) {
      try {
        const typeMasters = await prisma.supplierTypeMaster.findMany({ where: { code: { in: dbCodes } } });
        await prisma.supplierType.createMany({
          data: typeMasters.map(tm => ({ supplierUserId: supplier.id, supplierTypeId: tm.id }))
        });
      } catch (stErr) {
        logger.debug('Supplier types save skipped:', stErr?.message);
      }
    }

    res.status(201).json({
      success: true,
      user: {
        id: supplier.id,
        role: supplier.role,
        name: supplier.name,
        email: supplier.email,
        phone: supplier.phone,
        supplierProfile: supplier.supplierProfile,
        createdAt: supplier.createdAt
      },
      token: `jwt_token_${supplier.id}`,
      message: 'Supplier registration successful!'
    });
  } catch (error) {
    logger.error('Error registering supplier:', error);
    res.status(500).json({
      success: false,
      error: { message: error.message || 'Failed to register supplier' }
    });
  }
});

// Supplier login via OTP (GST -> phone)
app.post('/api/auth/login/supplier/request-otp', otpRateLimiter, async (req, res) => {
  try {
    const { gst } = req.body;
    const normalizedGST = normalizeGST(gst);
    const supplier = await prisma.user.findFirst({
      where: { role: 'SUPPLIER', gstNumber: normalizedGST }
    });

    if (!supplier || !supplier.phone) {
      return res.status(404).json({
        success: false,
        error: { message: 'Supplier not found or phone missing' }
      });
    }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const otpEntry = {
    phone: supplier.phone,
    otp,
    verified: false,
    expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    createdAt: new Date()
  };

  const existingIdx = otps.findIndex(o => o.phone === supplier.phone);
  if (existingIdx !== -1) otps.splice(existingIdx, 1);
  otps.push(otpEntry);
  logger.debug(`📱 Supplier OTP for ${supplier.phone} (GST ${gst}): ${otp}`);

  res.json({
    success: true,
    message: 'OTP sent to supplier phone',
    gst,
    phone: supplier.phone,
    otp
  });
  } catch (error) {
    logger.error('Error in supplier request-otp:', error);
    res.status(500).json({ success: false, error: { message: 'Failed to send OTP' } });
  }
});

app.post('/api/auth/login/supplier/verify-otp', loginRateLimiter, async (req, res) => {
  try {
    const { gst, otp } = req.body;
    const otpBypassEnabled = process.env.OTP_BYPASS === 'true';
    const normalizedGST = normalizeGST(gst);
    const supplier = await prisma.user.findFirst({
      where: { role: 'SUPPLIER', gstNumber: normalizedGST },
      include: { supplierProfile: true }
    });

    if (!supplier || !supplier.phone) {
      return res.status(404).json({
        success: false,
        error: { message: 'Supplier not found or phone missing' }
      });
    }

    if (!otpBypassEnabled) {
    const normalizedOtp = String(otp).trim();
    const otpEntry = otps.find(o =>
      o.phone === supplier.phone &&
      String(o.otp).trim() === normalizedOtp &&
      !o.verified &&
      o.expiresAt > new Date()
    );

    if (!otpEntry) {
      return res.status(400).json({
        success: false,
        error: { message: 'Invalid or expired OTP' }
      });
    }

    otpEntry.verified = true;
  } else {
    logger.warn(`⚠️ OTP bypass enabled - skipping supplier OTP verification for ${supplier.phone}`);
  }

  res.json({
    success: true,
    user: {
      id: supplier.id,
      role: supplier.role,
      name: supplier.name,
      email: supplier.email,
      phone: supplier.phone,
      supplierProfile: supplier.supplierProfile
    },
    token: `jwt_token_${supplier.id}`,
    message: 'Login successful!'
  });
  } catch (error) {
    logger.error('Error verifying supplier OTP:', error);
    res.status(500).json({ success: false, error: { message: 'Failed to verify OTP' } });
  }
});

// Enhanced Farmer Portal APIs

// Get farmer profile - Using Prisma (database, not in-memory)
app.get('/api/farmer/:farmerId/profile', async (req, res) => {
  try {
    const { farmerId } = req.params;
    
    const farmer = await prisma.user.findUnique({
      where: { id: farmerId, role: 'FARMER' },
      include: { farmerProfile: true }
    });
    
    if (!farmer || !farmer.farmerProfile) {
      return res.status(404).json({
        success: false,
        error: { message: 'Farmer not found' }
      });
    }
    
    // Fetch products for selectedProducts (3NF: farmer_user_id, name)
    let selectedProducts = {};
    try {
      const rawProducts = await prisma.$queryRawUnsafe(
        'SELECT name FROM products WHERE farmer_user_id = CAST($1 AS uuid)',
        farmerId
      );
      const names = (Array.isArray(rawProducts) ? rawProducts : []).map(p => p?.name).filter(Boolean);
      if (names.length > 0) {
        selectedProducts = { REGISTERED: names };
      }
    } catch (_) {
      // continue with empty
    }
    
    res.json({
      success: true,
      farmer: {
        id: farmer.id,
        role: farmer.role,
        name: farmer.name,
        phone: farmer.phone,
        email: farmer.email,
        phoneVerified: farmer.phoneVerified,
        emailVerified: farmer.emailVerified,
        dateOfBirth: farmer.dateOfBirth,
        aadhaarEncrypted: farmer.aadhaarEncrypted,
        createdAt: farmer.createdAt,
        updatedAt: farmer.updatedAt,
        farmerProfile: {
          ...farmer.farmerProfile,
          selectedProducts,
          landAreaValue: farmer.farmerProfile.landAreaValue,
          landAreaUnit: farmer.farmerProfile.landAreaUnit,
          landDetails: farmer.farmerProfile.landAreaValue ? {
            area: parseFloat(farmer.farmerProfile.landAreaValue),
            unit: farmer.farmerProfile.landAreaUnit,
            mainRoadConnectivity: farmer.farmerProfile.mainRoadConnectivity,
            irrigationSource: farmer.farmerProfile.irrigationSource,
            ownershipType: farmer.farmerProfile.ownershipType
          } : null
        }
      }
    });
  } catch (error) {
    logger.error('Error fetching farmer profile:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch profile' }
    });
  }
});

// Add a new location for farmer (max 5) - Using Prisma
app.post('/api/farmer/:farmerId/locations', async (req, res) => {
  try {
    const { farmerId } = req.params;
    
    // Check if farmer exists using Prisma
    const farmer = await prisma.user.findUnique({
      where: { id: farmerId },
      include: { farmerProfile: true }
    });

    if (!farmer || farmer.role !== 'FARMER' || !farmer.farmerProfile) {
      return res.status(404).json({
        success: false,
        error: { message: 'Farmer not found' }
      });
    }

    const location = sanitizeLocation(req.body || {});

    if (!validateLocation(location)) {
      return res.status(400).json({
        success: false,
        error: { message: 'Village, district, and state are required' }
      });
    }

    // Check existing locations count using Prisma
    const existingLocations = await prisma.farmerLocation.findMany({
      where: { farmerUserId: farmerId }
    });
    
    if (existingLocations.length >= 5) {
      return res.status(400).json({
        success: false,
        error: { message: 'Maximum 5 locations allowed' }
      });
    }

    // Create address for the location
    let country = await prisma.country.findFirst({ where: { name: 'India' } });
    if (!country) {
      country = await prisma.country.create({ data: { name: 'India', isoCode: 'IN' } });
    }

    const address = await prisma.address.create({
      data: {
        countryId: country.id,
        line1: `${location.village || ''}, ${location.district || ''}`.trim(),
        pincode: location.pincode || null
      }
    });

    // Create farmer location using Prisma
    const farmerLocation = await prisma.farmerLocation.create({
      data: {
        farmerUserId: farmerId,
        addressId: address.id,
        label: location.label || `Location ${existingLocations.length + 1}`,
        isActive: true
      }
    });

    res.json({
      success: true,
      location: farmerLocation,
      message: 'Location added successfully'
    });
  } catch (error) {
    logger.error('Error adding farmer location:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to add location' }
    });
  }
});

// Update farmer profile (excluding phone and aadhaar) - Using Prisma
app.put('/api/farmer/:farmerId/profile', async (req, res) => {
  try {
    const { farmerId } = req.params;
    const updates = req.body;
    
    const farmer = await prisma.user.findUnique({
      where: { id: farmerId, role: 'FARMER' },
      include: { farmerProfile: true }
    });
    
    if (!farmer || !farmer.farmerProfile) {
      return res.status(404).json({
        success: false,
        error: { message: 'Farmer not found' }
      });
    }
    
    // Don't allow updating name, phone, dateOfBirth, and aadhaar (immutable after registration)
    delete updates.name;
    delete updates.phone;
    delete updates.dateOfBirth;
    delete updates.aadhaar;
    delete updates.aadhaarEncrypted;

    const userUpdates = {};
    if (updates.email !== undefined) userUpdates.email = updates.email || null;

    const profileUpdates = {};
    const fp = updates.farmerProfile || updates;
    if (fp.village !== undefined) profileUpdates.village = fp.village;
    if (fp.tehsil !== undefined) profileUpdates.tehsil = fp.tehsil;
    if (fp.district !== undefined) profileUpdates.district = fp.district;
    if (fp.state !== undefined) profileUpdates.state = fp.state;
    if (fp.pincode !== undefined) profileUpdates.pincode = fp.pincode;
    if (fp.about !== undefined) profileUpdates.about = fp.about;
    if (fp.mainRoadConnectivity !== undefined) profileUpdates.mainRoadConnectivity = fp.mainRoadConnectivity;
    if (fp.landAreaValue !== undefined || fp.landArea !== undefined) profileUpdates.landAreaValue = fp.landAreaValue ?? fp.landArea ?? null;
    if (fp.landAreaUnit !== undefined) profileUpdates.landAreaUnit = fp.landAreaUnit;
    if (fp.irrigationSource !== undefined) profileUpdates.irrigationSource = fp.irrigationSource;
    if (fp.ownershipType !== undefined) profileUpdates.ownershipType = fp.ownershipType;

    if (Object.keys(userUpdates).length > 0) {
      await prisma.user.update({
        where: { id: farmerId },
        data: userUpdates
      });
    }
    if (Object.keys(profileUpdates).length > 0) {
      await prisma.farmerProfile.update({
        where: { userId: farmerId },
        data: profileUpdates
      });
    }
    
    const updated = await prisma.user.findUnique({
      where: { id: farmerId },
      include: { farmerProfile: true }
    });
    
    res.json({
      success: true,
      farmer: updated,
      message: 'Profile updated successfully'
    });
  } catch (error) {
    logger.error('Error updating farmer profile:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to update profile' }
    });
  }
});

// Get farmer lands - uses `lands` table; falls back to registration data from farmer_profile
app.get('/api/farmer/:farmerId/lands', async (req, res) => {
  try {
    const { farmerId } = req.params;
    
    const farmer = await prisma.user.findUnique({
      where: { id: farmerId },
      include: { farmerProfile: true }
    });
    
    if (!farmer || farmer.role !== 'FARMER' || !farmer.farmerProfile) {
      return res.status(404).json({
        success: false,
        error: { message: 'Farmer not found' }
      });
    }
    
    const fp = farmer.farmerProfile;
    let transformedLands = [];
    
    // Fetch from `lands` table (actual DB table)
    try {
      const dbLands = await prisma.$queryRawUnsafe(
        `SELECT id, farmer_id, land_name, village_name, state_code, district_code, subdistrict_code,
         land_area, land_unit, ownership_type, status, created_at, updated_at
         FROM lands WHERE farmer_id = CAST($1 AS uuid) ORDER BY created_at DESC`,
        farmerId
      );
      transformedLands = (Array.isArray(dbLands) ? dbLands : []).map(land => ({
        id: land.id,
        land_id: land.id,
        farmer_id: land.farmer_id,
        farmerId: land.farmer_id,
        land_name: land.land_name || 'Untitled Land',
        khasra_number: land.khasra_number ?? null,
        village_name: land.village_name,
        district: land.district_code || null,
        state: land.state_code || null,
        tehsil: land.subdistrict_code || null,
        land_area: land.land_area ? parseFloat(land.land_area) : null,
        land_unit: land.land_unit,
        ownership_type: land.ownership_type,
        status: land.status || 'SAVED',
        createdAt: land.created_at?.toISOString?.() || new Date().toISOString(),
        updatedAt: land.updated_at?.toISOString?.() || new Date().toISOString()
      }));
    } catch (landsErr) {
      logger.debug('lands table query failed, using farmer_profile fallback:', landsErr?.message);
    }
    
    // If no lands in lands table, use registration data from farmer_profile
    if (transformedLands.length === 0 && (fp.village || fp.landAreaValue || fp.district)) {
      const areaVal = fp.landAreaValue ? parseFloat(fp.landAreaValue.toString()) : null;
      transformedLands = [{
        id: fp.userId,
        land_id: fp.userId,
        farmer_id: farmerId,
        farmerId,
        land_name: 'Main Land (from registration)',
        khasra_number: null,
        village_name: fp.village || null,
        district: fp.district || null,
        state: fp.state || null,
        tehsil: fp.tehsil || null,
        land_area: areaVal,
        land_unit: fp.landAreaUnit || null,
        ownership_type: fp.ownershipType || null,
        status: 'SAVED',
        createdAt: fp.createdAt?.toISOString?.() || new Date().toISOString(),
        updatedAt: fp.updatedAt?.toISOString?.() || new Date().toISOString()
      }];
    }
    
    res.json({
      success: true,
      lands: transformedLands,
      total: transformedLands.length
    });
  } catch (error) {
    logger.error('Error fetching farmer lands:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch lands' }
    });
  }
});

// Create land - insert into `lands` table
app.post('/api/farmer/:farmerId/lands', async (req, res) => {
  try {
    const { farmerId } = req.params;
    const landData = req.body;
    
    const farmer = await prisma.user.findUnique({
      where: { id: farmerId },
      include: { farmerProfile: true }
    });
    
    if (!farmer || farmer.role !== 'FARMER' || !farmer.farmerProfile) {
      return res.status(404).json({
        success: false,
        error: { message: 'Farmer not found' }
      });
    }
    
    if (!landData.land_name || !landData.land_name.trim()) {
      return res.status(400).json({
        success: false,
        error: { message: 'Land name is required' }
      });
    }
    
    const normalizeLandUnit = (unit) => {
      if (!unit) return 'HECTARE';
      const u = (unit || '').toUpperCase().trim();
      return ['BIGHA', 'HECTARE', 'ACRE', 'KATHA', 'GUNTHA'].includes(u) ? u : 'HECTARE';
    };
    const normalizeOwnership = (o) => {
      if (!o) return 'OWNED';
      const u = (o || '').toUpperCase().trim();
      return ['OWNED', 'LEASED', 'SHARED'].includes(u) ? u : 'OWNED';
    };
    
    const landArea = parseFloat(landData.land_area || landData.landArea) || 0;
    const landUnit = normalizeLandUnit(landData.land_unit || landData.landUnit || landData.landAreaUnit);
    const ownershipType = normalizeOwnership(landData.ownership_type || landData.ownershipType);
    const villageName = (landData.village_name || landData.village || '').trim() || null;
    const districtCode = (landData.district || landData.district_code || '').toString().trim().slice(0, 10) || null;
    const stateCode = (landData.state || landData.state_code || '').toString().trim().slice(0, 10) || null;
    const subdistrictCode = (landData.tehsil || landData.subdistrict_code || '').toString().trim().slice(0, 10) || null;
    
    await prisma.$executeRawUnsafe(
      `INSERT INTO lands (id, farmer_id, land_name, village_name, state_code, district_code, subdistrict_code, land_area, land_unit, ownership_type, status, created_at, updated_at)
       VALUES (gen_random_uuid(), CAST($1 AS uuid), $2, $3, $4, $5, $6, $7, $8::"LandAreaUnit", $9::"OwnershipType", 'SAVED', NOW(), NOW())`,
      farmerId,
      landData.land_name.trim(),
      villageName,
      stateCode,
      districtCode,
      subdistrictCode,
      landArea,
      landUnit,
      ownershipType
    );
    
    const rows = await prisma.$queryRawUnsafe(
      `SELECT id, farmer_id, land_name, village_name, state_code, district_code, subdistrict_code, land_area, land_unit, ownership_type, status, created_at, updated_at
       FROM lands WHERE farmer_id = CAST($1 AS uuid) ORDER BY created_at DESC LIMIT 1`,
      farmerId
    );
    const row = Array.isArray(rows) && rows.length ? rows[0] : null;
    const transformedLand = row ? {
      id: row.id,
      land_id: row.id,
      farmer_id: row.farmer_id,
      farmerId: row.farmer_id,
      land_name: row.land_name || 'Untitled Land',
      khasra_number: null,
      village_name: row.village_name,
      district: row.district_code,
      state: row.state_code,
      tehsil: row.subdistrict_code,
      land_area: parseFloat(row.land_area) || 0,
      land_unit: row.land_unit,
      ownership_type: row.ownership_type,
      status: row.status || 'SAVED',
      createdAt: row.created_at?.toISOString?.() || new Date().toISOString(),
      updatedAt: row.updated_at?.toISOString?.() || new Date().toISOString()
    } : { land_name: landData.land_name.trim(), farmerId };
    
    res.status(201).json({
      success: true,
      land: transformedLand,
      message: 'Land added successfully'
    });
  } catch (error) {
    logger.error('Error creating land:', error);
    res.status(500).json({
      success: false,
      error: { message: error.message || 'Failed to create land' }
    });
  }
});

// Update land - Using Prisma (no in-memory storage)
app.put('/api/farmer/:farmerId/lands/:landId', async (req, res) => {
  try {
    const { farmerId, landId } = req.params;
    const landData = req.body;
    
    // Verify land exists and belongs to farmer
    const landRecord = await prisma.landRecord.findFirst({
      where: {
        id: landId,
        farmerUserId: farmerId
      }
    });
    
    if (!landRecord) {
      return res.status(404).json({
        success: false,
        error: { message: 'Land not found' }
      });
    }
    
    // Normalize land area unit if provided
    const normalizeLandAreaUnit = (unit) => {
      if (!unit) return undefined;
      const upper = unit.toUpperCase().trim();
      const validValues = ['BIGHA', 'HECTARE', 'ACRE', 'KATHA', 'GUNTHA'];
      return validValues.includes(upper) ? upper : undefined;
    };
    
    // Update land record using Prisma
    const updatedLand = await prisma.landRecord.update({
      where: { id: landId },
      data: {
        landName: landData.land_name ? landData.land_name.trim() : undefined,
        khasraNumber: landData.khasra_number || landData.khasraNumber || undefined,
        areaValue: landData.land_area ? parseFloat(landData.land_area) : undefined,
        areaUnit: normalizeLandAreaUnit(landData.land_unit || landData.landAreaUnit),
        notes: landData.notes !== undefined ? landData.notes : undefined
      }
    });
    
    // Transform response
    const transformedLand = {
      id: updatedLand.id,
      land_id: updatedLand.id,
      farmer_id: updatedLand.farmerUserId,
      farmerId: updatedLand.farmerUserId,
      land_name: updatedLand.landName || 'Untitled Land',
      khasra_number: updatedLand.khasraNumber,
      land_area: parseFloat(updatedLand.areaValue.toString()),
      land_unit: updatedLand.areaUnit,
      createdAt: updatedLand.createdAt.toISOString(),
      updatedAt: updatedLand.updatedAt.toISOString()
    };
    
    res.json({
      success: true,
      land: transformedLand,
      message: 'Land updated successfully'
    });
  } catch (error) {
    logger.error('Error updating land:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to update land' }
    });
  }
});

// Delete land - Using Prisma (no in-memory storage)
app.delete('/api/farmer/:farmerId/lands/:landId', async (req, res) => {
  try {
    const { farmerId, landId } = req.params;
    
    // Verify land exists and belongs to farmer
    const landRecord = await prisma.landRecord.findFirst({
      where: {
        id: landId,
        farmerUserId: farmerId
      }
    });
    
    if (!landRecord) {
      return res.status(404).json({
        success: false,
        error: { message: 'Land not found' }
      });
    }
    
    // Check if it's the only land
    const farmerLands = await prisma.landRecord.findMany({
      where: { farmerUserId: farmerId }
    });
    
    if (farmerLands.length === 1) {
      return res.status(400).json({
        success: false,
        error: { message: 'Cannot delete the only land. Please add another land first.' }
      });
    }
    
    // Delete land using Prisma
    await prisma.landRecord.delete({
      where: { id: landId }
    });
    
    res.json({
      success: true,
      message: 'Land deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting land:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to delete land' }
    });
  }
});

// Get farmer products - uses `products` table (farmer_id, name_en, quantity, etc.)
app.get('/api/farmer/:farmerId/products', async (req, res) => {
  try {
    const { farmerId } = req.params;
    
    const farmer = await prisma.user.findUnique({
      where: { id: farmerId },
      include: { farmerProfile: true }
    });
    
    if (!farmer || farmer.role !== 'FARMER' || !farmer.farmerProfile) {
      return res.status(404).json({
        success: false,
        error: { message: 'Farmer not found' }
      });
    }
    
    let farmerProducts = [];
    try {
      const rows = await prisma.$queryRawUnsafe(
        `SELECT id, farmer_user_id, name, price, stock_qty, unit, status, is_available, harvest_date, land_id, category, created_at, updated_at
         FROM products WHERE farmer_user_id = CAST($1 AS uuid) ORDER BY created_at DESC`,
        farmerId
      );
      farmerProducts = Array.isArray(rows) ? rows : [];
    } catch (dbErr) {
      logger.debug('products query (with harvest/land) failed, trying base columns:', dbErr?.message);
      try {
        const rows = await prisma.$queryRawUnsafe(
          `SELECT id, farmer_user_id, name, price, stock_qty, unit, status, is_available, created_at, updated_at
           FROM products WHERE farmer_user_id = CAST($1 AS uuid) ORDER BY created_at DESC`,
          farmerId
        );
        farmerProducts = Array.isArray(rows) ? rows : [];
      } catch (e2) {
        logger.debug('products query failed:', e2?.message);
      }
    }
    
    const transformedProducts = farmerProducts.map(p => {
      const qty = parseFloat(p.stock_qty) || 0;
      const price = parseFloat(p.price) || 0;
      const isAvailable = p.is_available === true || p.is_available === 't';
      const isBidReady = (p.status === 'PUBLISHED' || p.status === 'SUSPENDED') && isAvailable;
      return {
        id: p.id,
        farmerId: p.farmer_user_id,
        farmer_id: p.farmer_user_id,
        name: p.name || '',
        nameHi: p.name || '',
        category: p.category || 'OTHER',
        quantity: qty,
        unit: (p.unit || 'kg').toString().toLowerCase(),
        expectedPrice: price,
        finalPrice: null,
        status: p.status || 'DRAFT',
        availableForBrowse: isBidReady,
        harvestDate: p.harvest_date ? new Date(p.harvest_date).toISOString().split('T')[0] : null,
        land_id: p.land_id || null,
        images: [],
        description: null,
        createdAt: p.created_at?.toISOString?.() || new Date().toISOString(),
        updatedAt: p.updated_at?.toISOString?.() || new Date().toISOString()
      };
    });
    
    res.json({
      success: true,
      products: transformedProducts,
      total: transformedProducts.length
    });
  } catch (error) {
    logger.error('Error fetching farmer products:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch products' }
    });
  }
});

// Add farmer product - insert into products table
app.post('/api/farmer/:farmerId/products', async (req, res) => {
  try {
    const { farmerId } = req.params;
    const productData = req.body;
    const name = productData.name || productData.name_en || '';
    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({
        success: false,
        error: { message: 'Product name is required' }
      });
    }
    const farmer = await prisma.user.findUnique({
      where: { id: farmerId },
      include: { farmerProfile: true }
    });
    if (!farmer || farmer.role !== 'FARMER' || !farmer.farmerProfile) {
      return res.status(404).json({
        success: false,
        error: { message: 'Farmer not found' }
      });
    }
    const quantity = parseFloat(productData.quantity) || 0;
    const expectedPrice = parseFloat(productData.expectedPrice || productData.expected_price) || 0;
    const unitRaw = (productData.unit || 'kg').toString();
    const unit = ['KG', 'QUINTAL', 'TON', 'LITER', 'PIECE', 'OTHER'].includes(unitRaw.toUpperCase()) ? unitRaw.toUpperCase() : 'KG';
    const category = productData.category && typeof productData.category === 'string' ? String(productData.category).trim().slice(0, 50) : 'OTHER';
    const landId = productData.land_id || null;
    const harvestDate = productData.harvestDate || null;
    try {
      await prisma.$executeRawUnsafe(
        `INSERT INTO products (id, farmer_user_id, name, price, stock_qty, unit, is_available, status, category, land_id, harvest_date, created_at, updated_at)
         VALUES (gen_random_uuid(), CAST($1 AS uuid), $2, $3, $4, $5::product_unit, false, 'DRAFT'::product_status, $6, $7::uuid, $8::date, NOW(), NOW())`,
        farmerId,
        name.trim(),
        expectedPrice,
        quantity,
        unit,
        category,
        landId,
        harvestDate
      );
    } catch (insertErr) {
      if (insertErr?.message?.includes('column') || insertErr?.code === '42703') {
        await prisma.$executeRawUnsafe(
          `INSERT INTO products (id, farmer_user_id, name, price, stock_qty, unit, is_available, status, created_at, updated_at)
           VALUES (gen_random_uuid(), CAST($1 AS uuid), $2, $3, $4, $5::product_unit, false, 'DRAFT'::product_status, NOW(), NOW())`,
          farmerId, name.trim(), expectedPrice, quantity, unit
        );
      } else throw insertErr;
    }
    const rows = await prisma.$queryRawUnsafe(
      `SELECT id, farmer_user_id, name, stock_qty, unit, price, status, category, land_id, harvest_date, created_at FROM products
       WHERE farmer_user_id = CAST($1 AS uuid) ORDER BY created_at DESC LIMIT 1`,
      farmerId
    );
    const row = Array.isArray(rows) && rows.length ? rows[0] : null;
    const product = row ? {
      id: row.id,
      farmerId: row.farmer_user_id ?? farmerId,
      name: row.name ?? name.trim(),
      quantity: parseFloat(row.stock_qty) || 0,
      unit: (row.unit || 'kg').toString().toLowerCase(),
      expectedPrice: parseFloat(row.price) || 0,
      status: row.status || 'PUBLISHED',
      createdAt: row.created_at?.toISOString?.() || new Date().toISOString()
    } : { id: null, name: name.trim(), farmerId };
    res.status(201).json({
      success: true,
      product,
      message: 'Product added successfully'
    });
  } catch (error) {
    logger.error('Error adding product:', error);
    res.status(500).json({
      success: false,
      error: { message: error.message || 'Failed to add product' }
    });
  }
});

// Update farmer product - Using Prisma (no in-memory storage)
app.put('/api/farmer/:farmerId/products/:productId', async (req, res) => {
  try {
    const { farmerId, productId } = req.params;
    const productData = req.body;
    
    // Verify product exists and belongs to farmer
    const product = await prisma.product.findFirst({
      where: {
        id: productId,
        farmerUserId: farmerId
      }
    });
    
    if (!product) {
      return res.status(404).json({
        success: false,
        error: { message: 'Product not found' }
      });
    }
    
    // Normalize product unit if provided
    const normalizeProductUnit = (unit) => {
      if (!unit) return undefined;
      const upper = String(unit).toUpperCase().trim();
      const validValues = ['KG', 'QUINTAL', 'TON', 'LITER', 'PIECE', 'OTHER'];
      return validValues.includes(upper) ? upper : undefined;
    };
    
    // Normalize status: frontend uses AVAILABLE_FOR_BID/BID_READY, DB uses PUBLISHED
    const normalizeProductStatus = (status) => {
      if (!status) return undefined;
      const upper = String(status).toUpperCase().trim().replace(/\s+/g, '_');
      const mapping = { AVAILABLE_FOR_BID: 'PUBLISHED', BID_READY: 'PUBLISHED' };
      const mapped = mapping[upper] || upper;
      const validValues = ['DRAFT', 'PUBLISHED', 'SUSPENDED', 'SOLD_OUT'];
      return validValues.includes(mapped) ? mapped : undefined;
    };
    
    // Build update data, excluding undefined
    const updateData = {};
    if (productData.name !== undefined && productData.name !== null) updateData.name = String(productData.name).trim();
    if (productData.expectedPrice !== undefined || productData.price !== undefined) {
      updateData.price = parseFloat(productData.expectedPrice ?? productData.price ?? 0);
    }
    const normUnit = normalizeProductUnit(productData.unit);
    if (normUnit) updateData.unit = normUnit;
    if (productData.quantity !== undefined || productData.stockQty !== undefined) {
      updateData.stockQty = parseFloat(productData.quantity ?? productData.stockQty ?? 0);
    }
    if (productData.availableForBrowse !== undefined) updateData.isAvailable = Boolean(productData.availableForBrowse);
    const normStatus = normalizeProductStatus(productData.status);
    if (normStatus) updateData.status = normStatus;
    
    let updatedProduct = product;
    if (Object.keys(updateData).length > 0) {
      updatedProduct = await prisma.product.update({
        where: { id: productId },
        data: updateData
      });
    }
    
    // Update harvest_date, land_id, category via raw SQL (not in Prisma schema)
    const hasHarvest = productData.harvestDate !== undefined;
    const hasLandId = productData.land_id !== undefined;
    const hasCategory = productData.category !== undefined && productData.category !== null;
    if (hasHarvest || hasLandId || hasCategory) {
      try {
        const parts = [];
        const params = [];
        let pIdx = 1;
        if (hasHarvest) {
          parts.push(`harvest_date = $${pIdx}::date`);
          params.push(productData.harvestDate || null);
          pIdx++;
        }
        if (hasLandId) {
          parts.push(`land_id = $${pIdx}::uuid`);
          params.push(productData.land_id || null);
          pIdx++;
        }
        if (hasCategory) {
          parts.push(`category = $${pIdx}`);
          params.push(String(productData.category).trim().slice(0, 50) || 'OTHER');
          pIdx++;
        }
        const whereIdx = pIdx;
        params.push(productId);
        await prisma.$executeRawUnsafe(
          `UPDATE products SET ${parts.join(', ')} WHERE id = $${whereIdx}::uuid`,
          ...params
        );
      } catch (rawErr) {
        logger.debug('Raw update harvest/land/category failed (columns may not exist):', rawErr?.message);
      }
    }
    
    // Transform response
    const harvestVal = productData.harvestDate ?? null;
    const transformedProduct = {
      id: updatedProduct.id,
      farmerId: updatedProduct.farmerUserId,
      farmer_id: updatedProduct.farmerUserId,
      name: updatedProduct.name,
      nameHi: updatedProduct.name,
      category: productData.category ?? 'OTHER',
      quantity: parseFloat(updatedProduct.stockQty.toString()),
      unit: updatedProduct.unit.toLowerCase(),
      expectedPrice: parseFloat(updatedProduct.price.toString()),
      finalPrice: null,
      status: updatedProduct.status,
      availableForBrowse: updatedProduct.isAvailable && updatedProduct.status === 'PUBLISHED',
      harvestDate: harvestVal,
      land_id: productData.land_id ?? null,
      images: productData.images || [],
      description: productData.description || null,
      createdAt: updatedProduct.createdAt.toISOString(),
      updatedAt: updatedProduct.updatedAt.toISOString()
    };
    
    res.json({
      success: true,
      product: transformedProduct,
      message: 'Product updated successfully'
    });
  } catch (error) {
    logger.error('Error updating product:', error);
    const message = error?.message || 'Failed to update product';
    res.status(500).json({
      success: false,
      error: { message }
    });
  }
});

// Toggle product availability for browsing - Using Prisma (no in-memory storage)
app.put('/api/farmer/:farmerId/products/:productId/availability', async (req, res) => {
  try {
    const { farmerId, productId } = req.params;
    const { availableForBrowse } = req.body;
    
    // Verify product exists and belongs to farmer
    const product = await prisma.product.findFirst({
      where: {
        id: productId,
        farmerUserId: farmerId
      }
    });
    
    if (!product) {
      return res.status(404).json({
        success: false,
        error: { message: 'Product not found' }
      });
    }
    
    // Update product availability using Prisma
    const updatedProduct = await prisma.product.update({
      where: { id: productId },
      data: {
        isAvailable: availableForBrowse,
        status: availableForBrowse ? 'PUBLISHED' : 'DRAFT'
      }
    });
    
    // Transform response
    const transformedProduct = {
      id: updatedProduct.id,
      farmerId: updatedProduct.farmerUserId,
      farmer_id: updatedProduct.farmerUserId,
      name: updatedProduct.name,
      nameHi: updatedProduct.name,
      category: 'OTHER',
      quantity: parseFloat(updatedProduct.stockQty.toString()),
      unit: updatedProduct.unit.toLowerCase(),
      expectedPrice: parseFloat(updatedProduct.price.toString()),
      finalPrice: null,
      status: updatedProduct.status,
      availableForBrowse: updatedProduct.isAvailable && updatedProduct.status === 'PUBLISHED',
      harvestDate: null,
      images: [],
      description: null,
      createdAt: updatedProduct.createdAt.toISOString(),
      updatedAt: updatedProduct.updatedAt.toISOString()
    };
    
    res.json({
      success: true,
      product: transformedProduct,
      message: `Product ${availableForBrowse ? 'made available' : 'hidden'} for browsing`
    });
  } catch (error) {
    logger.error('Error updating product availability:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to update product availability' }
    });
  }
});

// Delete farmer product
app.delete('/api/farmer/:farmerId/products/:productId', async (req, res) => {
  try {
    const { farmerId, productId } = req.params;

    const product = await prisma.product.findFirst({
      where: {
        id: productId,
        farmerUserId: farmerId
      }
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        error: { message: 'Product not found' }
      });
    }

    await prisma.product.delete({
      where: { id: productId }
    });

    res.json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting product:', error);
    res.status(500).json({
      success: false,
      error: { message: error?.message || 'Failed to delete product' }
    });
  }
});

// Get farmer offers (bids on farmer's products) - Using Prisma
app.get('/api/farmer/:farmerId/offers', async (req, res) => {
  try {
    const { farmerId } = req.params;
    const bids = await prisma.bid.findMany({
      where: { farmerUserId: farmerId },
      include: { product: true, buyer: { include: { user: true } } }
    });
    const bidIds = bids.map(b => b.id);
    let paidBidIds = new Set();
    if (bidIds.length > 0) {
      try {
        const placeholders = bidIds.map((_, i) => `$${i + 1}`).join(',');
        const paid = await prisma.$queryRawUnsafe(
          `SELECT bid_id FROM payment_transactions WHERE status = 'SUCCESS' AND bid_id IN (${placeholders})`,
          ...bidIds
        );
        paidBidIds = new Set((paid || []).map(p => p.bid_id).filter(Boolean));
      } catch (e) { logger.debug('payment_transactions check skipped:', e?.message); }
    }
    const farmerOffers = bids.map(b => ({
      id: b.id,
      farmerId: b.farmerUserId,
      productId: b.productId,
      buyerId: b.buyerUserId,
      buyerName: b.buyer?.user?.name || b.buyer?.businessName || 'Unknown',
      productName: b.product?.name || 'Unknown',
      offeredPrice: parseFloat(b.bidPrice?.toString() || 0),
      quantity: parseFloat(b.bidQuantity?.toString() || 0),
      message: b.message,
      status: b.status,
      paymentCompleted: paidBidIds.has(b.id),
      createdAt: b.createdAt?.toISOString?.()
    }));
    res.json({ success: true, offers: farmerOffers, total: farmerOffers.length });
  } catch (error) {
    logger.error('Error fetching farmer offers:', error);
    res.status(500).json({ success: false, error: { message: 'Failed to fetch offers' } });
  }
});

// Respond to offer (accept/reject/counter) - Using Prisma
app.put('/api/farmer/:farmerId/offers/:offerId/respond', async (req, res) => {
  try {
    const { farmerId, offerId } = req.params;
    const { action } = req.body;
    
    const bid = await prisma.bid.findFirst({
      where: { id: offerId, farmerUserId: farmerId }
    });
    
    if (!bid) {
      return res.status(404).json({
        success: false,
        error: { message: 'Offer not found' }
      });
    }
    
    const newStatus = action === 'accept' ? 'ACCEPTED' : action === 'reject' ? 'REJECTED' : null;
    if (!newStatus) {
      return res.status(400).json({
        success: false,
        error: { message: 'Invalid action. Use accept or reject.' }
      });
    }
    
    await prisma.bid.update({
      where: { id: offerId },
      data: { status: newStatus }
    });
    
    if (action === 'accept') {
      await prisma.product.update({
        where: { id: bid.productId },
        data: { status: 'SOLD_OUT', isAvailable: false }
      });
    } else if (action === 'reject') {
      await prisma.product.update({
        where: { id: bid.productId },
        data: { status: 'PUBLISHED' }
      });
    }
    
    res.json({
      success: true,
      message: `Offer ${action}ed successfully`
    });
  } catch (error) {
    logger.error('Error responding to offer:', error);
    res.status(500).json({ success: false, error: { message: 'Failed to respond to offer' } });
  }
});

// Get machinery for farmers - Using Prisma (supplier machinery inventory)
app.get('/api/machinery', async (req, res) => {
  try {
    const machinery = await prisma.supplierMachineryInventory.findMany({
      where: { availabilityStatus: 'AVAILABLE' },
      include: { supplier: true, machineryType: true }
    });
    const transformed = machinery.map(m => ({
      id: m.id,
      providerId: m.supplierUserId,
      name: m.machineryType?.name,
      quantity: m.quantity,
      availability: m.availabilityStatus
    }));
    res.json({ success: true, machinery: transformed, total: transformed.length });
  } catch (error) {
    res.json({ success: true, machinery: [], total: 0 });
  }
});

// Get transport for farmers
app.get('/api/transport', async (req, res) => {
  res.json({ success: true, transport: [], total: 0 });
});

// Get test providers
app.get('/api/test-providers', async (req, res) => {
  res.json({ success: true, providers: [], total: 0 });
});

// Book machinery/transport
app.post('/api/farmer/:farmerId/bookings', (req, res) => {
  const { farmerId } = req.params;
  const { type, itemId, startDate, endDate, totalCost } = req.body;
  
  const booking = {
    id: `booking_${Date.now()}`,
    farmerId,
    type, // 'MACHINERY' or 'TRANSPORT'
    itemId,
    startDate,
    endDate,
    totalCost,
    status: 'CONFIRMED',
    createdAt: new Date().toISOString()
  };
  
  res.status(201).json({
    success: true,
    booking,
    message: `${type} booked successfully`
  });
});

// Get farmer orders (from database)
app.get('/api/farmer/:farmerId/orders', async (req, res) => {
  try {
    const { farmerId } = req.params;
    const dbOrders = await prisma.order.findMany({
      where: { farmerUserId: farmerId, orderType: 'PRODUCE' },
      include: {
        orderItems: { include: { product: true } },
        buyer: { include: { user: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    const ordersForFarmer = dbOrders.map(o => ({
      id: o.id,
      orderNumber: o.orderNumber,
      status: o.status,
      paymentStatus: o.paymentStatus,
      farmerId: o.farmerUserId,
      buyerId: o.buyerUserId,
      buyerName: o.buyer?.user?.name || o.buyer?.businessName || 'Buyer',
      productName: o.orderItems?.[0]?.product?.name || 'Product',
      quantity: o.orderItems?.[0]?.quantity ?? 0,
      agreedPrice: o.orderItems?.[0]?.unitPrice ?? 0,
      totalAmount: o.orderItems?.[0]?.lineTotal ?? 0,
      deliveryDate: o.deliveryDate,
      createdAt: o.createdAt
    }));
    res.json({ success: true, orders: ordersForFarmer, total: ordersForFarmer.length });
  } catch (err) {
    logger.error('Error fetching farmer orders:', err);
    res.status(500).json({ success: false, error: { message: 'Failed to fetch orders' } });
  }
});

// Get test results for farmer
app.get('/api/farmer/:farmerId/test-results', (req, res) => {
  const { farmerId } = req.params;
  const farmerResults = testResults.filter(r => r.farmerId === farmerId);
  
  res.json({
    success: true,
    results: farmerResults,
    total: farmerResults.length
  });
});

// Buyer Portal APIs - Using Prisma (database, not in-memory)

// Get buyer profile
app.get('/api/buyer/:buyerId/profile', async (req, res) => {
  try {
    const { buyerId } = req.params;
    const buyer = await prisma.user.findUnique({
      where: { id: buyerId, role: 'BUYER' },
      include: { buyerProfile: true }
    });
    if (!buyer || !buyer.buyerProfile) {
      return res.status(404).json({ success: false, error: { message: 'Buyer not found' } });
    }
    // Fetch address columns from buyer_profiles (may exist from migration)
    let addressData = {};
    try {
      const rows = await prisma.$queryRawUnsafe(
        `SELECT business_address, village, tehsil, district, state, pincode, contact_person FROM buyer_profiles WHERE user_id = CAST($1 AS uuid)`,
        buyerId
      );
      if (Array.isArray(rows) && rows[0]) {
        addressData = {
          businessAddress: rows[0].business_address || null,
          village: rows[0].village || null,
          tehsil: rows[0].tehsil || null,
          district: rows[0].district || null,
          state: rows[0].state || null,
          pincode: rows[0].pincode || null,
          contactPerson: rows[0].contact_person || null
        };
      }
    } catch (addrErr) {
      logger.debug('Buyer address fetch skipped:', addrErr?.message);
    }
    const buyerWithAddress = {
      ...buyer,
      buyerProfile: buyer.buyerProfile ? { ...buyer.buyerProfile, ...addressData } : buyer.buyerProfile
    };
    res.json({ success: true, buyer: buyerWithAddress });
  } catch (error) {
    logger.error('Error fetching buyer profile:', error);
    res.status(500).json({ success: false, error: { message: 'Failed to fetch profile' } });
  }
});

// Update buyer profile (excluding GST)
app.put('/api/buyer/:buyerId/profile', async (req, res) => {
  try {
    const { buyerId } = req.params;
    const updates = req.body;
    const buyer = await prisma.user.findUnique({
      where: { id: buyerId, role: 'BUYER' },
      include: { buyerProfile: true }
    });
    if (!buyer || !buyer.buyerProfile) {
      return res.status(404).json({ success: false, error: { message: 'Buyer not found' } });
    }
    delete updates.phone;
    delete updates.gst;
    delete updates.gstNumber;
    if (updates.buyerProfile) delete updates.buyerProfile.gstNumber;
    const userUpdates = {};
    if (updates.name !== undefined) userUpdates.name = updates.name;
    if (updates.email !== undefined) userUpdates.email = updates.email || null;
    const profileUpdates = {};
    const bp = updates.buyerProfile || updates;
    if (bp.businessName !== undefined) profileUpdates.businessName = bp.businessName;
    if (bp.businessDomain !== undefined) profileUpdates.businessDomain = bp.businessDomain;
    if (bp.website !== undefined) profileUpdates.website = bp.website;
    if (Object.keys(userUpdates).length > 0) {
      await prisma.user.update({ where: { id: buyerId }, data: userUpdates });
    }
    if (Object.keys(profileUpdates).length > 0) {
      await prisma.buyerProfile.update({
        where: { userId: buyerId },
        data: profileUpdates
      });
    }
    // Update address columns via raw SQL (columns may exist from migration)
    const addressFields = ['businessAddress', 'village', 'tehsil', 'district', 'state', 'pincode', 'contactPerson'];
    const hasAddressUpdates = addressFields.some(f => bp[f] !== undefined);
    if (hasAddressUpdates) {
      try {
        await prisma.$executeRawUnsafe(
          `UPDATE buyer_profiles SET business_address = $1, village = $2, tehsil = $3, district = $4, state = $5, pincode = $6, contact_person = $7 WHERE user_id = CAST($8 AS uuid)`,
          bp.businessAddress ?? null,
          bp.village ?? null,
          bp.tehsil ?? null,
          bp.district ?? null,
          bp.state ?? null,
          bp.pincode ?? null,
          bp.contactPerson ?? null,
          buyerId
        );
      } catch (addrErr) {
        logger.debug('Buyer address update skipped:', addrErr?.message);
      }
    }
    const updated = await prisma.user.findUnique({
      where: { id: buyerId },
      include: { buyerProfile: true }
    });
    let buyerWithAddress = updated;
    try {
      const rows = await prisma.$queryRawUnsafe(
        `SELECT business_address, village, tehsil, district, state, pincode, contact_person FROM buyer_profiles WHERE user_id = CAST($1 AS uuid)`,
        buyerId
      );
      if (Array.isArray(rows) && rows[0]) {
        const addr = { businessAddress: rows[0].business_address, village: rows[0].village, tehsil: rows[0].tehsil, district: rows[0].district, state: rows[0].state, pincode: rows[0].pincode, contactPerson: rows[0].contact_person };
        buyerWithAddress = { ...updated, buyerProfile: updated?.buyerProfile ? { ...updated.buyerProfile, ...addr } : updated?.buyerProfile };
      }
    } catch (_) { /* ignore */ }
    res.json({ success: true, buyer: buyerWithAddress, message: 'Profile updated successfully' });
  } catch (error) {
    logger.error('Error updating buyer profile:', error);
    res.status(500).json({ success: false, error: { message: 'Failed to update profile' } });
  }
});

// Get buyer's selected farmers (from BuyerShortlist)
app.get('/api/buyer/:buyerId/selected-farmers', async (req, res) => {
  try {
    const { buyerId } = req.params;
    const buyer = await prisma.user.findUnique({
      where: { id: buyerId, role: 'BUYER' }
    });
    if (!buyer) {
      return res.status(404).json({ success: false, error: { message: 'Buyer not found' } });
    }
    const shortlists = await prisma.buyerShortlist.findMany({
      where: { buyerUserId: buyerId },
      include: { farmer: { include: { user: true } } }
    });
    const farmers = shortlists.map(s => ({
      id: s.farmerUserId,
      ...s.farmer?.user,
      farmerProfile: s.farmer
    }));
    res.json({ success: true, farmers, total: farmers.length });
  } catch (error) {
    logger.error('Error fetching selected farmers:', error);
    res.status(500).json({ success: false, error: { message: 'Failed to fetch' } });
  }
});

// Add/Remove farmer from buyer's shortlist
app.put('/api/buyer/:buyerId/selected-farmers/:farmerId', async (req, res) => {
  try {
    const { buyerId, farmerId } = req.params;
    const { action } = req.body;
    const buyer = await prisma.user.findUnique({ where: { id: buyerId, role: 'BUYER' } });
    if (!buyer) return res.status(404).json({ success: false, error: { message: 'Buyer not found' } });
    if (action === 'add') {
      try {
        await prisma.buyerShortlist.create({
          data: { buyerUserId: buyerId, farmerUserId: farmerId }
        });
      } catch (e) {
        if (e.code !== 'P2002') throw e; // Ignore duplicate
      }
    } else if (action === 'remove') {
      await prisma.buyerShortlist.deleteMany({
        where: { buyerUserId: buyerId, farmerUserId: farmerId }
      });
    }
    const shortlists = await prisma.buyerShortlist.findMany({
      where: { buyerUserId: buyerId }
    });
    res.json({
      success: true,
      selectedFarmers: shortlists.map(s => s.farmerUserId),
      message: `Farmer ${action}ed successfully`
    });
  } catch (error) {
    logger.error('Error updating shortlist:', error);
    res.status(500).json({ success: false, error: { message: 'Failed to update' } });
  }
});

// Get buyer's cart - Using Prisma
app.get('/api/buyer/:buyerId/cart', async (req, res) => {
  try {
    const { buyerId } = req.params;
    const buyer = await prisma.user.findUnique({ where: { id: buyerId, role: 'BUYER' } });
    if (!buyer) {
      return res.status(404).json({ success: false, error: { message: 'Buyer not found' } });
    }
    const cart = await prisma.cart.findFirst({
      where: { ownerUserId: buyerId, status: 'ACTIVE' },
      include: { items: true }
    });
    res.json({
      success: true,
      cart: cart?.items || [],
      total: cart?.items?.length || 0
    });
  } catch (error) {
    logger.error('Error fetching cart:', error);
    res.status(500).json({ success: false, error: { message: 'Failed to fetch cart' } });
  }
});

// Get buyer's bids - Using Prisma
// Record payment (reference-only, no sensitive data - stores hashed reference)
// When bidId provided: creates Order for farmer visibility (status: Final Order Pending, payment: PAID)
app.post('/api/payments/record', async (req, res) => {
  try {
    const { bidId, orderId, amount, currency = 'INR', payerUserId, payerRole, clientRef } = req.body;
    if (!amount || !payerUserId || !payerRole) {
      return res.status(400).json({ success: false, error: { message: 'Missing required: amount, payerUserId, payerRole' } });
    }
    const ref = clientRef || `sim_${crypto.randomUUID()}_${Date.now()}`;
    const refHash = crypto.createHash('sha256').update(ref).digest('hex');
    const amt = typeof amount === 'number' ? amount : parseFloat(amount);
    if (isNaN(amt) || amt <= 0) {
      return res.status(400).json({ success: false, error: { message: 'Invalid amount' } });
    }
    await prisma.$executeRawUnsafe(`
      INSERT INTO payment_transactions (id, reference_hash, bid_id, order_id, amount, currency, status, provider, payer_user_id, payer_role)
      VALUES (gen_random_uuid(), $1, $2::uuid, $3::uuid, $4, $5, 'SUCCESS', 'SIMULATED', $6::uuid, $7)
    `, refHash, bidId || null, orderId || null, amt, currency, payerUserId, payerRole);

    // Create Order when payment is for a bid - farmer sees it in Orders tab
    if (bidId) {
      const bid = await prisma.bid.findUnique({
        where: { id: bidId },
        include: { product: true, farmer: { include: { user: true } }, buyer: { include: { user: true } } }
      });
      if (bid && bid.status === 'ACCEPTED') {
        const orderNum = `ORD-${Date.now()}-${bidId.slice(-6)}`;
        const qty = parseFloat(bid.bidQuantity?.toString() || 0);
        const unitPrice = parseFloat(bid.bidPrice?.toString() || 0);
        const lineTotal = qty * unitPrice;
        const order = await prisma.order.create({
          data: {
            orderNumber: orderNum,
            buyerUserId: bid.buyerUserId,
            farmerUserId: bid.farmerUserId,
            orderType: 'PRODUCE',
            status: 'CONFIRMED',
            paymentStatus: 'PAID'
          }
        });
        await prisma.orderItem.create({
          data: {
            orderId: order.id,
            productId: bid.productId,
            farmerUserId: bid.farmerUserId,
            quantity: qty,
            unitPrice,
            lineTotal,
            status: 'CREATED'
          }
        });
      }
    }

    res.json({ success: true, message: 'Payment recorded (reference stored)', paymentId: refHash.substring(0, 16) + '...' });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ success: false, error: { message: 'Duplicate payment reference' } });
    }
    logger.error('Error recording payment:', err);
    res.status(500).json({ success: false, error: { message: 'Failed to record payment' } });
  }
});

app.get('/api/buyer/:buyerId/bids', async (req, res) => {
  try {
    const { buyerId } = req.params;
    const buyer = await prisma.user.findUnique({ where: { id: buyerId, role: 'BUYER' } });
    if (!buyer) {
      return res.status(404).json({ success: false, error: { message: 'Buyer not found' } });
    }
    const buyerBids = await prisma.bid.findMany({
      where: { buyerUserId: buyerId },
      include: { product: true, farmer: { include: { user: true } } }
    });
    const transformed = buyerBids.map(b => ({
      id: b.id,
      buyerId: b.buyerUserId,
      farmerId: b.farmerUserId,
      productId: b.productId,
      offeredPrice: parseFloat(b.bidPrice.toString()),
      bidPrice: parseFloat(b.bidPrice.toString()),
      quantity: parseFloat(b.bidQuantity.toString()),
      message: b.message,
      status: b.status,
      createdAt: b.createdAt.toISOString(),
      product: b.product,
      farmer: b.farmer,
      farmerName: b.farmer?.user?.name || 'Farmer',
      productName: b.product?.name || 'Product'
    }));
    res.json({ success: true, bids: transformed, total: transformed.length });
  } catch (error) {
    logger.error('Error fetching bids:', error);
    res.status(500).json({ success: false, error: { message: 'Failed to fetch bids' } });
  }
});

app.post('/api/buyer/:buyerId/bids', async (req, res) => {
  try {
    const { buyerId } = req.params;
    const { productId, farmerId, offeredPrice, quantity, message } = req.body;
    
    if (!productId || !farmerId || !offeredPrice || !quantity) {
      return res.status(400).json({
        success: false,
        error: { message: 'Missing required fields: productId, farmerId, offeredPrice, and quantity are required' }
      });
    }
    const price = typeof offeredPrice === 'number' ? offeredPrice : parseFloat(offeredPrice);
    const qty = typeof quantity === 'number' ? quantity : parseFloat(quantity);
    if (isNaN(price) || price <= 0 || isNaN(qty) || qty <= 0) {
      return res.status(400).json({
        success: false,
        error: { message: 'offeredPrice and quantity must be positive numbers' }
      });
    }
    
    const buyer = await prisma.user.findUnique({ where: { id: buyerId, role: 'BUYER' }, include: { buyerProfile: true } });
    if (!buyer) return res.status(404).json({ success: false, error: { message: 'Buyer not found' } });
    
    const existingBid = await prisma.bid.findFirst({
      where: {
        buyerUserId: buyerId,
        productId,
        status: { in: ['PLACED', 'COUNTERED'] }
      }
    });
    if (existingBid) {
      return res.status(409).json({
        success: false,
        error: { message: 'Bid already placed for this product. Please wait before placing a new bid.' }
      });
    }
    
    const bid = await prisma.bid.create({
      data: {
        buyerUserId: buyerId,
        farmerUserId: farmerId,
        productId,
        bidPrice: price,
        bidQuantity: qty,
        message: message || null,
        status: 'PLACED'
      },
      include: { product: true, farmer: true }
    });
    
    await prisma.product.update({
      where: { id: productId },
      data: { status: 'SUSPENDED' }
    });
    
    res.status(201).json({
      success: true,
      bid: {
        id: bid.id,
        buyerId: bid.buyerUserId,
        farmerId: bid.farmerUserId,
        productId: bid.productId,
        offeredPrice: parseFloat(bid.bidPrice.toString()),
        quantity: parseFloat(bid.bidQuantity.toString()),
        message: bid.message,
        status: bid.status,
        createdAt: bid.createdAt.toISOString()
      },
      message: 'Bid placed successfully'
    });
  } catch (error) {
    logger.error('Error placing bid:', error);
    res.status(500).json({ success: false, error: { message: 'Failed to place bid' } });
  }
});

// Get all farmers for browsing - bid-ready products (PUBLISHED + is_available)
app.get('/api/farmers', async (req, res) => {
  try {
    let availableFarmers = [];
    try {
      const farmers = await prisma.user.findMany({
        where: { role: 'FARMER' },
        include: {
          farmerProfile: {
            include: {
              products: {
                where: { status: { in: ['PUBLISHED', 'SUSPENDED'] }, isAvailable: true }
              }
            }
          }
        }
      });
      const farmerProducts = (fp) => (fp?.products || []).map(p => ({
        id: p.id,
        farmerId: p.farmerUserId,
        name: p.name,
        quantity: parseFloat(p.stockQty?.toString() || 0),
        unit: p.unit?.toLowerCase(),
        expectedPrice: parseFloat(p.price?.toString() || 0),
        status: p.status,
        availableForBrowse: p.isAvailable && p.status === 'PUBLISHED'
      }));
      availableFarmers = farmers
        .filter(f => f.farmerProfile && (f.farmerProfile.products?.length || 0) > 0)
      .map(farmer => ({
        id: farmer.id,
        name: farmer.name,
        village: farmer.farmerProfile?.village,
        tehsil: farmer.farmerProfile?.tehsil,
        district: farmer.farmerProfile?.district,
        state: farmer.farmerProfile?.state,
        products: farmerProducts(farmer.farmerProfile),
        createdAt: farmer.createdAt
      }));
    } catch (prismaErr) {
      logger.debug('Prisma farmers query failed, trying raw SQL:', prismaErr?.message);
      // Fallback: raw SQL to fetch farmers with bid-ready products
      const rows = await prisma.$queryRawUnsafe(
        `SELECT u.id, u.name, fp.village, fp.tehsil, fp.district, fp.state, p.id as product_id, p.name as product_name, p.price, p.stock_qty, p.unit, p.status
         FROM users u
         JOIN farmer_profiles fp ON fp.user_id = u.id
         JOIN products p ON p.farmer_user_id = fp.user_id
         WHERE u.role = 'FARMER' AND p.is_available = true AND p.status IN ('PUBLISHED', 'SUSPENDED')
         ORDER BY u.id, p.created_at DESC`
      );
      const farmerMap = new Map();
      (rows || []).forEach(r => {
        const fid = r.id;
        if (!farmerMap.has(fid)) {
          farmerMap.set(fid, { id: fid, name: r.name, village: r.village, tehsil: r.tehsil, district: r.district, state: r.state, products: [] });
        }
        farmerMap.get(fid).products.push({
          id: r.product_id,
          farmerId: fid,
          name: r.product_name,
          quantity: parseFloat(r.stock_qty || 0),
          unit: (r.unit || 'kg').toLowerCase(),
          expectedPrice: parseFloat(r.price || 0),
          status: r.status,
          availableForBrowse: true
        });
      });
      availableFarmers = Array.from(farmerMap.values());
    }
    res.json({ success: true, farmers: availableFarmers, total: availableFarmers.length });
  } catch (error) {
    logger.error('Error fetching farmers:', error);
    res.status(500).json({ success: false, error: { message: 'Failed to fetch farmers' } });
  }
});

// Get suppliers with available services
// Supplier Portal APIs - Using Prisma (database, not in-memory)

// Get supplier profile
app.get('/api/supplier/:supplierId/profile', async (req, res) => {
  try {
    const { supplierId } = req.params;
    const supplier = await prisma.user.findUnique({
      where: { id: supplierId, role: 'SUPPLIER' },
      include: { supplierProfile: { include: { supplierTypes: { include: { typeMaster: true } } } } }
    });
    if (!supplier || !supplier.supplierProfile) {
      return res.status(404).json({ success: false, error: { message: 'Supplier not found' } });
    }
    // Fetch address columns from supplier_profiles (may exist from migration)
    let addressData = {};
    try {
      const rows = await prisma.$queryRawUnsafe(
        `SELECT business_address, village, tehsil, district, state, pincode FROM supplier_profiles WHERE user_id = CAST($1 AS uuid)`,
        supplierId
      );
      if (Array.isArray(rows) && rows[0]) {
        addressData = {
          businessAddress: rows[0].business_address || null,
          village: rows[0].village || null,
          tehsil: rows[0].tehsil || null,
          district: rows[0].district || null,
          state: rows[0].state || null,
          pincode: rows[0].pincode || null
        };
      }
    } catch (addrErr) {
      logger.debug('Supplier address fetch skipped:', addrErr?.message);
    }
    const supplierWithAddress = {
      ...supplier,
      supplierProfile: supplier.supplierProfile ? { ...supplier.supplierProfile, ...addressData } : supplier.supplierProfile
    };
    res.json({ success: true, supplier: supplierWithAddress });
  } catch (error) {
    logger.error('Error fetching supplier profile:', error);
    res.status(500).json({ success: false, error: { message: 'Failed to fetch profile' } });
  }
});

// Update supplier profile
app.put('/api/supplier/:supplierId/profile', async (req, res) => {
  try {
    const { supplierId } = req.params;
    const updates = req.body;
    const supplier = await prisma.user.findUnique({
      where: { id: supplierId, role: 'SUPPLIER' },
      include: { supplierProfile: true }
    });
    if (!supplier || !supplier.supplierProfile) {
      return res.status(404).json({ success: false, error: { message: 'Supplier not found' } });
    }
    delete updates.phone;
    delete updates.gst;
    if (updates.supplierProfile) delete updates.supplierProfile.gstNumber;
    const userUpdates = {};
    if (updates.name !== undefined) userUpdates.name = updates.name;
    if (updates.email !== undefined) userUpdates.email = updates.email || null;
    const profileUpdates = {};
    const sp = updates.supplierProfile || updates;
    if (sp.organizationName !== undefined) profileUpdates.organizationName = sp.organizationName;
    if (sp.contactName !== undefined) profileUpdates.contactName = sp.contactName;
    if (sp.website !== undefined) profileUpdates.website = sp.website;
    if (Object.keys(userUpdates).length > 0) {
      await prisma.user.update({ where: { id: supplierId }, data: userUpdates });
    }
    if (Object.keys(profileUpdates).length > 0) {
      await prisma.supplierProfile.update({
        where: { userId: supplierId },
        data: profileUpdates
      });
    }
    // Update address columns via raw SQL (columns may exist from migration)
    const addressFields = ['businessAddress', 'village', 'tehsil', 'district', 'state', 'pincode'];
    const hasAddressUpdates = addressFields.some(f => sp[f] !== undefined);
    if (hasAddressUpdates) {
      try {
        await prisma.$executeRawUnsafe(
          `UPDATE supplier_profiles SET business_address = $1, village = $2, tehsil = $3, district = $4, state = $5, pincode = $6 WHERE user_id = CAST($7 AS uuid)`,
          sp.businessAddress ?? null,
          sp.village ?? null,
          sp.tehsil ?? null,
          sp.district ?? null,
          sp.state ?? null,
          sp.pincode ?? null,
          supplierId
        );
      } catch (addrErr) {
        logger.debug('Supplier address update skipped:', addrErr?.message);
      }
    }
    const updated = await prisma.user.findUnique({
      where: { id: supplierId },
      include: { supplierProfile: true }
    });
    // Re-fetch with address for response
    let supplierWithAddress = updated;
    try {
      const rows = await prisma.$queryRawUnsafe(
        `SELECT business_address, village, tehsil, district, state, pincode FROM supplier_profiles WHERE user_id = CAST($1 AS uuid)`,
        supplierId
      );
      if (Array.isArray(rows) && rows[0]) {
        const addr = { businessAddress: rows[0].business_address, village: rows[0].village, tehsil: rows[0].tehsil, district: rows[0].district, state: rows[0].state, pincode: rows[0].pincode };
        supplierWithAddress = { ...updated, supplierProfile: updated?.supplierProfile ? { ...updated.supplierProfile, ...addr } : updated?.supplierProfile };
      }
    } catch (_) { /* ignore */ }
    res.json({ success: true, supplier: supplierWithAddress, message: 'Profile updated successfully' });
  } catch (error) {
    logger.error('Error updating supplier profile:', error);
    res.status(500).json({ success: false, error: { message: 'Failed to update profile' } });
  }
});

// Get supplier machinery
app.get('/api/supplier/:supplierId/machinery', async (req, res) => {
  try {
    const { supplierId } = req.params;
    const supplier = await prisma.user.findUnique({
      where: { id: supplierId, role: 'SUPPLIER' }
    });
    if (!supplier) {
      return res.status(404).json({ success: false, error: { message: 'Supplier not found' } });
    }
    const machinery = await prisma.supplierMachineryInventory.findMany({
      where: { supplierUserId: supplierId },
      include: { machineryType: { include: { category: true } } }
    });
    const transformed = machinery.map(m => ({
      id: m.id,
      type: m.machineryType?.name,
      category: m.machineryType?.category?.code || 'FARMING',
      quantity: m.quantity,
      availability: m.availabilityStatus,
      capacityTons: m.capacityTons ? parseFloat(m.capacityTons.toString()) : null,
      refrigeration: m.refrigeration
    }));
    res.json({ success: true, machinery: transformed, total: transformed.length });
  } catch (error) {
    logger.error('Error fetching supplier machinery:', error);
    res.status(500).json({ success: false, error: { message: 'Failed to fetch machinery' } });
  }
});

app.get('/api/suppliers', async (req, res) => {
  try {
    const suppliers = await prisma.user.findMany({
      where: { role: 'SUPPLIER' },
      include: { supplierProfile: { include: { supplierTypes: { include: { typeMaster: true } } } } }
    });
    const availableSuppliers = suppliers
      .filter(s => s.supplierProfile && s.supplierProfile.supplierTypes?.length > 0)
      .map(supplier => ({
        id: supplier.id,
        name: supplier.name || supplier.supplierProfile?.organizationName,
        organizationName: supplier.supplierProfile?.organizationName,
        contactName: supplier.supplierProfile?.contactName,
        phone: supplier.phone,
        email: supplier.email,
        gstNumber: supplier.supplierProfile?.gstNumber || supplier.gst,
        businessAddress: supplier.supplierProfile?.address?.line1,
        village: null,
        tehsil: null,
        district: null,
        state: supplier.supplierProfile?.state,
        pincode: supplier.supplierProfile?.pincode,
        supplierTypes: supplier.supplierProfile?.supplierTypes?.map(st => st.typeMaster?.code) || [],
        createdAt: supplier.createdAt
      }));
    res.json({
      success: true,
      suppliers: availableSuppliers,
      total: availableSuppliers.length
    });
  } catch (error) {
    logger.error('Error fetching suppliers:', error);
    res.status(500).json({ success: false, error: { message: 'Failed to fetch suppliers' } });
  }
});

// Get all users - versioned endpoint - Using Prisma
const handleGetUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, role: true, name: true, phone: true, email: true, createdAt: true }
    });
    res.json({
      success: true,
      users,
      total: users.length,
      farmers: users.filter(u => u.role === 'FARMER').length,
      buyers: users.filter(u => u.role === 'BUYER').length
    });
  } catch (error) {
    logger.error('Error fetching users:', error);
    res.status(500).json({ success: false, error: { message: 'Failed to fetch users' } });
  }
};

// Register users endpoint at both /api/v1/* and /api/*
registerVersionedRoute('get', '/users', handleGetUsers);

// Sample products endpoint - Using Prisma
app.get('/api/products', async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      where: { status: 'PUBLISHED', isAvailable: true },
      include: { farmer: true }
    });
    const transformed = products.map(p => ({
      id: p.id,
      name: p.name,
      price: parseFloat(p.price.toString()),
      quantity: parseFloat(p.stockQty.toString()),
      farmerId: p.farmerUserId,
      availableForBrowse: true
    }));
    res.json({ success: true, products: transformed, total: transformed.length });
  } catch (error) {
    logger.error('Error fetching products:', error);
    res.status(500).json({ success: false, error: { message: 'Failed to fetch products' } });
  }
});

// Root endpoint - Using Prisma for stats
app.get('/', async (req, res) => {
  try {
    const [userCount, productCount] = await Promise.all([
      prisma.user.count(),
      prisma.product.count()
    ]);
    const farmers = await prisma.user.count({ where: { role: 'FARMER' } });
    const buyers = await prisma.user.count({ where: { role: 'BUYER' } });
    res.json({
      message: '🌱 Agricultural Platform API v3.0 - Enhanced Farmer Portal',
      status: 'running',
      version: '3.0.0',
      features: [
        'Complete Farmer Portal with Profile Management',
        'Product Management & Availability Control',
        'Offers & Bidding System with Negotiation',
        'Machinery & Transport Booking',
        'Quality Testing & Results',
        'Order Management & Status Tracking',
        'Enhanced Buyer Portal',
        'Payment Integration Ready'
      ],
      stats: {
        registeredUsers: userCount,
        farmers,
        buyers,
        products: productCount
      },
      testData: {
        farmerLogin: { phone: '+919876543210', otp: 'any 6 digits' },
        buyerLogin: { gst: '09AAACH7409R1ZZ', password: 'SecurePassword123!' }
      }
    });
  } catch (error) {
    res.json({ message: '🌱 Agricultural Platform API v3.0', status: 'running', version: '3.0.0' });
  }
});

// Serve OpenAPI specification
const fs = require('fs');
const path = require('path');
app.get('/api/openapi.yaml', (req, res) => {
  const openapiPath = path.join(__dirname, 'openapi.yaml');
  res.setHeader('Content-Type', 'application/yaml');
  res.sendFile(openapiPath);
});

// Admin endpoints
app.post('/api/admin/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Log for debugging
    console.log('🔐 Admin login attempt:', { 
      email, 
      emailLength: email?.length,
      passwordLength: password?.length,
      passwordChars: password?.split('').map((c, i) => `${i}:${c.charCodeAt(0)}`).join(',')
    });
    
    // Trim and normalize email
    const normalizedEmail = email?.trim().toLowerCase();
    const normalizedPassword = password?.trim();
    
    console.log('🔍 After normalization:', {
      normalizedEmail,
      normalizedPassword,
      normalizedPasswordLength: normalizedPassword?.length,
      expectedPassword: 'admin123',
      passwordsMatch: normalizedPassword === 'admin123'
    });
    
    // Simple admin check (in production, use database)
    if (normalizedEmail === 'admin@agricultural-platform.com' && normalizedPassword === 'admin123') {
      const admin = {
        id: 'admin_001',
        role: 'ADMIN',
        email: normalizedEmail,
        name: 'Admin User',
        isActive: true
      };
      
      console.log('✅ Admin login successful');
      res.json({
        success: true,
        admin: admin,
        token: `jwt_token_admin_${Date.now()}`,
        message: 'Admin login successful'
      });
    } else {
      console.log('❌ Admin login failed - invalid credentials', {
        emailMatch: normalizedEmail === 'admin@agricultural-platform.com',
        passwordMatch: normalizedPassword === 'admin123',
        receivedPassword: normalizedPassword,
        expectedPassword: 'admin123'
      });
      res.status(401).json({
        success: false,
        error: { message: 'Invalid email or password' }
      });
    }
  } catch (error) {
    console.error('❌ Admin login error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Admin login failed' }
    });
  }
});

app.get('/api/admin/dashboard', async (req, res) => {
  try {
    const [userCount, productCount, bidCount, orderCount] = await Promise.all([
      prisma.user.count(),
      prisma.product.count(),
      prisma.bid.count(),
      prisma.order.count()
    ]);
    const farmers = await prisma.user.count({ where: { role: 'FARMER' } });
    const buyers = await prisma.user.count({ where: { role: 'BUYER' } });
    const suppliers = await prisma.user.count({ where: { role: 'SUPPLIER' } });
    res.json({
      success: true,
      data: {
        users: {
          total: userCount,
          farmers,
          buyers,
          suppliers
        },
        products: { total: productCount },
        bids: { total: bidCount },
        orders: { total: orderCount }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch dashboard data' }
    });
  }
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: {
      message: 'API endpoint not found',
      path: req.originalUrl
    }
  });
});

// Start server
const port = process.env.PORT || 3001;
app.listen(port, '0.0.0.0', () => {
  console.log('🎉========================================🎉');
  console.log('🌱 Agricultural Platform API v3.0 Started!');
  console.log('🎉========================================🎉');
  console.log(`📡 Server running on port ${port}`);
  console.log(`🔍 Health check: http://localhost:${port}/health`);
  console.log('');
  console.log('🆕 Enhanced Features:');
  console.log('• Complete Farmer Portal');
  console.log('• Product Management System');
  console.log('• Offers & Bidding with Negotiation');
  console.log('• Machinery & Transport Booking');
  console.log('• Quality Testing Integration');
  console.log('• Order Management');
  console.log('• Enhanced Buyer Portal');
  console.log('');
  console.log('🧪 Test Data Available:');
  console.log('• Farmer Login: +919876543210 (any OTP)');
  console.log('• Buyer Login: 09AAACH7409R1ZZ / SecurePassword123!');
  console.log('• Sample products, offers, machinery, transport');
  console.log('');
});
