const { call } = require('../../utils/cloud');

Page({
  data: {
    subject: '全部',
    groups: [],
    loading: true,
    empty: false,
    error: false
  },

  onLoad(o) {
    this.setData({ subject: o.subject ? decodeURIComponent(o.subject) : '全部' });
    this.load();
  },

  async load() {
    this.setData({ loading: true, error: false });
    try {
      const r = await call('listMistakes');
      const map = {};

      (r.data || [])
        .filter(x => this.data.subject === '全部' || x.subject === this.data.subject)
        .forEach(x => {
          const points = Array.isArray(x.knowledgeDetails) && x.knowledgeDetails.length
            ? x.knowledgeDetails
            : (Array.isArray(x.knowledgePoints)
              ? x.knowledgePoints.map(name => ({
                name,
                module: '未分类模块',
                description: '该知识点来自已收录错题。',
                prerequisites: []
              }))
              : []);

          points.forEach(p => {
            if (!p || !p.name) return;
            const key = (x.subject || '未分类') + '||' + p.name;
            if (!map[key]) {
              map[key] = {
                subject: x.subject || '未分类',
                name: p.name,
                module: p.module || '未分类模块',
                description: p.description || '该知识点来自已收录错题。',
                prerequisites: p.prerequisites || [],
                count: 0
              };
            }
            map[key].count++;
          });
        });

      const groupMap = {};
      Object.values(map).forEach(p => {
        if (!groupMap[p.subject]) groupMap[p.subject] = [];
        groupMap[p.subject].push(p);
      });

      this.setData({
        groups: Object.keys(groupMap).map(subject => ({ subject, points: groupMap[subject] })),
        loading: false,
        empty: !Object.keys(map).length
      });
    } catch (_) {
      this.setData({ loading: false, error: true });
    }
  },

  onShareAppMessage() {
    return {
      title: '小错题家 - AI 自动提炼知识点，按知识模块归类复习',
      path: '/pages/index/index',
      imageUrl: ''
    };
  }
});
