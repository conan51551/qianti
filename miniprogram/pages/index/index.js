const { call } = require('../../utils/cloud');

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
    untrackedCount: 0
  },

  onShow() {
    this.loadMistakes();
  },

  async loadMistakes() {
    this.setData({ loading: true, error: false });
    try {
      const r = await call('listMistakes');
      const ms = (r.data || []).map(x => ({
        ...x,
        masteryLevel: typeof x.mastery === 'number' ? x.mastery : 0,
        createdAtText: this.formatDate(x.createdAt)
      }));
      const subjects = ['全部', ...new Set(ms.map(x => x.subject).filter(Boolean))];

      // Compute mastery counts
      let mastered = 0, familiar = 0, practicing = 0, untracked = 0;
      ms.forEach(m => {
        const level = m.masteryLevel;
        if (level >= 3) mastered++;
        else if (level === 2) familiar++;
        else if (level === 1) practicing++;
        else untracked++;
      });

      this.setData({
        mistakes: ms,
        visibleMistakes: ms,
        subjects,
        activeSubject: '全部',
        masteredCount: mastered,
        familiarCount: familiar,
        practicingCount: practicing,
        untrackedCount: untracked,
        loading: false
      });
    } catch (e) {
      this.setData({ loading: false, error: true });
      wx.showToast({ title: '加载失败', icon: 'none' });
    }
  },

  formatDate(ts) {
    const d = new Date(ts);
    const now = new Date();
    const diff = (now - d) / (1000 * 60 * 60 * 24);
    if (diff < 1) return '今天';
    if (diff < 2) return '昨天';
    if (diff < 7) return Math.floor(diff) + '天前';
    return (d.getMonth() + 1) + '月' + d.getDate() + '日';
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
          this.setData({
            mistakes: this.data.mistakes.filter(x => x._id !== id),
            visibleMistakes: this.data.visibleMistakes.filter(x => x._id !== id)
          });
          wx.showToast({ title: '已删除' });
        } catch (_) {
          wx.showToast({ title: '删除失败', icon: 'none' });
        } finally {
          wx.hideLoading();
        }
      }
    });
  }
});
