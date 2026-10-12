const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

exports.main = async () => {
  const { OPENID } = cloud.getWXContext();
  if (!OPENID) throw new Error('无法获取微信身份');

  const db = cloud.database();

  // Ensure all required collections exist
  for (const name of ['profiles', 'mistakes', 'practices']) {
    try {
      await db.createCollection(name);
    } catch (e) {
      if (!/exist|已经存在|已存在/i.test(e.message || '')) throw e;
    }
  }

  // Read user profile (doc ID = OPENID for efficiency)
  let profile = { name: '', age: '', grade: '' };
  try {
    const r = await db.collection('profiles').doc(OPENID).get();
    if (r.data) {
      profile = {
        name: r.data.name || '',
        age: r.data.age || '',
        grade: r.data.grade || ''
      };
    }
  } catch (_) {
    // doc not found — return empty profile
  }

  return { loggedIn: true, profile };
};
