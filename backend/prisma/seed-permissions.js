// Seed script for permissions and roles
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

const permissions = [
  // Users
  { key: 'users.read', description: 'View users', category: 'Users' },
  { key: 'users.update', description: 'Update user information', category: 'Users' },
  { key: 'users.suspend', description: 'Suspend or activate users', category: 'Users' },
  
  // Auth / OTP
  { key: 'otp.read', description: 'View OTP logs', category: 'Auth' },
  { key: 'otp.block', description: 'Block phone numbers', category: 'Auth' },
  
  // Products
  { key: 'products.read', description: 'View products', category: 'Products' },
  { key: 'products.approve', description: 'Approve or reject products', category: 'Products' },
  { key: 'products.update', description: 'Update product information', category: 'Products' },
  { key: 'products.delete', description: 'Delete products', category: 'Products' },
  
  // Offers
  { key: 'offers.read', description: 'View offers', category: 'Offers' },
  { key: 'offers.cancel', description: 'Cancel offers', category: 'Offers' },
  
  // Orders
  { key: 'orders.read', description: 'View orders', category: 'Orders' },
  { key: 'orders.update', description: 'Update order status', category: 'Orders' },
  { key: 'orders.cancel', description: 'Cancel orders', category: 'Orders' },
  { key: 'orders.refund', description: 'Process refunds', category: 'Orders' },
  
  // Machinery
  { key: 'machinery.read', description: 'View machinery listings', category: 'Machinery' },
  { key: 'machinery.approve', description: 'Approve machinery listings', category: 'Machinery' },
  { key: 'machinery.update', description: 'Update machinery listings', category: 'Machinery' },
  
  // Transport
  { key: 'transport.read', description: 'View transport listings', category: 'Transport' },
  { key: 'transport.update', description: 'Update transport listings', category: 'Transport' },
  { key: 'transport.reassign', description: 'Reassign transport providers', category: 'Transport' },
  
  // Quality Tests
  { key: 'quality.read', description: 'View quality test results', category: 'Quality' },
  { key: 'quality.verify', description: 'Verify quality test results', category: 'Quality' },
  { key: 'quality.override', description: 'Override quality test results', category: 'Quality' },
  
  // Audit & Reports
  { key: 'audit.read', description: 'View audit logs', category: 'Audit' },
  { key: 'reports.export', description: 'Export reports', category: 'Reports' },
  
  // Admin Management
  { key: 'admin.manage_admins', description: 'Manage admin users', category: 'Admin' },
  { key: 'admin.manage_roles', description: 'Manage roles and permissions', category: 'Admin' },
];

const roles = [
  {
    name: 'SUPER_ADMIN',
    description: 'Full system access with all permissions',
    isSystemRole: true,
    permissions: permissions.map(p => p.key) // All permissions
  },
  {
    name: 'FUNCTIONAL_ADMIN',
    description: 'Operations admin with limited permissions',
    isSystemRole: true,
    permissions: [
      'users.read',
      'users.update',
      'products.read',
      'products.approve',
      'offers.read',
      'orders.read',
      'orders.update',
      'orders.cancel',
      'machinery.read',
      'machinery.approve',
      'transport.read',
      'transport.update',
      'quality.read',
      'audit.read'
    ]
  }
];

async function seed() {
  console.log('🌱 Seeding permissions and roles...');

  // Create permissions
  for (const perm of permissions) {
    try {
      await prisma.permission.upsert({
        where: { key: perm.key },
        update: {},
        create: perm
      });
    } catch (error) {
      console.error(`Error creating permission ${perm.key}:`, error.message);
    }
  }
  console.log(`✅ Created ${permissions.length} permissions`);

  // Create roles and assign permissions
  for (const roleData of roles) {
    const { permissions: permKeys, ...roleInfo } = roleData;
    
    const role = await prisma.role.upsert({
      where: { name: roleData.name },
      update: {},
      create: roleInfo
    });

    // Assign permissions to role
    for (const permKey of permKeys) {
      const permission = await prisma.permission.findUnique({
        where: { key: permKey }
      });
      
      if (permission) {
        await prisma.rolePermission.upsert({
          where: {
            roleId_permissionId: {
              roleId: role.id,
              permissionId: permission.id
            }
          },
          update: {},
          create: {
            roleId: role.id,
            permissionId: permission.id
          }
        });
      }
    }
    console.log(`✅ Created role ${roleData.name} with ${permKeys.length} permissions`);
  }

  // Create default super admin user (if doesn't exist)
  const existingAdmin = await prisma.adminUser.findFirst({
    where: { email: 'admin@agricultural-platform.com' }
  });

  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash('Admin@123', 10);
    const superAdminRole = await prisma.role.findUnique({
      where: { name: 'SUPER_ADMIN' }
    });

    const admin = await prisma.adminUser.create({
      data: {
        name: 'Super Admin',
        email: 'admin@agricultural-platform.com',
        phone: '+919999999999',
        passwordHash: passwordHash,
        status: 'ACTIVE',
        roles: {
          create: {
            roleId: superAdminRole.id
          }
        }
      }
    });

    console.log(`✅ Created super admin: ${admin.email} (password: Admin@123)`);
  } else {
    console.log(`ℹ️  Super admin already exists`);
  }

  console.log('🎉 Seeding completed!');
}

seed()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

