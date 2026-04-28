const { TreatmentPlan, Patient } = require('../models');

const treatmentController = {
  async create(req, res, next) {
    try {
      const { patientId, name, description, medications, totalDays, startDate } = req.body;

      // Deactivate existing active plan
      await TreatmentPlan.update({ isActive: false }, { where: { patientId, isActive: true } });

      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + totalDays);

      const plan = await TreatmentPlan.create({
        patientId,
        name,
        description,
        medications: medications || [],
        totalDays,
        startDate,
        endDate: endDate.toISOString().split('T')[0],
        isActive: true,
      });

      res.status(201).json({ plan });
    } catch (err) {
      next(err);
    }
  },

  async getActivePlan(req, res, next) {
    try {
      const patient = await Patient.findOne({ where: { userId: req.user.id } });
      if (!patient) return res.status(404).json({ error: 'Patient not found' });

      const plan = await TreatmentPlan.findOne({
        where: { patientId: patient.id, isActive: true },
      });

      res.json({ plan: plan || null });
    } catch (err) {
      next(err);
    }
  },

  async update(req, res, next) {
    try {
      const plan = await TreatmentPlan.findByPk(req.params.id);
      if (!plan) return res.status(404).json({ error: 'Plan not found' });

      await plan.update(req.body);
      res.json({ plan });
    } catch (err) {
      next(err);
    }
  },

  async listByPatient(req, res, next) {
    try {
      const plans = await TreatmentPlan.findAll({
        where: { patientId: req.params.patientId },
        order: [['createdAt', 'DESC']],
      });
      res.json({ plans });
    } catch (err) {
      next(err);
    }
  },
};

module.exports = treatmentController;
