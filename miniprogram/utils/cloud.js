function call(name, data = {}) {
 if (!getApp().globalData.cloudReady) return Promise.reject(new Error('请先配置微信云环境ID'));
 return wx.cloud.callFunction({name,data}).then(r=>{if(r.result && r.result.error)throw new Error(r.result.error);return r.result;});
}
module.exports={call};
