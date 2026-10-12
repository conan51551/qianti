const { call } = require('../../utils/cloud');

Page({
  data: {
    mistakeId: '',
    mistake: null,
    masteryLevel: 0,
    masteryLabel: '未练习',
    masteryColor: '',
    createdAtText: '',
    lastPracticeText: '',
    loading: true,
    error: false
  },

  onLoad(options) {
    if (options.id) {
      this.setData({ mistakeId: options.id });
      this.loadDetail();
    } else {
      this.setData({ loading: false, error: true });
    }
  },

  onShow() {
    if (this.data.mistakeId && !this.data.loading) {
      this.loadDetail();
    }
  },

  async loadDetail() {
    this.setData({ loading: true, error: false });
    try {
      const r = await call('listMistakes');
      const mistake = (r.data || []).find(m => m._id === this.data.mistakeId);
      if (!mistake) {
        this.setData({ loading: false, error: true });
        return;
      }

      const level = typeof mistake.mastery === 'number' ? mistake.mastery : 0;
      const labels = ['未练习', '练习中', '较熟悉', '已掌握'];
      const colors = ['', 'pill--orange', 'pill--blue', 'pill--green'];

      this.setData({
        mistake,
        masteryLevel: level,
        masteryLabel: labels[level] || '未练习',
        masteryColor: colors[level] || '',
        createdAtText: this.formatDate(mistake.createdAt),
        lastPracticeText: mistake.lastPracticeAt ? this.formatDate(mistake.lastPracticeAt) : '',
        loading: false
      });
    } catch (e) {
      this.setData({ loading: false, error: true });
    }
  },

  formatDate(ts) {
    if (!ts) return '';
    const d = new Date(ts);
    const now = new Date();
    const diff = (now - d) / (1000 * 60 * 60 * 24);
    if (diff < 1) return '今天';
    if (diff < 2) return '昨天';
    if (diff < 7) return Math.floor(diff) + '天前';
    return (d.getMonth() + 1) + '月' + d.getDate() + '日';
  },

  previewImage() {
    if (this.data.mistake && this.data.mistake.imageFileId) {
      wx.previewImage({
        urls: [this.data.mistake.imageFileId]
      });
    }
  },

  goPractice() {
    wx.navigateTo({
      url: '/pages/practice/practice?mistakeId=' + this.data.mistakeId
    });
  },

  deleteMistake() {
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
          await call('deleteMistake', { id: this.data.mistakeId });
          wx.showToast({ title: '已删除' });
          setTimeout(() => wx.navigateBack(), 800);
        } catch (_) {
          wx.showToast({ title: '删除失败', icon: 'none' });
        } finally {
          wx.hideLoading();
        }
      }
    });
  }
});
