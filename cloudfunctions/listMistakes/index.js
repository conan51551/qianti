const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
exports.main = async () => { const { OPENID } = cloud.getWXContext(); const res = await db.collection('mistakes').where({ openid: OPENID }).orderBy('createdAt', 'desc').limit(100).get(); return { data: res.data }; };
