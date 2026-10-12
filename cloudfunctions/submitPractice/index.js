const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event = {}) => {
  const { OPENID } = cloud.getWXContext();
  const { mistakeId, questionText, userAnswer, correctAnswer, isCorrect, explanation, knowledgePoints } = event;

  if (!OPENID) throw new Error('未获取到用户身份');
  if (!mistakeId || typeof mistakeId !== 'string') throw new Error('缺少错题编号');
  if (typeof userAnswer !== 'string') throw new Error('请填写答案');
  if (typeof isCorrect !== 'boolean') throw new Error('缺少判断结果');

  // 1. Verify the mistake belongs to this user
  const mistakeDoc = await db.collection('mistakes').doc(mistakeId).get();
  if (!mistakeDoc.data || mistakeDoc.data.openid !== OPENID) {
    throw new Error('无权操作这道错题');
  }

  const now = Date.now();

  // 2. Create a practice record
  const practiceData = {
    openid: OPENID,
    mistakeId,
    subject: mistakeDoc.data.subject || '',
    grade: mistakeDoc.data.grade || '',
    questionText: typeof questionText === 'string' ? questionText : '',
    userAnswer,
    correctAnswer: typeof correctAnswer === 'string' ? correctAnswer : '',
    isCorrect,
    explanation: typeof explanation === 'string' ? explanation : '',
    knowledgePoints: Array.isArray(knowledgePoints) ? knowledgePoints : [],
    createdAt: now
  };

  await db.collection('practices').add({ data: practiceData });

  // 3. Update mastery on the mistake
  // mastery levels: 0 = untracked, 1 = practicing, 2 = familiar, 3 = mastered
  const currentMastery = typeof mistakeDoc.data.mastery === 'number' ? mistakeDoc.data.mastery : 0;
  let newMastery = currentMastery;

  if (isCorrect) {
    newMastery = Math.min(3, currentMastery + 1);
  } else {
    // Wrong answer: if mastery was high, reduce slightly
    newMastery = Math.max(0, currentMastery - 1);
  }

  await db.collection('mistakes').doc(mistakeId).update({
    data: {
      mastery: newMastery,
      lastPracticeAt: now,
      lastPracticeCorrect: isCorrect,
      updatedAt: now
    }
  });

  return {
    ok: true,
    mastery: newMastery,
    isCorrect,
    masteryLabel: masteryLabel(newMastery)
  };
};

function masteryLabel(level) {
  switch (level) {
    case 0: return '未练习';
    case 1: return '练习中';
    case 2: return '较熟悉';
    case 3: return '已掌握';
    default: return '未练习';
  }
}
