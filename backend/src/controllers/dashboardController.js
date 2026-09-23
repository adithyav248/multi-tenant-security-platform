const prisma = require('../utils/prisma');

exports.getMetrics = async (req, res) => {
  const { tenantId } = req.user;

  const [userCount, campaignCount, criticalEventsCount, openEventsCount, recentActivity] = await Promise.all([
    prisma.user.count({ where: { tenantId } }),
    prisma.campaign.count({ where: { tenantId } }),
    prisma.securityEvent.count({ where: { tenantId, severity: 'CRITICAL', status: { not: 'RESOLVED' } } }),
    prisma.securityEvent.count({ where: { tenantId, status: 'OPEN' } }),
    prisma.auditLog.findMany({
      where: { tenantId },
      take: 6,
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { name: true, email: true } } }
    })
  ]);

  res.json({
    userCount,
    campaignCount,
    criticalEventsCount,
    openEventsCount,
    recentActivity
  });
};