const cloud=require('wx-server-sdk');
cloud.init({env:cloud.DYNAMIC_CURRENT_ENV});
exports.main=async(event)=>{const {OPENID}=cloud.getWXContext();if(!OPENID)throw new Error('无法获取微信身份');const name=String(event.name||'').trim(),age=String(event.age||''),grade=String(event.grade||'').trim();if(name.length>20||grade.length>20||(age && (!/^\d+$/.test(age)||Number(age)<1||Number(age)>99)))throw new Error('个人信息格式不正确');const profile={name,age,grade};await cloud.database().collection('profiles').doc(OPENID).set({data:{...profile,openid:OPENID,updatedAt:Date.now()}});return {profile};};
