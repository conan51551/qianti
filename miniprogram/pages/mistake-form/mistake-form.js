Page({
  data: { form: { grade: '', subject: '数学', questionText: '', userAnswer: '', correctAnswer: '' }, imageFileId: '', saving: false },
  chooseImage() { wx.chooseMedia({ count: 1, mediaType: ['image'], sourceType: ['camera', 'album'], success: async ({ tempFiles }) => { wx.showLoading({ title: '上传中' }); try { const r = await wx.cloud.uploadFile({ cloudPath: `mistakes/${Date.now()}.jpg`, filePath: tempFiles[0].tempFilePath }); this.setData({ imageFileId: r.fileID }); } finally { wx.hideLoading(); } } }); },
  onInput(e) { this.setData({ [`form.${e.currentTarget.dataset.key}`]: e.detail.value }); },
  async save() {
    const { form } = this.data;
    if (!form.grade || !form.subject || !form.questionText) return wx.showToast({ title: '请填写年级、学科和题目', icon: 'none' });
    this.setData({ saving: true });
    try { await wx.cloud.callFunction({ name: 'addMistake', data: { ...form, imageFileId: this.data.imageFileId } }); wx.showToast({ title: '已保存' }); setTimeout(() => wx.navigateBack(), 500); }
    catch (e) { this.setData({ saving: false }); wx.showToast({ title: '保存失败', icon: 'none' }); }
  }
});
