const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
exports.main = async (event) => ({ knowledgePoints: [], errorType: '待分析', explanation: '请先配置云函数中的 AI 服务密钥。', reviewAdvice: '建议先复习这道题涉及的知识点。', confidence: 0 });
