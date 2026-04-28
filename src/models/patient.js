const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Patient = sequelize.define('Patient', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  userId: { type: DataTypes.UUID, allowNull: false },
  age: { type: DataTypes.INTEGER },
  diagnosis: { type: DataTypes.STRING },
  doctorNotes: { type: DataTypes.TEXT },
  points: { type: DataTypes.INTEGER, defaultValue: 0 },
  streak: { type: DataTypes.INTEGER, defaultValue: 0 },
  lastAdherenceDate: { type: DataTypes.DATEONLY },
  riskScore: { type: DataTypes.FLOAT, defaultValue: 0 },
  riskLevel: {
    type: DataTypes.ENUM('low', 'medium', 'high', 'critical'),
    defaultValue: 'low',
  },
}, { tableName: 'patients' });

module.exports = Patient;
