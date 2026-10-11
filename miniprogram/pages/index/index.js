const { call } = require('../../utils/cloud');

Page({
  data: {
    mistakes: [],
    visibleMistakes: [],
    subjects: ['全部'],
    activeSubject: '全部',
    loading: true,
    error: false
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
        createdAtText: this.formatDate(x.createdAt)
      }));
      const subjects = ['全部', ...new Set(ms.map(x => x.subject).filter(Boolean))];
      this.setData({
        mistakes: ms,
        visibleMistakes: ms,
        subjects,
        activeSubject: '全部',
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
    if (diff < 7) return `${Math.floor(diff)}天前`;
    return `${d.getMonth() + 1}月${d.getDate()}日`;
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

  toAdd() {
    wx.switchTab({ url: '/pages/mistake-form/mistake-form' });
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
  },

  generateQuestion(e) {
    const item = this.data.mistakes.find(x => x._id === e.currentTarget.dataset.id);
    if (!item) return;
    wx.showLoading({ title: '出题中' });
    call('generateQuestion', item)
      .then(r => wx.showModal({
        title: 'AI 变式题',
        content: [r.questionText, '答案：' + r.answer, '解析：' + r.explanation].join('\n\n'),
        showCancel: false,
        confirmText: '知道了'
      }))
      .catch(_ => wx.showToast({ title: '出题失败', icon: 'none' }))
      .finally(() => wx.hideLoading());
  },

  openDetail(e) {
    const item = this.data.mistakes.find(m => m._id === e.currentTarget.dataset.id);
    if (!item) return;
    wx.showModal({
      title: item.subject + '错题',
      content: [
        item.questionText || '照片错题',
        '我的答案：' + (item.userAnswer || '未填写'),
        '正确答案：' + (item.correctAnswer || '未填写')
      ].join('\n\n'),
      showCancel: !!item.imageFileId,
      cancelText: '查看照片',
      confirmText: '关闭'
    });
  }
});
