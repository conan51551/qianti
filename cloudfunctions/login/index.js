const cloud=require('wx-server-sdk');
cloud.init({env:cloud.DYNAMIC_CURRENT_ENV});
exports.main=async()=>{const {OPENID}=cloud.getWXContext();if(!OPENID)throw new Error('无法获取微信身份');const db=cloud.database();for(const name of ['profiles','mistakes']){try{await db.createCollection(name);}catch(e){if(!/exist|已经存在|已存在/i.test(e.message||''))throw e;}}const r=await db.collection('profiles').where({openid:OPENID}).limit(1).get();return {loggedIn:true,profile:r.data[0] ? {name:r.data[0].name,age:r.data[0].age,grade:r.data[0].grade} : {name:'',age:'',grade:''}};};
