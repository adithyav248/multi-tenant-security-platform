const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../utils/prisma');
const { logAction } = require('../utils/auditLogger');

exports.login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const user = await prisma.user.findUnique({
    where: { email },
    include: { tenant: true }
  });

  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const token = jwt.sign(
    { userId: user.id, tenantId: user.tenantId, role: user.role },
    process.env.JWT_SECRET || 'secret_key_123',
    { expiresIn: '8h' }
  );

  await logAction({
    tenantId: user.tenantId,
    userId: user.id,
    action: 'USER_LOGIN',
    details: `User ${user.email} logged in`,
    ipAddress: req.ip
  });

  return res.json({
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      tenantId: user.tenantId,
      tenantName: user.tenant.name
    }
  });
};

exports.getMe = async (req, res) => {
  res.json({ user: req.user });
};