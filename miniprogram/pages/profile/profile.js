const { call } = require('../../utils/cloud');

const GRADE_OPTIONS = ['一年级', '二年级', '三年级', '四年级', '五年级', '六年级'];

Page({
  data: {
    form: { name: '', age: '', grade: '' },
    loggedIn: false,
    loading: false,
    saving: false,
    gradeOptions: GRADE_OPTIONS,
    gradeIndex: 2
  },

  onShow() {
    if (!this.data.loggedIn && !this.data._loaded) {
      this.setData({ _loaded: true });
      this.login();
    }
  },

  async login() {
    if (this.data.loading) return;
    this.setData({ loading: true });
    try {
      const r = await call('login');
      const gradeIndex = r.profile.grade ? GRADE_OPTIONS.indexOf(r.profile.grade) : 2;
      this.setData({
        loggedIn: true,
        form: r.profile,
        gradeIndex: gradeIndex >= 0 ? gradeIndex : 2
      });
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

  onGradeChange(e) {
    const idx = Number(e.detail.value);
    this.setData({
      gradeIndex: idx,
      'form.grade': GRADE_OPTIONS[idx]
    });
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

  showPrivacy() {
    wx.showModal({
      title: '隐私说明',
      content: '小错题家高度重视你的隐私：仅收集与错题相关的数据（题目图片、文字、答案），不收集其他任何信息。所有数据存储在微信云服务，按微信用户身份隔离，仅你本人可访问。图片仅用于 AI 分析错题，可随时删除。你可以随时导出或清空所有数据。',
      showCancel: false,
      confirmText: '知道了',
      confirmColor: '#007AFF'
    });
  },

  async exportMistakes() {
    wx.showLoading({ title: '导出中' });
    try {
      const r = await call('exportMistakes');
      if (!r.data || r.data.length === 0) {
        wx.hideLoading();
        wx.showToast({ title: '暂无错题可导出', icon: 'none' });
        return;
      }
      const json = JSON.stringify(r.data, null, 2);
      const fs = wx.getFileSystemManager();
      // 用 .txt 扩展名，兼容 wx.openDocument
      const path = `${wx.env.USER_DATA_PATH}/mistakes_export_${Date.now()}.txt`;
      fs.writeFileSync(path, json, 'utf8');
      wx.hideLoading();

      wx.openDocument({
        filePath: path,
        fileType: 'txt',
        showMenu: true,
        success: () => {},
        fail: () => {
          // 降级：尝试 shareFileMessage
          wx.shareFileMessage({
            filePath: path,
            fileName: `mistakes_export.txt`,
            fail: () => {
              // 最终降级：复制到剪贴板
              wx.setClipboardData({
                data: json,
                success: () => {
                  wx.showModal({
                    title: '已复制到剪贴板',
                    content: `已导出 ${r.count} 条错题记录，数据已复制到剪贴板，可粘贴到其他应用保存。`,
                    showCancel: false,
                    confirmText: '知道了',
                    confirmColor: '#007AFF'
                  });
                }
              });
            }
          });
        }
      });
    } catch (e) {
      wx.hideLoading();
      wx.showToast({ title: '导出失败', icon: 'none' });
    }
  },

  clearAllData() {
    wx.showModal({
      title: '清空所有错题',
      content: '此操作将删除你所有错题记录和关联图片，且无法恢复。确定要清空吗？',
      confirmColor: '#FF3B30',
      confirmText: '清空',
      cancelText: '取消',
      success: async r => {
        if (!r.confirm) return;
        wx.showLoading({ title: '清空中' });
        try {
          const result = await call('clearMistakes');
          wx.hideLoading();
          wx.showToast({ title: `已清空 ${result.deletedMistakes} 条` });
        } catch (e) {
          wx.hideLoading();
          wx.showToast({ title: '操作失败', icon: 'none' });
        }
      }
    });
  },

  showAbout() {
    wx.showModal({
      title: '关于小错题家',
      content: '小错题家 v1.0.0，面向小学 1-6 年级的错题归纳与 AI 练习生成工具。数据安全存储于微信云服务，按用户隔离。',
      showCancel: false,
      confirmText: '知道了'
    });
  }
});
