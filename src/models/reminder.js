const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Reminder = sequelize.define('Reminder', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  patientId: { type: DataTypes.UUID, allowNull: false },
  message: { type: DataTypes.TEXT, allowNull: false },
  phase: { type: DataTypes.STRING },
  technique: { type: DataTypes.STRING },
  scheduledAt: { type: DataTypes.DATE },
  sentAt: { type: DataTypes.DATE },
  isSent: { type: DataTypes.BOOLEAN, defaultValue: false },
}, { tableName: 'reminders' });

module.exports = Reminder;
