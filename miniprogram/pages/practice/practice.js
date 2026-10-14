const { call } = require('../../utils/cloud');

Page({
  data: {
    mistakeId: '',
    mistake: null,
    practiceQuestion: null,
    userAnswer: '',
    isCorrect: false,
    resultMastery: 0,
    masteryLabels: ['未练习', '练习中', '较熟悉', '已掌握'],
    phase: 'loading'
  },

  onLoad(options) {
    if (options.mistakeId) {
      this.setData({ mistakeId: options.mistakeId });
      this.generate();
    } else {
      this.setData({ phase: 'error' });
    }
  },

  async generate() {
    this.setData({ phase: 'loading', userAnswer: '', isCorrect: false, resultMastery: 0 });

    try {
      // Get the mistake data via dedicated function
      const mistake = await call('getMistake', { id: this.data.mistakeId });

      if (!mistake) {
        this.setData({ phase: 'error' });
        return;
      }

      this.setData({ mistake });

      // Generate a new practice question
      const q = await call('generateQuestion', mistake);

      if (!q || !q.questionText) {
        this.setData({ phase: 'error' });
        return;
      }

      this.setData({
        practiceQuestion: {
          questionText: q.questionText || '',
          answer: q.answer || '',
          explanation: q.explanation || '',
          knowledgePoints: Array.isArray(q.knowledgePoints) ? q.knowledgePoints : []
        },
        phase: 'question'
      });
    } catch (e) {
      this.setData({ phase: 'error' });
    }
  },

  onAnswerInput(e) {
    this.setData({ userAnswer: e.detail.value });
  },

  async submit() {
    if (!this.data.userAnswer.trim()) return;

    const answer = this.data.userAnswer.trim();
    const correctAnswer = (this.data.practiceQuestion.answer || '').trim();

    // Simple comparison: check if user answer contains or matches the correct answer
    const isCorrect = this.checkAnswer(answer, correctAnswer);

    this.setData({ isCorrect });

    wx.showLoading({ title: '提交中' });

    try {
      const result = await call('submitPractice', {
        mistakeId: this.data.mistakeId,
        questionText: this.data.practiceQuestion.questionText,
        userAnswer: answer,
        correctAnswer: correctAnswer,
        isCorrect: isCorrect,
        explanation: this.data.practiceQuestion.explanation,
        knowledgePoints: this.data.practiceQuestion.knowledgePoints
      });

      this.setData({
        resultMastery: typeof result.mastery === 'number' ? result.mastery : 0,
        phase: 'result'
      });
    } catch (e) {
      // Even if recording fails, still show the result
      this.setData({
        resultMastery: isCorrect ? 1 : 0,
        phase: 'result'
      });
    } finally {
      wx.hideLoading();
    }
  },

  checkAnswer(user, correct) {
    if (!user || !correct) return false;
    const u = user.replace(/\s+/g, '').toLowerCase();
    const c = correct.replace(/\s+/g, '').toLowerCase();
    // Exact match only — no substring matching to avoid "10" matching "100"
    return u === c;
  },

  goBack() {
    wx.navigateBack({
      fail: () => wx.switchTab({ url: '/pages/index/index' })
    });
  },

  onShareAppMessage() {
    const correct = this.data.isCorrect;
    const title = this.data.phase === 'result'
      ? (correct ? '我在小错题家答对了一道变式题，继续加油！' : '这道变式题有点难，再来一次！')
      : '小错题家 - AI 出变式题帮你精准练习';
    return {
      title: title,
      path: '/pages/index/index',
      imageUrl: ''
    };
  }
});
