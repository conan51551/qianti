const { call } = require('../../utils/cloud');

const GRADE_OPTIONS = ['一年级', '二年级', '三年级', '四年级', '五年级', '六年级'];
const SUBJECT_OPTIONS = ['数学', '语文', '英语'];

Page({
  data: {
    form: {
      grade: '',
      subject: '数学',
      questionText: '',
      userAnswer: '',
      correctAnswer: ''
    },
    localImage: '',
    saving: false,
    gradeOptions: GRADE_OPTIONS,
    subjectOptions: SUBJECT_OPTIONS,
    gradeIndex: 2,
    subjectIndex: 0
  },

  onShow() {
    const p = getApp().globalData.profile;
    if (p && p.grade) {
      const idx = GRADE_OPTIONS.indexOf(p.grade);
      if (idx >= 0) {
        this.setData({
          gradeIndex: idx,
          'form.grade': p.grade
        });
      }
    }
  },

  onGradeChange(e) {
    const idx = Number(e.detail.value);
    this.setData({
      gradeIndex: idx,
      'form.grade': GRADE_OPTIONS[idx]
    });
  },

  onSubjectChange(e) {
    const idx = Number(e.detail.value);
    this.setData({
      subjectIndex: idx,
      'form.subject': SUBJECT_OPTIONS[idx]
    });
  },

  chooseImage() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['camera', 'album'],
      success: ({ tempFiles }) => {
        this.setData({ localImage: tempFiles[0].tempFilePath });
      }
    });
  },

  removeImage() {
    this.setData({ localImage: '' });
  },

  previewLocalImage() {
    if (this.data.localImage) {
      wx.previewImage({ urls: [this.data.localImage] });
    }
  },

  onInput(e) {
    this.setData({ [`form.${e.currentTarget.dataset.key}`]: e.detail.value });
  },

  async save() {
    if (this.data.saving) return;
    const { form, localImage } = this.data;

    if (!localImage) {
      return wx.showToast({ title: '请先拍照或选择图片', icon: 'none' });
    }
    if (!form.grade || !form.subject) {
      return wx.showToast({ title: '请选择年级和学科', icon: 'none' });
    }

    this.setData({ saving: true });
    try {
      await call('login');
      const ext = localImage.split('.').pop();
      const r = await wx.cloud.uploadFile({
        cloudPath: `mistakes/${Date.now()}-${Math.random().toString(36).slice(2)}.${/^(jpg|jpeg|png|webp)$/i.test(ext) ? ext : 'jpg'}`,
        filePath: localImage
      });
      const saved = await call('addMistake', {
        grade: form.grade,
        subject: form.subject,
        questionText: form.questionText,
        userAnswer: form.userAnswer,
        correctAnswer: form.correctAnswer,
        imageFileId: r.fileID
      });

      // Fire and forget AI analysis
      call('analyzeMistake', {
        grade: form.grade,
        subject: form.subject,
        questionText: form.questionText,
        userAnswer: form.userAnswer,
        correctAnswer: form.correctAnswer,
        imageFileId: r.fileID,
        mistakeId: saved._id
      }).catch(() => {});

      this.setData({
        localImage: '',
        'form.questionText': '',
        'form.userAnswer': '',
        'form.correctAnswer': ''
      });
      wx.showToast({ title: '已收录，正在分析', icon: 'success' });
      wx.switchTab({ url: '/pages/index/index' });
    } catch (e) {
      wx.showToast({ title: '保存失败，请检查云服务', icon: 'none' });
    } finally {
      this.setData({ saving: false });
    }
  },

  onShareAppMessage() {
    return {
      title: '小错题家 - 拍下错题，AI 自动分析错因并出变式题',
      path: '/pages/index/index',
      imageUrl: ''
    };
  }
});
