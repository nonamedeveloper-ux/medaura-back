const { Patient, ChatMessage, TreatmentPlan } = require('../models');
const aiService = require('../services/aiService');
const { Op } = require('sequelize');

const analyticsController = {
  async getDashboard(req, res, next) {
    try {
      const patient = await Patient.findOne({ where: { userId: req.user.id } });
      if (!patient) return res.status(404).json({ error: 'Patient not found' });

      const activePlan = await TreatmentPlan.findOne({
        where: { patientId: patient.id, isActive: true },
      });

      const last7DaysMessages = await ChatMessage.count({
        where: {
          patientId: patient.id,
          createdAt: { [Op.gte]: new Date(Date.now() - 7 * 86400000) },
        },
      });

      res.json({
        points: patient.points,
        streak: patient.streak,
        risk_level: patient.riskLevel,
        risk_score: patient.riskScore,
        active_plan: activePlan
          ? {
              name: activePlan.name,
              progress: `${activePlan.currentDay}/${activePlan.totalDays}`,
              adherence_rate: activePlan.adherenceRate,
              phase: activePlan.phase,
            }
          : null,
        engagement: { messages_last_7_days: last7DaysMessages },
      });
    } catch (err) {
      next(err);
    }
  },

  async runRiskAssessment(req, res, next) {
    try {
      const patient = await Patient.findOne({ where: { userId: req.user.id } });
      if (!patient) return res.status(404).json({ error: 'Patient not found' });

      const activePlan = await TreatmentPlan.findOne({
        where: { patientId: patient.id, isActive: true },
      });

      const recentMessages = await ChatMessage.findAll({
        where: { patientId: patient.id },
        order: [['createdAt', 'DESC']],
        limit: 20,
      });

      const adherenceData = {
        adherence_rate: activePlan?.adherenceRate || 0,
        current_day: activePlan?.currentDay || 0,
        total_days: activePlan?.totalDays || 0,
        streak: patient.streak,
      };

      const result = await aiService.assessRisk(
        patient.id,
        adherenceData,
        recentMessages.map((m) => ({ role: m.role, content: m.content }))
      );

      await patient.update({
        riskScore: result.risk_score,
        riskLevel: result.risk_level !== 'unknown' ? result.risk_level : patient.riskLevel,
      });

      res.json(result);
    } catch (err) {
      next(err);
    }
  },

  // Doctor analytics: overview of all patients
  async doctorOverview(req, res, next) {
    try {
      const patients = await Patient.findAll({ order: [['riskScore', 'DESC']] });

      const stats = {
        total: patients.length,
        by_risk: {
          critical: patients.filter((p) => p.riskLevel === 'critical').length,
          high: patients.filter((p) => p.riskLevel === 'high').length,
          medium: patients.filter((p) => p.riskLevel === 'medium').length,
          low: patients.filter((p) => p.riskLevel === 'low').length,
        },
        avg_points: Math.round(patients.reduce((s, p) => s + p.points, 0) / (patients.length || 1)),
        top_risk_patients: patients.slice(0, 5).map((p) => ({
          id: p.id,
          risk_score: p.riskScore,
          risk_level: p.riskLevel,
        })),
      };

      res.json(stats);
    } catch (err) {
      next(err);
    }
  },
};

module.exports = analyticsController;
