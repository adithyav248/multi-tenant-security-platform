const prisma = require('./prisma');

async function logAction({ tenantId, userId, action, details, ipAddress }) {
  try {
    await prisma.auditLog.create({
      data: {
        tenantId,
        userId: userId || null,
        action,
        details: typeof details === 'object' ? JSON.stringify(details) : details,
        ipAddress: ipAddress || 'unknown'
      }
    });
  } catch (error) {
    console.error('Audit log failed:', error.message);
  }
}

module.exports = { logAction };