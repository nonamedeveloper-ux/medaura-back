const POINTS = {
  MEDICATION_TAKEN: 10,
  STREAK_BONUS: 5,
  CHAT_MESSAGE: 2,
  WEEKLY_STREAK: 50,
};

const gamification = {
  awardPoints(patient, action) {
    const earned = POINTS[action] || 0;
    patient.points += earned;
    return earned;
  },

  updateStreak(patient) {
    const today = new Date().toISOString().split('T')[0];
    const last = patient.lastAdherenceDate;

    if (!last) {
      patient.streak = 1;
    } else {
      const diff = Math.floor((new Date(today) - new Date(last)) / 86400000);
      if (diff === 1) {
        patient.streak += 1;
        // Weekly streak bonus
        if (patient.streak % 7 === 0) {
          patient.points += POINTS.WEEKLY_STREAK;
        }
      } else if (diff > 1) {
        patient.streak = 1;
      }
    }

    patient.lastAdherenceDate = today;
  },

  getBadge(points) {
    if (points >= 1000) return { name: 'Champion', emoji: '🏆' };
    if (points >= 500) return { name: 'Dedicated', emoji: '⭐' };
    if (points >= 200) return { name: 'Consistent', emoji: '🎯' };
    if (points >= 50) return { name: 'Starter', emoji: '🌱' };
    return { name: 'Newcomer', emoji: '👋' };
  },
};

module.exports = gamification;
