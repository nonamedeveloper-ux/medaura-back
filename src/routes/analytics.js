const router = require('express').Router();
const analyticsController = require('../controllers/analyticsController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

router.get('/dashboard', analyticsController.getDashboard);
router.post('/risk-assessment', analyticsController.runRiskAssessment);
router.get('/doctor/overview', authorize('doctor', 'admin'), analyticsController.doctorOverview);

module.exports = router;
