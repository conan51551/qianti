const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext();
  const { grade, subject, questionText, userAnswer = '', correctAnswer = '', imageFileId = '' } = event;
  if (!OPENID || typeof grade !== 'string' || !grade.trim() || typeof subject !== 'string' || !subject.trim() || typeof questionText !== 'string' || questionText.length > 10000 || typeof imageFileId !== 'string') throw new Error('错题信息不完整');
const createdAt=Date.now();const result=await db.collection('mistakes').add({data:{openid:OPENID,grade,subject,questionText,userAnswer,correctAnswer,imageFileId,mastery:0,analysisStatus:'pending',createdAt,updatedAt:createdAt}});return result;
};
