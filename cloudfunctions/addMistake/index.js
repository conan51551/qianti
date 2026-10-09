const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext();
  const { grade, subject, questionText, userAnswer = '', correctAnswer = '', imageFileId = '' } = event;
  return db.collection('mistakes').add({ data: { openid: OPENID, grade, subject, questionText, userAnswer, correctAnswer, imageFileId, mastery: 0, createdAt: Date.now(), updatedAt: Date.now() } });
};
