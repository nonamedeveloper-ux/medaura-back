const router = require('express').Router();
const { body } = require('express-validator');
const chatController = require('../controllers/chatController');
const { authenticate } = require('../middleware/auth');
const validate = require('../middleware/validate');

router.use(authenticate);

router.post(
  '/message',
  [body('message').notEmpty().trim().isLength({ max: 2000 })],
  validate,
  chatController.sendMessage
);

router.get('/history', chatController.getHistory);

module.exports = router;
