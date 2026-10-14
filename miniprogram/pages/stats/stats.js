const { call } = require('../../utils/cloud');

Page({
  data: {
    loading: true,
    error: false,
    total: 0,
    mastered: 0,
    familiar: 0,
    practicing: 0,
    untracked: 0,
    overallPercent: 0,
    subjectStats: [],
    needsReview: [],
    practiced: 0,
    correctCount: 0,
    accuracy: 0
  },

  onShow() {
    this.load();
  },

  async load() {
    this.setData({ loading: true, error: false });
    try {
      const r = await call('listMistakes');
      const mistakes = r.data || [];

      if (!mistakes.length) {
        this.setData({ loading: false, total: 0 });
        return;
      }

      // Compute mastery stats
      let mastered = 0, familiar = 0, practicing = 0, untracked = 0;
      let practiced = 0, correctCount = 0;

      mistakes.forEach(m => {
        const level = typeof m.mastery === 'number' ? m.mastery : 0;
        if (level >= 3) mastered++;
        else if (level === 2) familiar++;
        else if (level === 1) practicing++;
        else untracked++;

        if (m.lastPracticeAt) {
          practiced++;
          if (m.lastPracticeCorrect === true) correctCount++;
        }
      });

      const total = mistakes.length;
      const overallPercent = total > 0 ? Math.round((mastered / total) * 100) : 0;
      const accuracy = practiced > 0 ? Math.round((correctCount / practiced) * 100) : 0;

      // Subject stats
      const subjectMap = {};
      mistakes.forEach(m => {
        const subj = m.subject || '未分类';
        if (!subjectMap[subj]) {
          subjectMap[subj] = { subject: subj, total: 0, mastered: 0 };
        }
        subjectMap[subj].total++;
        if ((typeof m.mastery === 'number' ? m.mastery : 0) >= 3) {
          subjectMap[subj].mastered++;
        }
      });

      const subjectStats = Object.values(subjectMap).map(s => {
        const percent = s.total > 0 ? Math.round((s.mastered / s.total) * 100) : 0;
        const barColor = percent >= 75 ? '#34C759' : percent >= 40 ? '#007AFF' : '#FF9500';
        return { ...s, percent, barColor };
      });

      // Needs review: mastery < 2, sorted by oldest practice or newest creation
      const labels = ['未练习', '练习中', '较熟悉', '已掌握'];
      const needsReview = mistakes
        .filter(m => (typeof m.mastery === 'number' ? m.mastery : 0) < 2)
        .sort((a, b) => {
          const aTime = a.lastPracticeAt || a.createdAt || 0;
          const bTime = b.lastPracticeAt || b.createdAt || 0;
          return aTime - bTime;
        })
        .slice(0, 10)
        .map(m => ({
          ...m,
          mastery: typeof m.mastery === 'number' ? m.mastery : 0,
          masteryLabel: labels[typeof m.mastery === 'number' ? m.mastery : 0] || '未练习'
        }));

      this.setData({
        loading: false,
        total,
        mastered,
        familiar,
        practicing,
        untracked,
        overallPercent,
        subjectStats,
        needsReview,
        practiced,
        correctCount,
        accuracy
      });
    } catch (e) {
      this.setData({ loading: false, error: true });
    }
  },

  openDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: '/pages/mistake-detail/mistake-detail?id=' + id
    });
  },

  onShareAppMessage() {
    const total = this.data.total || 0;
    const mastered = this.data.mastered || 0;
    const title = total > 0
      ? '我用小错题家收录了' + total + '道错题，已掌握' + mastered + '道'
      : '小错题家 - AI 错题分析与变式题练习';
    return {
      title: title,
      path: '/pages/index/index',
      imageUrl: ''
    };
  },

  onShareTimeline() {
    const total = this.data.total || 0;
    const mastered = this.data.mastered || 0;
    const title = total > 0
      ? '我已收录' + total + '道错题，掌握' + mastered + '道，用小错题家精准复习'
      : '小错题家 - AI 错题分析与变式题练习';
    return { title: title, query: '' };
  }
});
