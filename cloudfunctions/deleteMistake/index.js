const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
exports.main = async (event = {}) => {
  const { OPENID } = cloud.getWXContext(); const id = typeof event.id === 'string' ? event.id : '';
  if (!OPENID || !id) throw new Error('缺少错题编号');
  const doc = await db.collection('mistakes').doc(id).get();
  if (!doc.data || doc.data.openid !== OPENID) throw new Error('无权删除这道错题');
  await db.collection('mistakes').doc(id).remove();
  if (doc.data.imageFileId) { try { await cloud.deleteFile({ fileList: [doc.data.imageFileId] }); } catch (_) {} }
  return { ok: true };
};
