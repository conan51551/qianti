const cloud = require('wx-server-sdk');
const https = require('https');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const FALLBACK = {
  questionText: '',
  answer: '',
  explanation: 'AI 服务暂不可用，请稍后重试或手动出题练习。',
  difficulty: 'easy',
  knowledgePoints: []
};

function request(url, headers, body) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const q = https.request({
      hostname: u.hostname,
      port: u.port || 443,
      path: u.pathname,
      method: 'POST',
      headers
    }, res => {
      let s = '';
      res.on('data', x => s += x);
      res.on('end', () => {
        try {
          const j = JSON.parse(s);
          if (res.statusCode < 200 || res.statusCode >= 300) {
            return reject(new Error(s));
          }
          resolve(j);
        } catch (e) {
          reject(e);
        }
      });
    });
    q.on('error', reject);
    q.setTimeout(30000, () => q.destroy(new Error('timeout')));
    q.end(body);
  });
}

exports.main = async (e = {}) => {
  const base = process.env.AI_BASE_URL;
  const key = process.env.AI_API_KEY;
  const model = process.env.AI_MODEL;

  if (!base || !key || !model) return FALLBACK;

  try {
    const prompt = `请根据以下小学错题生成一道相似但不同的新题，只输出JSON：{"questionText":"题目","answer":"答案","explanation":"解析","difficulty":"easy|medium|hard","knowledgePoints":["知识点"]}\n学科：${e.subject || ''}\n年级：${e.grade || ''}\n错题：${e.questionText || ''}\n重点考查这些知识点：${(e.knowledgePoints || []).join('、')}\n错误原因：${e.errorType || ''} ${e.explanation || ''}`;

    const content = [{ type: 'text', text: prompt }];

    if (e.imageFileId) {
      try {
        const img = await cloud.downloadFile({ fileID: e.imageFileId });
        const mime = e.imageFileId.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg';
        content.push({
          type: 'image_url',
          image_url: { url: 'data:' + mime + ';base64,' + img.fileContent.toString('base64') }
        });
      } catch (_) {}
    }

    const j = await request(
      base.replace(/\/$/, '') + '/chat/completions',
      { 'Content-Type': 'application/json', Authorization: 'Bearer ' + key },
      JSON.stringify({
        model,
        temperature: 0.7,
        messages: [
          { role: 'system', content: '你是小学老师，生成适合学生练习的变式题。' },
          { role: 'user', content }
        ]
      })
    );

    const t = j.choices?.[0]?.message?.content || '';
    const cleaned = t.replace(/^```json\s*|\s*```$/g, '').trim();
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');

    if (start < 0 || end <= start) return FALLBACK;

    const parsed = JSON.parse(cleaned.slice(start, end + 1));

    return {
      questionText: typeof parsed.questionText === 'string' ? parsed.questionText : '',
      answer: typeof parsed.answer === 'string' ? parsed.answer : '',
      explanation: typeof parsed.explanation === 'string' ? parsed.explanation : '',
      difficulty: typeof parsed.difficulty === 'string' ? parsed.difficulty : 'easy',
      knowledgePoints: Array.isArray(parsed.knowledgePoints) ? parsed.knowledgePoints : []
    };
  } catch (err) {
    console.error('generateQuestion failed', err && err.message);
    return FALLBACK;
  }
};
