const { Patient, User, TreatmentPlan } = require('../models');
const gamification = require('../services/gamification');

const patientController = {
  async getProfile(req, res, next) {
    try {
      const patient = await Patient.findOne({
        where: { userId: req.user.id },
        include: [{ model: TreatmentPlan, as: 'treatmentPlans', where: { isActive: true }, required: false }],
      });
      if (!patient) return res.status(404).json({ error: 'Patient not found' });

      const badge = gamification.getBadge(patient.points);
      res.json({ patient, badge });
    } catch (err) {
      next(err);
    }
  },

  async updateProfile(req, res, next) {
    try {
      const { age, diagnosis, doctorNotes } = req.body;
      const patient = await Patient.findOne({ where: { userId: req.user.id } });
      if (!patient) return res.status(404).json({ error: 'Patient not found' });

      await patient.update({ age, diagnosis, doctorNotes });
      res.json({ patient });
    } catch (err) {
      next(err);
    }
  },

  async recordAdherence(req, res, next) {
    try {
      const patient = await Patient.findOne({ where: { userId: req.user.id } });
      if (!patient) return res.status(404).json({ error: 'Patient not found' });

      gamification.updateStreak(patient);
      const earned = gamification.awardPoints(patient, 'MEDICATION_TAKEN');
      if (patient.streak > 1) gamification.awardPoints(patient, 'STREAK_BONUS');

      await patient.save();

      const activePlan = await TreatmentPlan.findOne({ where: { patientId: patient.id, isActive: true } });
      if (activePlan) {
        activePlan.currentDay += 1;
        const totalDays = activePlan.totalDays || 1;
        activePlan.adherenceRate = Math.min((activePlan.currentDay / totalDays) * 100, 100);
        await activePlan.save();
      }

      res.json({
        points_earned: earned,
        total_points: patient.points,
        streak: patient.streak,
        badge: gamification.getBadge(patient.points),
      });
    } catch (err) {
      next(err);
    }
  },

  // Doctor: list all patients
  async listPatients(req, res, next) {
    try {
      const patients = await Patient.findAll({
        include: [{ model: User, as: undefined, foreignKey: 'userId' }],
        order: [['riskScore', 'DESC']],
      });
      res.json({ patients });
    } catch (err) {
      next(err);
    }
  },

  // Doctor: get single patient with full details
  async getPatient(req, res, next) {
    try {
      const patient = await Patient.findByPk(req.params.id, {
        include: [
          { model: TreatmentPlan, as: 'treatmentPlans' },
        ],
      });
      if (!patient) return res.status(404).json({ error: 'Patient not found' });
      res.json({ patient });
    } catch (err) {
      next(err);
    }
  },
};

module.exports = patientController;
