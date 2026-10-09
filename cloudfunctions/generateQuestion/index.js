const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
exports.main = async (event) => ({ questionText: `请根据这道题重新练习：${event.questionText || ''}`, answer: '', explanation: 'AI 服务配置完成后会生成完整变式题。', difficulty: 'easy', knowledgePoints: [] });
