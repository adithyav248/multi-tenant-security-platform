const prisma = require('../utils/prisma');

exports.getEvents = async (req, res) => {
  const { tenantId } = req.user;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const severity = req.query.severity || undefined;
  const status = req.query.status || undefined;

  const where = {
    tenantId,
    ...(severity && { severity }),
    ...(status && { status })
  };

  const [total, events] = await Promise.all([
    prisma.securityEvent.count({ where }),
    prisma.securityEvent.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' }
    })
  ]);

  res.json({
    data: events,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  });
};

exports.createEvent = async (req, res) => {
  const { tenantId } = req.user;
  const { title, eventType, severity, status, description } = req.body;

  if (!title || !eventType || !severity || !description) {
    return res.status(400).json({ error: 'Missing required event fields' });
  }

  const event = await prisma.securityEvent.create({
    data: {
      title,
      eventType,
      severity,
      status: status || 'OPEN',
      description,
      tenantId
    }
  });

  res.status(201).json(event);
};

exports.updateEventStatus = async (req, res) => {
  const { tenantId } = req.user;
  const { id } = req.params;
  const { status } = req.body;

  const event = await prisma.securityEvent.findFirst({ where: { id, tenantId } });
  if (!event) {
    return res.status(404).json({ error: 'Security event not found' });
  }

  const updated = await prisma.securityEvent.update({
    where: { id },
    data: { status }
  });

  res.json(updated);
};