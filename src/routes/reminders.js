const router = require('express').Router();
const reminderController = require('../controllers/reminderController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.post('/generate', reminderController.generate);
router.get('/', reminderController.list);
router.patch('/:id/sent', reminderController.markSent);

module.exports = router;
