const prisma = require('../utils/prisma');
const { logAction } = require('../utils/auditLogger');

const VALID_TRANSITIONS = {
  DRAFT: ['ACTIVE', 'CANCELLED'],
  ACTIVE: ['COMPLETED', 'CANCELLED'],
  COMPLETED: [],
  CANCELLED: ['DRAFT']
};

exports.getCampaigns = async (req, res) => {
  const { tenantId } = req.user;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const search = req.query.search || '';
  const status = req.query.status || undefined;

  const where = {
    tenantId,
    ...(status && { status }),
    ...(search && {
      OR: [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ]
    })
  };

  const [total, campaigns] = await Promise.all([
    prisma.campaign.count({ where }),
    prisma.campaign.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      include: {
        assignees: {
          include: { user: { select: { id: true, name: true, email: true } } }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
  ]);

  res.json({
    data: campaigns,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  });
};

exports.getCampaignById = async (req, res) => {
  const { tenantId } = req.user;
  const { id } = req.params;

  // Enforce Tenant isolation: query includes tenantId
  const campaign = await prisma.campaign.findFirst({
    where: { id, tenantId },
    include: {
      assignees: {
        include: { user: { select: { id: true, name: true, email: true } } }
      }
    }
  });

  if (!campaign) {
    return res.status(404).json({ error: 'Campaign not found' });
  }

  res.json(campaign);
};

exports.createCampaign = async (req, res) => {
  const { tenantId, id: userId } = req.user;
  const { title, description, status, assigneeIds = [] } = req.body;

  if (!title) {
    return res.status(400).json({ error: 'Campaign title is required' });
  }

  const campaign = await prisma.campaign.create({
    data: {
      title,
      description,
      status: status || 'DRAFT',
      tenantId,
      assignees: {
        create: assigneeIds.map(uid => ({ userId: uid }))
      }
    },
    include: { assignees: { include: { user: true } } }
  });

  await logAction({
    tenantId,
    userId,
    action: 'CAMPAIGN_CREATED',
    details: { campaignId: campaign.id, title: campaign.title },
    ipAddress: req.ip
  });

  res.status(201).json(campaign);
};

exports.updateCampaign = async (req, res) => {
  const { tenantId, id: userId } = req.user;
  const { id } = req.params;
  const { title, description, status, assigneeIds } = req.body;

  const existing = await prisma.campaign.findFirst({
    where: { id, tenantId },
    include: { assignees: true }
  });

  if (!existing) {
    return res.status(404).json({ error: 'Campaign not found' });
  }

  // Validate status transition
  if (status && status !== existing.status) {
    const allowed = VALID_TRANSITIONS[existing.status] || [];
    if (!allowed.includes(status)) {
      return res.status(400).json({
        error: `Invalid status transition from ${existing.status} to ${status}`
      });
    }
  }

  // Prepare updates
  const updateData = {
    ...(title && { title }),
    ...(description !== undefined && { description }),
    ...(status && { status })
  };

  if (assigneeIds && Array.isArray(assigneeIds)) {
    // Re-assign users
    await prisma.campaignAssignee.deleteMany({ where: { campaignId: id } });
    updateData.assignees = {
      create: assigneeIds.map(uid => ({ userId: uid }))
    };
  }

  const updated = await prisma.campaign.update({
    where: { id },
    data: updateData,
    include: { assignees: { include: { user: { select: { id: true, name: true, email: true } } } } }
  });

  await logAction({
    tenantId,
    userId,
    action: 'CAMPAIGN_UPDATED',
    details: { campaignId: id, updates: req.body },
    ipAddress: req.ip
  });

  res.json(updated);
};

exports.deleteCampaign = async (req, res) => {
  const { tenantId, id: userId } = req.user;
  const { id } = req.params;

  const existing = await prisma.campaign.findFirst({
    where: { id, tenantId }
  });

  if (!existing) {
    return res.status(404).json({ error: 'Campaign not found' });
  }

  await prisma.campaign.delete({ where: { id } });

  await logAction({
    tenantId,
    userId,
    action: 'CAMPAIGN_DELETED',
    details: { campaignId: id, title: existing.title },
    ipAddress: req.ip
  });

  res.json({ message: 'Campaign deleted successfully' });
};