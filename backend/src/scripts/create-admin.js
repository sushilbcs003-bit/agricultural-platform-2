const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function createAdmin() {
  try {
    const email = process.env.ADMIN_EMAIL || 'admin@agricultural-platform.com';
    const password = process.env.ADMIN_PASSWORD || 'admin123';
    const name = process.env.ADMIN_NAME || 'Admin User';

    // Check if admin already exists
    const existingAdmin = await prisma.user.findFirst({
      where: {
        email,
        role: 'ADMIN',
      },
    });

    if (existingAdmin) {
      console.log('✅ Admin user already exists');
      console.log(`   Email: ${email}`);
      return;
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create admin user
    const admin = await prisma.user.create({
      data: {
        role: 'ADMIN',
        email,
        name,
        passwordHash,
        phone: '+919999999999', // Default phone
        isActive: true,
        emailVerified: true,
        phoneVerified: true,
      },
    });

    console.log('✅ Admin user created successfully!');
    console.log(`   ID: ${admin.id}`);
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${password}`);
    console.log('');
    console.log('⚠️  Please change the default password after first login!');
  } catch (error) {
    console.error('❌ Error creating admin:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();
