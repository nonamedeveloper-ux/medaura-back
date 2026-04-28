const router = require('express').Router();
const patientController = require('../controllers/patientController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

// Patient self-service
router.get('/profile', patientController.getProfile);
router.patch('/profile', patientController.updateProfile);
router.post('/adherence', patientController.recordAdherence);

// Doctor only
router.get('/', authorize('doctor', 'admin'), patientController.listPatients);
router.get('/:id', authorize('doctor', 'admin'), patientController.getPatient);

module.exports = router;
