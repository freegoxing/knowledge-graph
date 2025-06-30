const express = require('express')
const router = express.Router()
const axios = require('axios')

const COZE_TOKEN = 'pat_btK7lS81ZcOiHS3IUzut6vVT7NFgLvt8r1vJZSU266PnqzaMque9o5ZR5lmPUjIr'
const BOT_ID = '7511694377740402740'

// 处理 Coze 响应格式
function handleResult(message) {
    try {
        const content = message.content
        const queryTextRaw = JSON.parse(content)
        return queryTextRaw.arguments.query_text
    } catch (e) {
        console.error('解析 Coze 响应失败:', e, "内容", message.content)
        return null
    }
}

router.post('/api/graph', async (req, res) => {
    const userQuery = req.body.query

    const prompt = `
请帮我规划一个学习路径。

要求返回 JSON 格式，格式如下：
{
  "nodes": [
    { "id": 1, "label": "高等数学", "layer": 1 }
  ],
  "edges": [
    { "source": 1, "target": 2 }
  ]
}

要求：
- 每个节点含字段：id（整数）、label（知识点名称）、layer（所属学习阶段，整数）
- 边只连接相同 layer 的节点
- 不要返回图片或解释文字，只返回 JSON 数据
`

    const fullQuery = userQuery + '\n' + prompt

    try {
        const start = Date.now()

        const response = await axios.post(
            'https://api.coze.cn/open_api/v2/chat',
            {
                bot_id: BOT_ID,
                stream: false,
                user: '1234'
            },
            {
                headers: {
                    Authorization: `Bearer ${COZE_TOKEN}`,
                    'Content-Type': 'application/json'
                },
                params: {
                    query: fullQuery
                }
            }
        )

        const duration = ((Date.now() - start) / 1000).toFixed(2)
        console.log(`⏱️ Coze 响应时间: ${duration}s`)

        const messages = response.data?.messages || []
        const extracted = messages.length >= 3 ? handleResult(messages[2]) : null

        console.log('Coze 返回消息:', messages);

        if (extracted) {
            res.json(JSON.parse(extracted))
        } else {
            res.status(500).json({ error: '无有效响应内容' })
        }
    } catch (error) {
        console.error('❌ Coze 请求失败:', error?.response?.data || error.message)
        res.status(500).json({ error: '调用 Coze API 失败' })
    }
})

module.exports = router
