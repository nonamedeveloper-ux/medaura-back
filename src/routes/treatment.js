const router = require('express').Router();
const { body } = require('express-validator');
const treatmentController = require('../controllers/treatmentController');
const { authenticate, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');

router.use(authenticate);

router.get('/active', treatmentController.getActivePlan);

// Doctor only: create/update plans
router.post(
  '/',
  authorize('doctor', 'admin'),
  [
    body('patientId').isUUID(),
    body('name').notEmpty().trim(),
    body('totalDays').isInt({ min: 1 }),
    body('startDate').isDate(),
  ],
  validate,
  treatmentController.create
);

router.patch('/:id', authorize('doctor', 'admin'), treatmentController.update);
router.get('/patient/:patientId', authorize('doctor', 'admin'), treatmentController.listByPatient);

module.exports = router;
