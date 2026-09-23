const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { authenticateJWT } = require('./middlewares/authMiddleware');
const { requireRole } = require('./middlewares/rbacMiddleware');

const authController = require('./controllers/authController');
const campaignController = require('./controllers/campaignController');
const eventController = require('./controllers/eventController');
const dashboardController = require('./controllers/dashboardController');
const userController = require('./controllers/userController');
const auditController = require('./controllers/auditController');

const app = express();
app.use(cors());
app.use(express.json());

// Public Auth Route
app.post('/api/auth/login', authController.login);

// Protected Routes (All require valid JWT)
app.use('/api', authenticateJWT);

// Auth Me
app.get('/api/auth/me', authController.getMe);

// Dashboard
app.get('/api/dashboard/metrics', dashboardController.getMetrics);

// Users (Tenant-isolated)
app.get('/api/users', userController.getUsers);

// Campaigns
app.get('/api/campaigns', campaignController.getCampaigns);
app.get('/api/campaigns/:id', campaignController.getCampaignById);
app.post('/api/campaigns', requireRole(['ADMIN', 'MANAGER']), campaignController.createCampaign);
app.put('/api/campaigns/:id', requireRole(['ADMIN', 'MANAGER']), campaignController.updateCampaign);
app.delete('/api/campaigns/:id', requireRole(['ADMIN']), campaignController.deleteCampaign);

// Security Events
app.get('/api/events', eventController.getEvents);
app.post('/api/events', requireRole(['ADMIN', 'MANAGER']), eventController.createEvent);
app.patch('/api/events/:id/status', requireRole(['ADMIN', 'MANAGER']), eventController.updateEventStatus);

// Audit Logs (Only ADMIN and MANAGER)
app.get('/api/audit-logs', requireRole(['ADMIN', 'MANAGER']), auditController.getAuditLogs);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Backend server running on port ${PORT}`));