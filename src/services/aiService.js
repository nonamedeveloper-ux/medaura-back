const axios = require('axios');
const logger = require('../utils/logger');

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

const aiClient = axios.create({
  baseURL: AI_SERVICE_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

// Retry logic: up to 2 retries on network errors
aiClient.interceptors.response.use(
  (res) => res,
  async (error) => {
    const config = error.config;
    config._retryCount = config._retryCount || 0;
    if (config._retryCount >= 2) return Promise.reject(error);
    config._retryCount += 1;
    await new Promise((r) => setTimeout(r, 1000 * config._retryCount));
    return aiClient(config);
  }
);

const buildPatientContext = (patient, user, activePlan) => ({
  name: `${user.firstName} ${user.lastName}`,
  age: patient.age,
  diagnosis: patient.diagnosis,
  current_day: activePlan?.currentDay || 0,
  total_days: activePlan?.totalDays || 0,
  phase: activePlan?.phase || 'initial',
  adherence_rate: activePlan?.adherenceRate || 0,
  points: patient.points,
  streak: patient.streak,
});

const aiService = {
  async chat(patientContext, message) {
    try {
      const { data } = await aiClient.post('/api/ai/chat', {
        patient_context: patientContext,
        message,
      });
      return data;
    } catch (err) {
      logger.error('AI chat error:', err.message);
      return {
        response: 'Kechirasiz, xatolik yuz berdi. Shifokoringizga murojaat qiling.',
        requires_doctor_attention: true,
        sentiment: 'error',
      };
    }
  },

  async generateReminder(patientContext, phase) {
    try {
      const { data } = await aiClient.post('/api/ai/reminder', {
        patient_context: patientContext,
        treatment_phase: phase,
      });
      return data;
    } catch (err) {
      logger.error('AI reminder error:', err.message);
      return {
        message: "Dori ichishni unutmang! Sog'lig'ingiz muhim. 💊",
        technique: 'positive_reinforcement',
        tone: 'motivational',
      };
    }
  },

  async assessRisk(patientId, adherenceData, chatHistory) {
    try {
      const { data } = await aiClient.post('/api/ai/risk-assessment', {
        patient_id: patientId,
        adherence_data: adherenceData,
        chat_history: chatHistory,
      });
      return data;
    } catch (err) {
      logger.error('AI risk assessment error:', err.message);
      return { risk_score: 0, risk_level: 'unknown', recommendations: [] };
    }
  },

  async analyzeSentiment(message) {
    try {
      const { data } = await aiClient.post('/api/ai/sentiment', { message });
      return data;
    } catch (err) {
      logger.error('AI sentiment error:', err.message);
      return { sentiment: 'neutral', urgency: 'low', keywords: [] };
    }
  },

  buildPatientContext,
};

module.exports = aiService;
