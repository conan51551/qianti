const config=require('./cloud-config');
App({globalData:{cloudReady:false,profile:null},onLaunch(){if(wx.cloud && config.env){wx.cloud.init({env:config.env,traceUser:true});this.globalData.cloudReady=true;}}});
