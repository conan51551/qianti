const { call } = require('../../utils/cloud');
const { formatDate } = require('../../utils/util');

Page({
  data: {
    mistakes: [],
    visibleMistakes: [],
    subjects: ['全部'],
    activeSubject: '全部',
    loading: true,
    error: false,
    masteredCount: 0,
    familiarCount: 0,
    practicingCount: 0,
    untrackedCount: 0,
    todayReview: []
  },

  _pollTimer: null,

  onShow() {
    this.loadMistakes();
  },

  onHide() {
    this._stopPolling();
  },

  onUnload() {
    this._stopPolling();
  },

  onPullDownRefresh() {
    this.loadMistakes().then(() => {
      wx.stopPullDownRefresh();
    });
  },

  async loadMistakes() {
    this.setData({ loading: true, error: false });
    try {
      const r = await call('listMistakes');
      this._applyMistakes(r.data || []);
      this._checkPending();
    } catch (e) {
      this.setData({ loading: false, error: true });
      wx.showToast({ title: '加载失败', icon: 'none' });
    }
  },

  _applyMistakes(rawList) {
    const ms = (rawList || []).map(x => ({
      ...x,
      masteryLevel: typeof x.mastery === 'number' ? x.mastery : 0,
      createdAtText: formatDate(x.createdAt)
    }));
    const subjects = ['全部', ...new Set(ms.map(x => x.subject).filter(Boolean))];

    let mastered = 0, familiar = 0, practicing = 0, untracked = 0;
    ms.forEach(m => {
      const level = m.masteryLevel;
      if (level >= 3) mastered++;
      else if (level === 2) familiar++;
      else if (level === 1) practicing++;
      else untracked++;
    });

    // Today's review: mastery < 2, created within last 3 days, sorted oldest first
    const now = Date.now();
    const threeDays = 3 * 24 * 60 * 60 * 1000;
    const todayReview = ms
      .filter(m => m.masteryLevel < 2 && (now - (m.createdAt || 0)) < threeDays)
      .sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0))
      .slice(0, 5)
      .map(m => ({
        ...m,
        reviewText: m.questionText ? m.questionText.slice(0, 30) : '照片错题'
      }));

    const activeSubject = this.data.activeSubject || '全部';
    this.setData({
      mistakes: ms,
      visibleMistakes: activeSubject === '全部'
        ? ms
        : ms.filter(x => x.subject === activeSubject),
      subjects,
      masteredCount: mastered,
      familiarCount: familiar,
      practicingCount: practicing,
      untrackedCount: untracked,
      todayReview,
      loading: false
    });
  },

  _checkPending() {
    const hasPending = this.data.mistakes.some(m => m.analysisStatus === 'pending');
    if (hasPending) {
      this._startPolling();
    } else {
      this._stopPolling();
    }
  },

  _startPolling() {
    this._stopPolling();
    this._pollTimer = setInterval(async () => {
      try {
        const r = await call('listMistakes');
        const newList = r.data || [];
        const oldMap = {};
        this.data.mistakes.forEach(m => { oldMap[m._id] = m; });

        let changed = false;
        newList.forEach(m => {
          const old = oldMap[m._id];
          if (old && old.analysisStatus === 'pending' && m.analysisStatus !== 'pending') {
            changed = true;
          }
        });

        if (changed) {
          this._applyMistakes(newList);
          this._checkPending();
        }
      } catch (_) {}
    }, 4000);
  },

  _stopPolling() {
    if (this._pollTimer) {
      clearInterval(this._pollTimer);
      this._pollTimer = null;
    }
  },

  filterSubject(e) {
    const s = e.currentTarget.dataset.subject;
    this.setData({
      activeSubject: s,
      visibleMistakes: s === '全部'
        ? this.data.mistakes
        : this.data.mistakes.filter(x => x.subject === s)
    });
  },

  openKnowledge() {
    wx.navigateTo({
      url: '/pages/knowledge/knowledge?subject=' + encodeURIComponent(this.data.activeSubject)
    });
  },

  openStats() {
    wx.navigateTo({
      url: '/pages/stats/stats'
    });
  },

  toAdd() {
    wx.switchTab({ url: '/pages/mistake-form/mistake-form' });
  },

  openDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: '/pages/mistake-detail/mistake-detail?id=' + id
    });
  },

  goPractice(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: '/pages/practice/practice?mistakeId=' + id
    });
  },

  reviewItem(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: '/pages/mistake-detail/mistake-detail?id=' + id
    });
  },

  deleteMistake(e) {
    const id = e.currentTarget.dataset.id;
    wx.showModal({
      title: '删除错题',
      content: '删除后将无法恢复，确定删除吗？',
      confirmColor: '#FF3B30',
      confirmText: '删除',
      cancelText: '取消',
      success: async r => {
        if (!r.confirm) return;
        wx.showLoading({ title: '删除中' });
        try {
          await call('deleteMistake', { id });
          const remaining = this.data.mistakes.filter(x => x._id !== id);
          this._applyMistakes(remaining);
          wx.showToast({ title: '已删除' });
        } catch (_) {
          wx.showToast({ title: '删除失败', icon: 'none' });
        } finally {
          wx.hideLoading();
        }
      }
    });
  },

  onShareAppMessage() {
    return {
      title: '小错题家 - 拍下错题，AI 自动分析错因并出变式题',
      path: '/pages/index/index',
      imageUrl: ''
    };
  },

  onShareTimeline() {
    return {
      title: '小错题家 - 拍下错题，AI 自动分析错因并出变式题',
      query: ''
    };
  }
});
