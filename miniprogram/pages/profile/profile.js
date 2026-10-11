const { call } = require('../../utils/cloud');

Page({
  data: {
    form: { name: '', age: '', grade: '' },
    loggedIn: false,
    loading: false,
    saving: false
  },

  onShow() {
    if (this.data.loggedIn) {
      this.login();
    }
  },

  async login() {
    if (this.data.loading) return;
    this.setData({ loading: true });
    try {
      const r = await call('login');
      this.setData({ loggedIn: true, form: r.profile });
      getApp().globalData.profile = r.profile;
    } catch (e) {
      wx.showToast({ title: e.message || '登录失败', icon: 'none' });
    } finally {
      this.setData({ loading: false });
    }
  },

  onInput(e) {
    this.setData({ [`form.${e.currentTarget.dataset.key}`]: e.detail.value });
  },

  async save() {
    if (this.data.saving) return;
    if (!this.data.loggedIn) return this.login();

    const { age } = this.data.form;
    if (age && (!/^\d+$/.test(age) || Number(age) < 1 || Number(age) > 99)) {
      return wx.showToast({ title: '请输入有效年龄', icon: 'none' });
    }

    this.setData({ saving: true });
    try {
      const r = await call('saveProfile', this.data.form);
      getApp().globalData.profile = r.profile;
      wx.showToast({ title: '已保存到云端', icon: 'success' });
    } catch (e) {
      wx.showToast({ title: e.message || '保存失败', icon: 'none' });
    } finally {
      this.setData({ saving: false });
    }
  },

  showAbout() {
    wx.showModal({
      title: '关于小错题家',
      content: '小错题家 v1.0.0\n\n面向小学 1-6 年级的错题归纳与 AI 练习生成工具。\n\n数据安全存储于微信云服务，按用户隔离。',
      showCancel: false,
      confirmText: '知道了'
    });
  }
});
