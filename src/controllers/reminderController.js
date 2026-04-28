const { Patient, Reminder, TreatmentPlan } = require('../models');
const aiService = require('../services/aiService');

const reminderController = {
  async generate(req, res, next) {
    try {
      const patient = await Patient.findOne({ where: { userId: req.user.id } });
      if (!patient) return res.status(404).json({ error: 'Patient not found' });

      const activePlan = await TreatmentPlan.findOne({
        where: { patientId: patient.id, isActive: true },
      });

      const context = aiService.buildPatientContext(patient, req.user, activePlan);
      const phase = activePlan?.phase || 'initial';

      const result = await aiService.generateReminder(context, phase);

      const reminder = await Reminder.create({
        patientId: patient.id,
        message: result.message,
        phase: result.phase || phase,
        technique: result.technique,
        scheduledAt: new Date(),
      });

      res.status(201).json({ reminder });
    } catch (err) {
      next(err);
    }
  },

  async markSent(req, res, next) {
    try {
      const reminder = await Reminder.findByPk(req.params.id);
      if (!reminder) return res.status(404).json({ error: 'Reminder not found' });

      await reminder.update({ isSent: true, sentAt: new Date() });
      res.json({ reminder });
    } catch (err) {
      next(err);
    }
  },

  async list(req, res, next) {
    try {
      const patient = await Patient.findOne({ where: { userId: req.user.id } });
      if (!patient) return res.status(404).json({ error: 'Patient not found' });

      const reminders = await Reminder.findAll({
        where: { patientId: patient.id },
        order: [['createdAt', 'DESC']],
        limit: 20,
      });

      res.json({ reminders });
    } catch (err) {
      next(err);
    }
  },
};

module.exports = reminderController;
