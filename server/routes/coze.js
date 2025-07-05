const express = require('express')
const router = express.Router()
const axios = require('axios')

const COZE_TOKEN = 'pat_xxxx'
const BOT_ID = '751xxxx'

// 处理 Coze 响应格式
function handleResult(message) {
    try {
        let content = message.content?.trim()

        const codeBlockMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
        if (codeBlockMatch) {
            content = codeBlockMatch[1];  // 提取中间 JSON 字符串
        }
        
        // 优先尝试作为完整 JSON 对象解析（如 type 为 "answer" 时）
        try {
            const parsed = JSON.parse(content)
            // 如果解析后是带 arguments 的函数调用
            if (parsed?.arguments?.query_text) {
                return JSON.parse(parsed.arguments.query_text)
            }
            return parsed // 直接是目标 JSON 数据
        } catch (innerErr) {
            // 如果第一次 JSON.parse(content) 失败，再考虑 content 是 function_call 的嵌套格式
            if (message.type === 'function_call') {
                const raw = JSON.parse(content)
                return JSON.parse(raw.arguments.query_text)
            }
            throw innerErr // 如果也不是 function_call，就抛出
        }
    } catch (e) {
        console.error('❌ 解析 Coze 响应失败:', e, '内容:', message.content)
        return null
    }
}


router.post('/graph', async (req, res) => {
    const userQuery = req.body.query

    const prompt = `
请你扮演一个知识图谱规划助手，我需要你根据指定主题生成一个学习路径，并**严格按照 JSON 格式输出**。

输出格式如下（不要做任何更改）：
{
  "nodes": [
    { "id": 1, "label": "高等数学", "layer": 1 }
  ],
  "edges": [
    { "source": 1, "target": 2 }
  ]
}

1. **只返回 JSON 数据**，不要返回图片、解释、链接、Markdown、代码块符号（\`\`\`）或任何附加信息；
2. 每个节点应包含：
   - \`id\`: 整数，节点唯一编号；
   - \`label\`: 知识点名称；
   - \`layer\`: 所属学习阶段，整数（例如 1 表示第一阶段）；
3. 边（edges）连接的层级关系要清晰合理；
4. 最终返回的数据必须是**标准、可被 JSON.parse() 成功解析的 JSON 对象**，不要返回字符串或伪 JSON；
5. 不允许有自然语言解释说明，只返回格式正确的 JSON 数据；

请确保你返回的结果满足上述所有要求。
`

    const fullQuery = userQuery + '\n' + prompt

    console.log('📝 userQuery 类型:', typeof userQuery, '内容:', userQuery);

    try {
        const start = Date.now()

        const response = await axios.post(
            'https://api.coze.cn/open_api/v2/chat',
            {
                bot_id: BOT_ID,
                stream: false,
                user: '1234',
                query:fullQuery
            },
            {
                headers: {
                    Authorization: `Bearer ${COZE_TOKEN}`,
                    'Content-Type': 'application/json'
                },
                // params: {
                //     query: fullQuery
                // }
            }
        )

        const duration = ((Date.now() - start) / 1000).toFixed(2)
        console.log(`⏱️ Coze 响应时间: ${duration}s`)

        const messages = response.data?.messages || []
        const extracted = messages.length >= 3 ? handleResult(messages[2]) : null

        // console.log('📩 Coze API 原始返回:', JSON.stringify(response.data, null, 2))

        console.log('Coze 返回消息:', messages);

        if (extracted) {
            res.json(extracted)
        } else {
            res.status(500).json({ error: '无有效响应内容' })
        }
    } catch (error) {
        console.error('❌ Coze 请求失败:', error?.response?.data || error.message)
        res.status(500).json({ error: '调用 Coze API 失败' })
    }
})

router.post('/test', async (req, res) => {
    const { query } = req.body || {};
    const testResponse = {
        message: '后端测试成功',
        receivedQuery: query || null,
        timestamp: new Date().toISOString(),
        simulatedGraph: {
            nodes: [
                { id: 1, label: "测试节点", layer: 1 }
            ],
            edges: []
        }
    };
    res.json(testResponse);
});

module.exports = router
