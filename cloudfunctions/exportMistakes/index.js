const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

exports.main = async () => {
  const { OPENID } = cloud.getWXContext();
  if (!OPENID) throw new Error('无法获取微信身份');

  const db = cloud.database();
  const r = await db.collection('mistakes')
    .where({ openid: OPENID })
    .orderBy('createdAt', 'desc')
    .limit(100)
    .get();

  // Strip sensitive fields
  const data = r.data.map(m => {
    const { openid, ...safe } = m;
    return safe;
  });

  return { data, count: data.length, exportedAt: Date.now() };
};
