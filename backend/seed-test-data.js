#!/usr/bin/env node

/**
 * Seed Test Data Script
 * Creates test data for Farmers, Buyers, and Suppliers
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  red: '\x1b[31m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function seedTestData() {
  try {
    log('🌱 Starting test data seeding...', 'cyan');
    log('');

    // ==========================================================
    // STEP 1: Create Master Data (Location Hierarchy)
    // ==========================================================
    log('📍 Creating location master data...', 'blue');
    
    // Create or get India
    let country = await prisma.country.findFirst({
      where: { name: 'India' }
    });
    
    if (!country) {
      country = await prisma.country.create({
        data: {
          name: 'India',
          isoCode: 'IN'
        }
      });
    }

    // Create or get Uttar Pradesh state
    let state = await prisma.state.findFirst({
      where: { 
        countryId: country.id,
        name: 'Uttar Pradesh'
      }
    });

    if (!state) {
      state = await prisma.state.create({
        data: {
          countryId: country.id,
          name: 'Uttar Pradesh',
          lgdCode: '09'
        }
      });
    }

    // Create or get Meerut district
    let district = await prisma.district.findFirst({
      where: {
        stateId: state.id,
        name: 'Meerut'
      }
    });

    if (!district) {
      district = await prisma.district.create({
        data: {
          stateId: state.id,
          name: 'Meerut',
          lgdCode: '091'
        }
      });
    }

    // Create or get tehsil
    let tehsil = await prisma.tehsil.findFirst({
      where: {
        districtId: district.id,
        name: 'Meerut'
      }
    });

    if (!tehsil) {
      tehsil = await prisma.tehsil.create({
        data: {
          districtId: district.id,
          name: 'Meerut',
          lgdCode: '09101'
        }
      });
    }

    // Create or get village
    let village = await prisma.village.findFirst({
      where: {
        tehsilId: tehsil.id,
        name: 'Rampur'
      }
    });

    if (!village) {
      village = await prisma.village.create({
        data: {
          tehsilId: tehsil.id,
          name: 'Rampur',
          lgdCode: '09101001'
        }
      });
    }

    // Create address
    const address = await prisma.address.create({
      data: {
        countryId: country.id,
        stateId: state.id,
        districtId: district.id,
        tehsilId: tehsil.id,
        villageId: village.id,
        line1: 'Farm House, Village Rampur',
        pincode: '250001',
        latitude: 28.9845,
        longitude: 77.7064
      }
    });

    log('✅ Location master data created', 'green');
    log('');

    // ==========================================================
    // STEP 2: Create Farmers
    // ==========================================================
    log('👨‍🌾 Creating farmers...', 'blue');

    // Helper function to encrypt Aadhaar (base64 encoding)
    const encryptAadhaar = (aadhaar) => {
      return Buffer.from(aadhaar).toString('base64');
    };

    // Create additional addresses for farmers
    const farmerAddress1 = await prisma.address.create({
      data: {
        countryId: country.id,
        stateId: state.id,
        districtId: district.id,
        tehsilId: tehsil.id,
        villageId: village.id,
        line1: 'Farm House, Village Rampur',
        pincode: '250001',
        latitude: 28.9845,
        longitude: 77.7064
      }
    });

    const farmerAddress2 = await prisma.address.create({
      data: {
        countryId: country.id,
        stateId: state.id,
        districtId: district.id,
        tehsilId: tehsil.id,
        villageId: village.id,
        line1: 'Village Baraut',
        pincode: '250609',
        latitude: 28.9950,
        longitude: 77.7100
      }
    });

    const farmerAddress3 = await prisma.address.create({
      data: {
        countryId: country.id,
        stateId: state.id,
        districtId: district.id,
        tehsilId: tehsil.id,
        villageId: village.id,
        line1: 'Village Modinagar',
        pincode: '201204',
        latitude: 28.8350,
        longitude: 77.5800
      }
    });

    // Aadhaar numbers (12 digits each)
    const aadhaar1 = '123456789012';
    const aadhaar2 = '234567890123';
    const aadhaar3 = '345678901234';

    const farmer1 = await prisma.user.create({
      data: {
        role: 'FARMER',
        name: 'Ravi Kumar',
        phone: '+919876543210',
        email: 'ravi.kumar@farmer.com',
        phoneVerified: true,
        emailVerified: true,
        dateOfBirth: new Date('1985-05-15'),
        aadhaarEncrypted: encryptAadhaar(aadhaar1),
        farmerProfile: {
          create: {
            village: 'Rampur',
            tehsil: 'Meerut',
            district: 'Meerut',
            state: 'Uttar Pradesh',
            pincode: '250001',
            about: 'Organic farming specialist with 10+ years experience. Growing wheat, rice, and vegetables.',
            mainRoadConnectivity: true,
            landAreaValue: 5.5,
            landAreaUnit: 'HECTARE',
            irrigationSource: 'CANAL',
            ownershipType: 'OWNED',
            fullName: 'Ravi Kumar',
            dob: new Date('1985-05-15'),
            aadhaarEnc: Buffer.from(aadhaar1),
            aadhaarLast4: aadhaar1.slice(-4),
            primaryAddressId: farmerAddress1.id
          }
        }
      },
      include: { farmerProfile: true }
    });

    const farmer2 = await prisma.user.create({
      data: {
        role: 'FARMER',
        name: 'Suresh Singh',
        phone: '+919876543211',
        email: 'suresh.singh@farmer.com',
        phoneVerified: true,
        dateOfBirth: new Date('1978-03-20'),
        aadhaarEncrypted: encryptAadhaar(aadhaar2),
        farmerProfile: {
          create: {
            village: 'Baraut',
            tehsil: 'Baghpat',
            district: 'Baghpat',
            state: 'Uttar Pradesh',
            pincode: '250609',
            about: 'Traditional farmer growing sugarcane and wheat. 15 years of farming experience.',
            mainRoadConnectivity: false,
            landAreaValue: 8.0,
            landAreaUnit: 'HECTARE',
            irrigationSource: 'TUBE_WELL',
            ownershipType: 'OWNED',
            fullName: 'Suresh Singh',
            dob: new Date('1978-03-20'),
            aadhaarEnc: Buffer.from(aadhaar2),
            aadhaarLast4: aadhaar2.slice(-4),
            primaryAddressId: farmerAddress2.id
          }
        }
      },
      include: { farmerProfile: true }
    });

    const farmer3 = await prisma.user.create({
      data: {
        role: 'FARMER',
        name: 'Priya Devi',
        phone: '+919876543212',
        email: 'priya.devi@farmer.com',
        phoneVerified: true,
        dateOfBirth: new Date('1990-08-10'),
        aadhaarEncrypted: encryptAadhaar(aadhaar3),
        farmerProfile: {
          create: {
            village: 'Modinagar',
            tehsil: 'Modinagar',
            district: 'Ghaziabad',
            state: 'Uttar Pradesh',
            pincode: '201204',
            about: 'Women farmer growing vegetables and fruits. Focus on organic produce.',
            mainRoadConnectivity: true,
            landAreaValue: 3.0,
            landAreaUnit: 'HECTARE',
            irrigationSource: 'RAINWATER',
            ownershipType: 'OWNED',
            fullName: 'Priya Devi',
            dob: new Date('1990-08-10'),
            aadhaarEnc: Buffer.from(aadhaar3),
            aadhaarLast4: aadhaar3.slice(-4),
            primaryAddressId: farmerAddress3.id
          }
        }
      },
      include: { farmerProfile: true }
    });

    log(`✅ Created 3 farmers: ${farmer1.name}, ${farmer2.name}, ${farmer3.name}`, 'green');
    log('');

    // ==========================================================
    // STEP 3: Create Products for Farmers
    // ==========================================================
    log('🌾 Creating products...', 'blue');

    const products = [
      // Farmer 1 products
      {
        farmerUserId: farmer1.id,
        name: 'Wheat',
        price: 4000,
        unit: 'QUINTAL',
        stockQty: 60,
        isAvailable: true,
        status: 'PUBLISHED'
      },
      {
        farmerUserId: farmer1.id,
        name: 'Basmati Rice',
        price: 5500,
        unit: 'QUINTAL',
        stockQty: 40,
        isAvailable: true,
        status: 'PUBLISHED'
      },
      {
        farmerUserId: farmer1.id,
        name: 'Tomatoes',
        price: 30,
        unit: 'KG',
        stockQty: 500,
        isAvailable: true,
        status: 'PUBLISHED'
      },
      // Farmer 2 products
      {
        farmerUserId: farmer2.id,
        name: 'Sugarcane',
        price: 3500,
        unit: 'TON',
        stockQty: 25,
        isAvailable: true,
        status: 'PUBLISHED'
      },
      {
        farmerUserId: farmer2.id,
        name: 'Wheat',
        price: 3800,
        unit: 'QUINTAL',
        stockQty: 50,
        isAvailable: true,
        status: 'PUBLISHED'
      },
      // Farmer 3 products
      {
        farmerUserId: farmer3.id,
        name: 'Potatoes',
        price: 25,
        unit: 'KG',
        stockQty: 800,
        isAvailable: true,
        status: 'PUBLISHED'
      },
      {
        farmerUserId: farmer3.id,
        name: 'Onions',
        price: 35,
        unit: 'KG',
        stockQty: 600,
        isAvailable: true,
        status: 'PUBLISHED'
      },
      {
        farmerUserId: farmer3.id,
        name: 'Mangoes',
        price: 80,
        unit: 'KG',
        stockQty: 200,
        isAvailable: true,
        status: 'PUBLISHED'
      }
    ];

    const createdProducts = [];
    for (const productData of products) {
      const product = await prisma.product.create({
        data: productData
      });
      createdProducts.push(product);
    }

    log(`✅ Created ${createdProducts.length} products`, 'green');
    log('');

    // ==========================================================
    // STEP 4: Create Buyers
    // ==========================================================
    log('🏢 Creating buyers...', 'blue');

    // Create addresses for buyers
    const buyerAddress1 = await prisma.address.create({
      data: {
        countryId: country.id,
        stateId: state.id,
        districtId: district.id,
        line1: '123 Business Park, Sector 18',
        line2: 'Noida',
        pincode: '201301',
        latitude: 28.6139,
        longitude: 77.2090
      }
    });

    const buyerAddress2 = await prisma.address.create({
      data: {
        countryId: country.id,
        stateId: state.id,
        districtId: district.id,
        line1: '456 Market Street',
        line2: 'Ghaziabad',
        pincode: '201001',
        latitude: 28.6692,
        longitude: 77.4538
      }
    });

    const buyerAddress3 = await prisma.address.create({
      data: {
        countryId: country.id,
        stateId: state.id,
        districtId: district.id,
        line1: '789 Industrial Area',
        line2: 'Meerut',
        pincode: '250002',
        latitude: 28.9845,
        longitude: 77.7064
      }
    });

    // Aadhaar numbers for buyers
    const buyerAadhaar1 = '456789012345';
    const buyerAadhaar2 = '567890123456';
    const buyerAadhaar3 = '678901234567';

    const buyer1 = await prisma.user.create({
      data: {
        role: 'BUYER',
        name: 'AgriTrade Solutions Pvt Ltd',
        phone: '+919876543220',
        email: 'contact@agritrade.com',
        gstNumber: '09AAACH7409R1ZZ',
        phoneVerified: true,
        emailVerified: true,
        passwordHash: await bcrypt.hash('Buyer123!', 10),
        dateOfBirth: new Date('1980-01-15'),
        aadhaarEncrypted: encryptAadhaar(buyerAadhaar1),
        buyerProfile: {
          create: {
            fullName: 'Rajesh Sharma',
            dob: new Date('1980-01-15'),
            businessName: 'AgriTrade Solutions Pvt Ltd',
            gstNumber: '09AAACH7409R1ZZ',
            businessDomain: 'Agricultural Commodities Trading',
            website: 'https://agritrade.com',
            addressId: buyerAddress1.id,
            aadhaarEnc: Buffer.from(buyerAadhaar1),
            aadhaarLast4: buyerAadhaar1.slice(-4)
          }
        }
      },
      include: { buyerProfile: true }
    });

    const buyer2 = await prisma.user.create({
      data: {
        role: 'BUYER',
        name: 'Fresh Farm Direct',
        phone: '+919876543221',
        email: 'info@freshfarmdirect.com',
        gstNumber: '09AAACH7409R2ZZ',
        phoneVerified: true,
        emailVerified: true,
        dateOfBirth: new Date('1985-06-20'),
        aadhaarEncrypted: encryptAadhaar(buyerAadhaar2),
        buyerProfile: {
          create: {
            fullName: 'Anita Verma',
            dob: new Date('1985-06-20'),
            businessName: 'Fresh Farm Direct',
            gstNumber: '09AAACH7409R2ZZ',
            businessDomain: 'Fresh Produce Retail',
            website: 'https://freshfarmdirect.com',
            addressId: buyerAddress2.id,
            aadhaarEnc: Buffer.from(buyerAadhaar2),
            aadhaarLast4: buyerAadhaar2.slice(-4)
          }
        }
      },
      include: { buyerProfile: true }
    });

    const buyer3 = await prisma.user.create({
      data: {
        role: 'BUYER',
        name: 'Grain Masters Corporation',
        phone: '+919876543222',
        email: 'sales@grainmasters.com',
        gstNumber: '09AAACH7409R3ZZ',
        phoneVerified: true,
        emailVerified: true,
        dateOfBirth: new Date('1975-11-10'),
        aadhaarEncrypted: encryptAadhaar(buyerAadhaar3),
        buyerProfile: {
          create: {
            fullName: 'Vikram Mehta',
            dob: new Date('1975-11-10'),
            businessName: 'Grain Masters Corporation',
            gstNumber: '09AAACH7409R3ZZ',
            businessDomain: 'Grain Processing & Export',
            website: 'https://grainmasters.com',
            addressId: buyerAddress3.id,
            aadhaarEnc: Buffer.from(buyerAadhaar3),
            aadhaarLast4: buyerAadhaar3.slice(-4)
          }
        }
      },
      include: { buyerProfile: true }
    });

    log(`✅ Created 3 buyers: ${buyer1.name}, ${buyer2.name}, ${buyer3.name}`, 'green');
    log('');

    // ==========================================================
    // STEP 5: Create Bids
    // ==========================================================
    log('💰 Creating bids...', 'blue');

    const bids = [
      {
        buyerUserId: buyer1.id,
        farmerUserId: farmer1.id,
        productId: createdProducts[0].id, // Wheat from farmer1
        bidQuantity: 50,
        bidPrice: 4200,
        message: 'Interested in bulk purchase. Can collect within 7 days.',
        status: 'PLACED'
      },
      {
        buyerUserId: buyer2.id,
        farmerUserId: farmer1.id,
        productId: createdProducts[1].id, // Basmati Rice
        bidQuantity: 30,
        bidPrice: 5600,
        message: 'Looking for premium quality basmati rice.',
        status: 'PLACED'
      },
      {
        buyerUserId: buyer3.id,
        farmerUserId: farmer2.id,
        productId: createdProducts[3].id, // Sugarcane
        bidQuantity: 20,
        bidPrice: 3600,
        message: 'Bulk order for processing unit.',
        status: 'ACCEPTED'
      }
    ];

    for (const bidData of bids) {
      await prisma.bid.create({
        data: bidData
      });
    }

    log(`✅ Created ${bids.length} bids`, 'green');
    log('');

    // ==========================================================
    // STEP 6: Create Suppliers
    // ==========================================================
    log('🚜 Creating suppliers...', 'blue');

    // First, get or create supplier type master
    let supplierTypeMaster = await prisma.supplierTypeMaster.findFirst({
      where: { code: 'FARMING_MACHINERY' }
    });

    if (!supplierTypeMaster) {
      supplierTypeMaster = await prisma.supplierTypeMaster.create({
        data: {
          code: 'FARMING_MACHINERY',
          name: 'Farming Machinery'
        }
      });
    }

    // Create addresses for suppliers
    const supplierAddress1 = await prisma.address.create({
      data: {
        countryId: country.id,
        stateId: state.id,
        districtId: district.id,
        line1: '321 Equipment Hub',
        line2: 'Industrial Area',
        pincode: '250003',
        latitude: 28.9900,
        longitude: 77.7200
      }
    });

    const supplierAddress2 = await prisma.address.create({
      data: {
        countryId: country.id,
        stateId: state.id,
        districtId: district.id,
        line1: '654 Transport Yard',
        line2: 'Highway Road',
        pincode: '250004',
        latitude: 29.0000,
        longitude: 77.7300
      }
    });

    const supplier1 = await prisma.user.create({
      data: {
        role: 'SUPPLIER',
        name: 'Farm Equipment Services',
        phone: '+919876543230',
        email: 'contact@farmequipment.com',
        gstNumber: '09AAACH7409S1ZZ',
        phoneVerified: true,
        emailVerified: true,
        supplierProfile: {
          create: {
            organizationName: 'Farm Equipment Services',
            contactName: 'Amit Kumar',
            gstNumber: '09AAACH7409S1ZZ',
            website: 'https://farmequipment.com',
            addressId: supplierAddress1.id,
            supplierTypes: {
              create: {
                supplierTypeId: supplierTypeMaster.id
              }
            }
          }
        }
      },
      include: { supplierProfile: true }
    });

    const supplier2 = await prisma.user.create({
      data: {
        role: 'SUPPLIER',
        name: 'Transport Solutions Ltd',
        phone: '+919876543231',
        email: 'info@transportsolutions.com',
        gstNumber: '09AAACH7409S2ZZ',
        phoneVerified: true,
        emailVerified: true,
        supplierProfile: {
          create: {
            organizationName: 'Transport Solutions Ltd',
            contactName: 'Sunil Yadav',
            gstNumber: '09AAACH7409S2ZZ',
            website: 'https://transportsolutions.com',
            addressId: supplierAddress2.id,
            supplierTypes: {
              create: {
                supplierTypeId: supplierTypeMaster.id
              }
            }
          }
        }
      },
      include: { supplierProfile: true }
    });

    log(`✅ Created 2 suppliers: ${supplier1.name}, ${supplier2.name}`, 'green');
    log('');

    // ==========================================================
    // STEP 7: Create Machinery Inventory (if machinery types exist)
    // ==========================================================
    log('🔧 Creating machinery inventory...', 'blue');

    // Try to get machinery types (they might not exist, so we'll skip if not found)
    try {
      const machineryCategory = await prisma.machineryCategoryMaster.findFirst({
        where: { code: 'FARMING' },
        include: { types: true }
      });

      if (machineryCategory && machineryCategory.types.length > 0) {
        const machineryType = machineryCategory.types[0];
        
        await prisma.supplierMachineryInventory.create({
          data: {
            supplierUserId: supplier1.id,
            machineryTypeId: machineryType.id,
            quantity: 5,
            availabilityStatus: 'AVAILABLE',
            capacityTons: 10.5,
            coverageAddressId: address.id,
            coverageRadiusKm: 50
          }
        });

        log('✅ Created machinery inventory', 'green');
      } else {
        log('⚠️  Machinery types not found, skipping machinery inventory', 'yellow');
      }
    } catch (error) {
      log('⚠️  Could not create machinery inventory (master data may be missing)', 'yellow');
    }

    log('');

    // ==========================================================
    // STEP 8: Create Carts
    // ==========================================================
    log('🛒 Creating carts...', 'blue');

    const cart1 = await prisma.cart.create({
      data: {
        ownerUserId: buyer1.id,
        status: 'ACTIVE',
        items: {
          create: [
            {
              itemType: 'PRODUCT',
              productId: createdProducts[0].id,
              quantity: 10,
              unitPrice: 4000
            },
            {
              itemType: 'PRODUCT',
              productId: createdProducts[2].id,
              quantity: 50,
              unitPrice: 30
            }
          ]
        }
      }
    });

    log(`✅ Created cart for ${buyer1.name}`, 'green');
    log('');

    // ==========================================================
    // SUMMARY
    // ==========================================================
    log('', '');
    log('╔════════════════════════════════════════════════════════╗', 'cyan');
    log('║   ✅ Test Data Seeding Complete!                       ║', 'cyan');
    log('╚════════════════════════════════════════════════════════╝', 'cyan');
    log('', '');
    log('📊 Summary:', 'blue');
    log(`   • Farmers: 3`, 'green');
    log(`   • Buyers: 3`, 'green');
    log(`   • Suppliers: 2`, 'green');
    log(`   • Products: ${createdProducts.length}`, 'green');
    log(`   • Bids: ${bids.length}`, 'green');
    log(`   • Carts: 1`, 'green');
    log('', '');
    log('🔑 Test Credentials:', 'yellow');
    log('', '');
    log('   Farmers:', 'cyan');
    log('   • Phone: +919876543210 (Ravi Kumar)', 'green');
    log('   • Aadhaar: 123456789012 (Last 4: 9012)', 'green');
    log('   • Phone: +919876543211 (Suresh Singh)', 'green');
    log('   • Aadhaar: 234567890123 (Last 4: 0123)', 'green');
    log('   • Phone: +919876543212 (Priya Devi)', 'green');
    log('   • Aadhaar: 345678901234 (Last 4: 1234)', 'green');
    log('', '');
    log('   Buyers:', 'cyan');
    log('   • Phone: +919876543220 | GST: 09AAACH7409R1ZZ', 'green');
    log('   • Password: Buyer123! | Aadhaar: 456789012345', 'green');
    log('   • Phone: +919876543221 | GST: 09AAACH7409R2ZZ', 'green');
    log('   • Aadhaar: 567890123456', 'green');
    log('   • Phone: +919876543222 | GST: 09AAACH7409R3ZZ', 'green');
    log('   • Aadhaar: 678901234567', 'green');
    log('', '');
    log('   Suppliers:', 'cyan');
    log('   • Phone: +919876543230 | GST: 09AAACH7409S1ZZ', 'green');
    log('   • Phone: +919876543231 | GST: 09AAACH7409S2ZZ', 'green');
    log('', '');
    log('✅ All users have Aadhaar numbers and mandatory fields populated!', 'green');
    log('', '');

  } catch (error) {
    log('', '');
    log('❌ Error seeding test data:', 'red');
    log(error.message, 'red');
    log('', '');
    log(error.stack, 'red');
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seed function
seedTestData()
  .then(() => {
    log('✅ Seeding completed successfully!', 'green');
    process.exit(0);
  })
  .catch((error) => {
    log('❌ Seeding failed!', 'red');
    console.error(error);
    process.exit(1);
  });
