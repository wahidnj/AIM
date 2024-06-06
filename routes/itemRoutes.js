const express = require('express');
const router = express.Router();
const itemController = require('../controllers/itemController');
const checkAuth = require('../middleware/authCheck');

router.post('/register', itemController.registerUser);

router.post('/login', itemController.loginUser);

router.get('/refresh-token', checkAuth, itemController.refreshToken);

router.post('/reset-password', checkAuth, itemController.resetPassword);

router.use(checkAuth);

router.get('/dashboard',  itemController.showDashboard);

router.get('/agent',  itemController.getAgentList);

router.get('/numbers-info',  itemController.getNumberInfo);

router.get('/settings',  itemController.getSettings);

router.get('/balance',  itemController.getBalanceInfo);

router.get('/assignment',  itemController.getAssignmentList);

router.get('/test', itemController.testHome);

router.post('/update-setting', itemController.updateSetting);

router.post('/rates', itemController.getRate);

router.get('/call-details/:id', itemController.callDetails);

router.all('/webhook', itemController.webhookVapi);

router.all('/google-webhook', itemController.webhookGoogle);

router.get('/packages', itemController.getPackageList);

router.get('/numbers-info', itemController.getNumberInfo);

router.get('/agent-details/:id', itemController.agentDetails);

router.post('/create-assistant', itemController.createAssistant);

router.post('/create-assignment', itemController.createAssignment);

router.post('/update-assignment', itemController.updateAssignment);

router.post('/update-agent', itemController.updateAssistant);

router.post('/assign-assignment', itemController.assignAssignment);

router.post('/assistant-status', itemController.updateAssistantStatus);

router.post('/delete-assistant', itemController.deleteAssistant);

router.post('/delete-assignment', itemController.deleteAssignment);

module.exports = router;