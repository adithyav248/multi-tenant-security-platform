// auditController.js
const prisma = require('../utils/prisma');

exports.getAuditLogs = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 15;

  const [total, logs] = await Promise.all([
    prisma.auditLog.count({ where: { tenantId: req.user.tenantId } }),
    prisma.auditLog.findMany({
      where: { tenantId: req.user.tenantId },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { name: true, email: true } } }
    })
  ]);

  res.json({
    data: logs,
    pagination: { total, page, limit, totalPages: Math.ceil(total / limit) }
  });
};