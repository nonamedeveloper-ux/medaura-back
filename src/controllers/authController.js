const jwt = require('jsonwebtoken');
const { User, Patient } = require('../models');
const logger = require('../utils/logger');

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

const authController = {
  async register(req, res, next) {
    try {
      const { email, password, firstName, lastName, role, age, diagnosis } = req.body;

      const user = await User.create({ email, password, firstName, lastName, role: role || 'patient' });

      if (user.role === 'patient') {
        await Patient.create({ userId: user.id, age, diagnosis });
      }

      const token = signToken(user.id);
      await user.update({ lastLoginAt: new Date() });

      logger.info(`User registered: ${user.email}`);
      res.status(201).json({ token, user });
    } catch (err) {
      next(err);
    }
  },

  async login(req, res, next) {
    try {
      const { email, password } = req.body;
      const user = await User.findOne({ where: { email } });

      if (!user || !(await user.comparePassword(password))) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      if (!user.isActive) {
        return res.status(403).json({ error: 'Account is deactivated' });
      }

      const token = signToken(user.id);
      await user.update({ lastLoginAt: new Date() });

      logger.info(`User logged in: ${user.email}`);
      res.json({ token, user });
    } catch (err) {
      next(err);
    }
  },

  async me(req, res) {
    res.json({ user: req.user });
  },
};

module.exports = authController;
