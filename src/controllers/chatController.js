const { Patient, ChatMessage, TreatmentPlan } = require('../models');
const aiService = require('../services/aiService');
const gamification = require('../services/gamification');
const logger = require('../utils/logger');

const chatController = {
  async sendMessage(req, res, next) {
    try {
      const { message } = req.body;
      const userId = req.user.id;

      const patient = await Patient.findOne({ where: { userId } });
      if (!patient) return res.status(404).json({ error: 'Patient profile not found' });

      const activePlan = await TreatmentPlan.findOne({
        where: { patientId: patient.id, isActive: true },
      });

      const patientContext = aiService.buildPatientContext(patient, req.user, activePlan);

      // Save user message
      await ChatMessage.create({
        patientId: patient.id,
        role: 'user',
        content: message,
      });

      // Call AI service
      const aiResult = await aiService.chat(patientContext, message);

      // Save AI response
      await ChatMessage.create({
        patientId: patient.id,
        role: 'assistant',
        content: aiResult.response,
        sentiment: aiResult.sentiment,
        requiresDoctorAttention: aiResult.requires_doctor_attention,
        metadata: { model: aiResult.model },
      });

      // Award points for engagement
      const earned = gamification.awardPoints(patient, 'CHAT_MESSAGE');
      await patient.save();

      if (aiResult.requires_doctor_attention) {
        logger.warn(`Doctor attention needed for patient: ${patient.id}`);
      }

      res.json({
        response: aiResult.response,
        requires_doctor_attention: aiResult.requires_doctor_attention,
        sentiment: aiResult.sentiment,
        points_earned: earned,
        total_points: patient.points,
      });
    } catch (err) {
      next(err);
    }
  },

  async getHistory(req, res, next) {
    try {
      const patient = await Patient.findOne({ where: { userId: req.user.id } });
      if (!patient) return res.status(404).json({ error: 'Patient not found' });

      const limit = Math.min(parseInt(req.query.limit) || 50, 100);
      const offset = parseInt(req.query.offset) || 0;

      const messages = await ChatMessage.findAndCountAll({
        where: { patientId: patient.id },
        order: [['createdAt', 'DESC']],
        limit,
        offset,
      });

      res.json({
        messages: messages.rows.reverse(),
        total: messages.count,
        limit,
        offset,
      });
    } catch (err) {
      next(err);
    }
  },
};

module.exports = chatController;
