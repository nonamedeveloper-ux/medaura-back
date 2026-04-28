const sequelize = require('../config/database');
const User = require('./user');
const Patient = require('./patient');
const TreatmentPlan = require('./treatmentPlan');
const ChatMessage = require('./chatMessage');
const Reminder = require('./reminder');

// Associations
User.hasOne(Patient, { foreignKey: 'userId', as: 'patientProfile' });
Patient.belongsTo(User, { foreignKey: 'userId' });

Patient.hasMany(TreatmentPlan, { foreignKey: 'patientId', as: 'treatmentPlans' });
TreatmentPlan.belongsTo(Patient, { foreignKey: 'patientId' });

Patient.hasMany(ChatMessage, { foreignKey: 'patientId', as: 'chatMessages' });
ChatMessage.belongsTo(Patient, { foreignKey: 'patientId' });

Patient.hasMany(Reminder, { foreignKey: 'patientId', as: 'reminders' });
Reminder.belongsTo(Patient, { foreignKey: 'patientId' });

module.exports = { sequelize, User, Patient, TreatmentPlan, ChatMessage, Reminder };
