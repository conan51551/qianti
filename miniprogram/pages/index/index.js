Page({
  data: { mistakes: [], loading: true },
  onShow() { this.loadMistakes(); },
  async loadMistakes() {
    this.setData({ loading: true });
    try {
      const res = await wx.cloud.callFunction({ name: 'listMistakes' });
      const mistakes = (res.result.data || []).map(item => ({ ...item, createdAtText: new Date(item.createdAt).toLocaleDateString() }));
      this.setData({ mistakes, loading: false });
    } catch (e) { this.setData({ loading: false }); wx.showToast({ title: '加载失败', icon: 'none' }); }
  },
  toAdd() { wx.navigateTo({ url: '/pages/mistake-form/mistake-form' }); },
  openDetail(e) { wx.navigateTo({ url: `/pages/mistake-form/mistake-form?id=${e.currentTarget.dataset.id}` }); }
});
