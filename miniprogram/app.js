App({
  onLaunch() {
    if (!wx.cloud) throw new Error('请使用支持云开发的微信基础库');
    wx.cloud.init({ env: '请替换为你的云环境ID', traceUser: true });
  }
});
