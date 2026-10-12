const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

exports.main = async (event = {}) => {
  const { OPENID } = cloud.getWXContext();
  if (!OPENID) throw new Error('无法获取微信身份');
  if (!event.id) throw new Error('缺少错题ID');

  const db = cloud.database();
  const r = await db.collection('mistakes').doc(event.id).get();

  if (!r.data) throw new Error('错题不存在');
  if (r.data.openid !== OPENID) throw new Error('无权访问该错题');

  return r.data;
};
