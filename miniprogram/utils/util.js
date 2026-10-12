function formatDate(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  const now = new Date();
  const diff = (now - d) / (1000 * 60 * 60 * 24);
  if (diff < 1) return '今天';
  if (diff < 2) return '昨天';
  if (diff < 7) return Math.floor(diff) + '天前';
  if (diff < 30) return Math.floor(diff / 7) + '周前';
  return (d.getMonth() + 1) + '月' + d.getDate() + '日';
}

function formatFullDate(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  return d.getFullYear() + '年' + (d.getMonth() + 1) + '月' + d.getDate() + '日';
}

function masteryLabel(level) {
  return ['未练习', '练习中', '较熟悉', '已掌握'][level] || '未练习';
}

function masteryColor(level) {
  return ['', 'pill--orange', 'pill--blue', 'pill--green'][level] || '';
}

module.exports = { formatDate, formatFullDate, masteryLabel, masteryColor };
