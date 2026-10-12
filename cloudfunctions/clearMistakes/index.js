const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

exports.main = async () => {
  const { OPENID } = cloud.getWXContext();
  if (!OPENID) throw new Error('无法获取微信身份');

  const db = cloud.database();
  const _ = db.command;

  // Get all mistake IDs and image fileIDs for the user
  const r = await db.collection('mistakes')
    .where({ openid: OPENID })
    .limit(100)
    .get();

  const mistakes = r.data;
  let deletedImages = 0;

  // Delete associated images from cloud storage
  for (const m of mistakes) {
    if (m.imageFileId) {
      try {
        await cloud.deleteFile({ fileList: [m.imageFileId] });
        deletedImages++;
      } catch (_) {}
    }
  }

  // Delete all mistake records
  const deleteResult = await db.collection('mistakes')
    .where({ openid: OPENID })
    .remove();

  // Delete all practice records
  try {
    await db.collection('practices')
      .where({ openid: OPENID })
      .remove();
  } catch (_) {}

  return {
    deletedMistakes: deleteResult.stats ? deleteResult.stats.removed : mistakes.length,
    deletedImages
  };
};
