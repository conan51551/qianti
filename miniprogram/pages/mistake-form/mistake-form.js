const {call}=require('../../utils/cloud');
Page({
 data:{form:{grade:'',subject:'数学',questionText:'',userAnswer:'',correctAnswer:''},localImage:'',saving:false},
 onShow(){const p=getApp().globalData.profile;if(p && !this.data.form.grade)this.setData({'form.grade':p.grade || ''});},
 chooseImage(){wx.chooseMedia({count:1,mediaType:['image'],sourceType:['camera','album'],success:({tempFiles})=>this.setData({localImage:tempFiles[0].tempFilePath})});},
 onInput(e){this.setData({[`form.${e.currentTarget.dataset.key}`]:e.detail.value});},
 async save(){if(this.data.saving)return;const {form,localImage}=this.data;if(!localImage)return wx.showToast({title:'请先拍照或选择图片',icon:'none'});if(!form.grade.trim() || !form.subject.trim())return wx.showToast({title:'请填写年级和学科',icon:'none'});this.setData({saving:true});try{await call('login');const ext=localImage.split('.').pop();const r=await wx.cloud.uploadFile({cloudPath:`mistakes/${Date.now()}-${Math.random().toString(36).slice(2)}.${/^(jpg|jpeg|png|webp)$/i.test(ext)?ext:'jpg'}`,filePath:localImage});const saved=await call('addMistake',{...form,imageFileId:r.fileID});call('analyzeMistake',{...form,imageFileId:r.fileID,mistakeId:saved._id}).catch(()=>{});this.setData({localImage:'','form.questionText':'','form.userAnswer':'','form.correctAnswer':''});wx.showToast({title:'已收录，正在分析'});wx.switchTab({url:'/pages/index/index'});}catch(e){wx.showToast({title:'保存失败，请检查云服务',icon:'none'});}finally{this.setData({saving:false});}}
});
