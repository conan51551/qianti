# AI 接入方案

云函数 `analyzeMistake` 使用 OpenAI 兼容接口。为 `analyzeMistake` 配置 `AI_BASE_URL`、`AI_API_KEY`、`AI_MODEL` 后，保存错题会自动分析知识点、错误类型、儿童讲解和复习建议；未配置时保留可用的待分析状态。

支持本地 Ollama、兼容接口的免费额度模型。密钥只放云函数环境变量，不进入小程序代码。
