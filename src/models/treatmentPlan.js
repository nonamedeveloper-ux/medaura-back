const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const TreatmentPlan = sequelize.define('TreatmentPlan', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  patientId: { type: DataTypes.UUID, allowNull: false },
  name: { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.TEXT },
  medications: { type: DataTypes.JSONB, defaultValue: [] },
  totalDays: { type: DataTypes.INTEGER, allowNull: false },
  currentDay: { type: DataTypes.INTEGER, defaultValue: 0 },
  phase: {
    type: DataTypes.ENUM('initial', 'improvement', 'consolidation', 'completion'),
    defaultValue: 'initial',
  },
  startDate: { type: DataTypes.DATEONLY },
  endDate: { type: DataTypes.DATEONLY },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
  adherenceRate: { type: DataTypes.FLOAT, defaultValue: 0 },
}, { tableName: 'treatment_plans' });

module.exports = TreatmentPlan;
