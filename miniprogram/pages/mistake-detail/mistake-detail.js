const { call } = require('../../utils/cloud');
const { formatDate, masteryLabel, masteryColor } = require('../../utils/util');

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
      const mistake = await call('getMistake', { id: this.data.mistakeId });
      if (!mistake) {
        this.setData({ loading: false, error: true });
        return;
      }

      const level = typeof mistake.mastery === 'number' ? mistake.mastery : 0;

      this.setData({
        mistake,
        masteryLevel: level,
        masteryLabel: masteryLabel(level),
        masteryColor: masteryColor(level),
        createdAtText: formatDate(mistake.createdAt),
        lastPracticeText: mistake.lastPracticeAt ? formatDate(mistake.lastPracticeAt) : '',
        loading: false
      });
    } catch (e) {
      this.setData({ loading: false, error: true });
    }
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
  },

  onShareAppMessage() {
    return {
      title: '小错题家 - AI 帮你分析错因、提炼知识点',
      path: '/pages/index/index',
      imageUrl: ''
    };
  }
});
