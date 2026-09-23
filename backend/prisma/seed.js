const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE "Tenant" CASCADE;`);

  const passwordHash = await bcrypt.hash('Password123!', 10);

  // Tenant A: CyberGuard Corp
  const tenantA = await prisma.tenant.create({
    data: {
      name: 'CyberGuard Corp',
      users: {
        create: [
          { name: 'Alice Admin', email: 'admin@cyberguard.com', password: passwordHash, role: 'ADMIN' },
          { name: 'Bob Manager', email: 'manager@cyberguard.com', password: passwordHash, role: 'MANAGER' },
          { name: 'Charlie User', email: 'user@cyberguard.com', password: passwordHash, role: 'USER' },
        ]
      }
    },
    include: { users: true }
  });

  // Tenant B: SecureNet Ltd
  const tenantB = await prisma.tenant.create({
    data: {
      name: 'SecureNet Ltd',
      users: {
        create: [
          { name: 'Dave Admin', email: 'admin@securenet.com', password: passwordHash, role: 'ADMIN' },
          { name: 'Eve User', email: 'user@securenet.com', password: passwordHash, role: 'USER' }
        ]
      }
    },
    include: { users: true }
  });

  // Campaigns for Tenant A
  await prisma.campaign.create({
    data: {
      title: 'Q3 Phishing Awareness Drill',
      description: 'Simulated phishing attacks across marketing & finance.',
      status: 'ACTIVE',
      tenantId: tenantA.id,
      assignees: {
        create: [{ userId: tenantA.users[1].id }]
      }
    }
  });

  // Campaign for Tenant B (to test cross-tenant isolation)
  const campaignB = await prisma.campaign.create({
    data: {
      title: 'Tenant B Internal Audit Campaign',
      description: 'Confidential Tenant B security scan',
      status: 'DRAFT',
      tenantId: tenantB.id
    }
  });

  // Security Events for Tenant A
  await prisma.securityEvent.createMany({
    data: [
      {
        title: 'Multiple Failed SSH Logins',
        eventType: 'BRUTE_FORCE',
        severity: 'HIGH',
        status: 'OPEN',
        description: 'Over 50 failed root attempts from IP 198.51.100.4',
        tenantId: tenantA.id
      },
      {
        title: 'Ransomware Canary Triggered',
        eventType: 'MALWARE_ALERT',
        severity: 'CRITICAL',
        status: 'OPEN',
        description: 'File system integrity tripwire tripped on file server 02',
        tenantId: tenantA.id
      }
    ]
  });

  console.log('✅ Seed completed successfully!');
  console.log(`Tenant B Campaign ID for cross-tenant testing: ${campaignB.id}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });