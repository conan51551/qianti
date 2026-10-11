const cloud = require('wx-server-sdk');
const https = require('https');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const FALLBACK = {
  knowledgePoints: [], knowledgeDetails: [], knowledgeSchemaVersion: 1, errorType: '待分析',
  explanation: '暂时无法完成 AI 分析，请补充题目文字后重试。',
  reviewAdvice: '先复习这道题涉及的知识点。', confidence: 0
};

async function imagePart(fileId) {
  if (!fileId) return null;
  const downloaded = await cloud.downloadFile({ fileID: fileId });
  const content = downloaded.fileContent;
  if (!content || !content.length) return null;
  // 微信云存储返回 Buffer；用 data URL 发送给支持视觉的豆包模型。
  const mime = fileId.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg';
  return { type: 'image_url', image_url: { url: `data:${mime};base64,${content.toString('base64')}` } };
}

function parseModelJson(text) {
  const cleaned = String(text || '').replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
  const start = cleaned.indexOf('{'); const end = cleaned.lastIndexOf('}');
  if (start < 0 || end <= start) throw new Error('模型未返回 JSON');
  return JSON.parse(cleaned.slice(start, end + 1));
}

function postJson(url, headers, body) {
  return new Promise((resolve, reject) => {
    const target = new URL(url);
    const req = https.request({ hostname: target.hostname, port: target.port || 443, path: target.pathname + target.search, method: 'POST', headers }, res => {
      let raw = '';
      res.setEncoding('utf8');
      res.on('data', chunk => { raw += chunk; });
      res.on('end', () => { let data; try { data = JSON.parse(raw); } catch (_) { return reject(new Error(`接口返回非JSON (${res.statusCode})`)); } if (res.statusCode < 200 || res.statusCode >= 300) return reject(new Error(`AI接口 ${res.statusCode}: ${data.error?.message || data.message || raw.slice(0, 300)}`)); resolve(data); });
    });
    req.on('error', reject); req.setTimeout(30000, () => req.destroy(new Error('AI接口请求超时'))); req.write(body); req.end();
  });
}

exports.main = async (e = {}) => {
  const base = process.env.AI_BASE_URL;
  const key = process.env.AI_API_KEY;
  const model = process.env.AI_MODEL;
  if (!base || !key || !model || (!e.questionText && !e.imageFileId)) return FALLBACK;
  try {
    const parts = [{ type: 'text', text: `年级：${e.grade || '未填写'}\n学科：${e.subject || '未填写'}\n题目文字：${e.questionText || '请从图片中识别题目'}\n我的答案：${e.userAnswer || '未填写'}\n正确答案：${e.correctAnswer || '未填写'}\n请识别图片中的题目和手写答案，并归纳错因。` }];
    const image = await imagePart(e.imageFileId);
    if (image) parts.push(image);
    const j = await postJson(base.replace(/\/$/, '') + '/chat/completions', { 'Content-Type': 'application/json', Authorization: 'Bearer ' + key }, JSON.stringify({ model, temperature: 0.2, messages: [
        { role: 'system', content: '你是小学老师。识别题目并提炼实际考查的1至5个知识点，使用简洁、稳定的标准名称，不要把粗心等错因当成知识点。只输出JSON：knowledgePoints为知识点名称数组；knowledgeDetails为对象数组，每项包含name知识点名称、module所属知识模块、description本题如何考查该知识点、prerequisites前置知识名称数组、role（primary核心考点或supporting辅助知识）、confidence（0到1）；另含questionText识别出的题目、errorType、explanation、reviewAdvice、confidence数字。没有教材版本信息时不要臆造教材章节、课标编号或官方大纲归属。看不清时明确说明不确定，不能虚构题目或学生错误。' },
        { role: 'user', content: parts }
      ] }));
    const t = j.choices?.[0]?.message?.content || '';
    const parsed = parseModelJson(t);
    const names = value => Array.isArray(value) ? [...new Set(value.filter(x => typeof x === 'string').map(x => x.trim()).filter(Boolean))].slice(0, 10) : [];
    const details = (Array.isArray(parsed.knowledgeDetails) ? parsed.knowledgeDetails : []).filter(x => x && typeof x.name === 'string' && x.name.trim()).slice(0, 5).map(x => ({
      name: x.name.trim(), subject: e.subject || '', grade: e.grade || '',
      module: typeof x.module === 'string' ? x.module.trim() : '',
      description: typeof x.description === 'string' ? x.description : '',
      prerequisites: names(x.prerequisites), role: x.role === 'supporting' ? 'supporting' : 'primary',
      confidence: typeof x.confidence === 'number' ? Math.max(0, Math.min(1, x.confidence)) : 0,
      source: 'ai', reviewStatus: 'unreviewed'
    }));
    const analysis = { ...FALLBACK,
      errorType: typeof parsed.errorType === 'string' ? parsed.errorType : FALLBACK.errorType,
      explanation: typeof parsed.explanation === 'string' ? parsed.explanation : FALLBACK.explanation,
      reviewAdvice: typeof parsed.reviewAdvice === 'string' ? parsed.reviewAdvice : FALLBACK.reviewAdvice,
      confidence: typeof parsed.confidence === 'number' ? Math.max(0, Math.min(1, parsed.confidence)) : 0,
      knowledgePoints: names(details.length ? details.map(x => x.name) : parsed.knowledgePoints),
      knowledgeDetails: details, knowledgeSchemaVersion: 1,
      recognizedQuestionText: typeof parsed.questionText === 'string' ? parsed.questionText : ''
    };
    if (e.mistakeId) await cloud.database().collection('mistakes').doc(e.mistakeId).update({ data: { ...analysis, analysisStatus: 'done', updatedAt: Date.now() } });
    return analysis;
  } catch (err) { console.error('analyzeMistake failed', err && err.message, err && err.stack); if (e.mistakeId) { try { await cloud.database().collection('mistakes').doc(e.mistakeId).update({ data: { analysisStatus: 'failed', updatedAt: Date.now() } }); } catch (_) {} } return FALLBACK; }
};
