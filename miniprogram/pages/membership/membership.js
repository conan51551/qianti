Page({
  data: {
    faqOpen0: false,
    faqOpen1: false,
    faqOpen2: false
  },

  toggleFaq(e) {
    const id = e.currentTarget.dataset.id;
    this.setData({ ['faqOpen' + id]: !this.data['faqOpen' + id] });
  },

  subscribeMonthly() {
    wx.showModal({
      title: '开通月度会员',
      content: '月度会员 ¥19.9/月，可随时取消。\n\n当前为演示版本，正式上线后支持微信支付自动续费。',
      confirmText: '了解',
      showCancel: false,
      confirmColor: '#007AFF'
    });
  },

  subscribeAnnual() {
    wx.showModal({
      title: '开通年度会员',
      content: '年度会员 ¥168/年，日均不到 5 毛钱。\n\n当前为演示版本，正式上线后支持微信支付自动续费。',
      confirmText: '了解',
      showCancel: false,
      confirmColor: '#34C759'
    });
  }
});
