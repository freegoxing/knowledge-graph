const express = require('express')
const fs = require('fs')
const path = require('path')
const cors = require('cors')

const app = express()
const PORT = 3001

// 允许跨域访问
app.use(cors())
app.use(express.json())

const graphPath = path.join(__dirname, './data/graph.json')

// 获取图数据
app.get('/graph', (req, res) => {
    fs.readFile(graphPath, 'utf8', (err, data) => {
        if (err) {
            console.error('读取图数据失败:', err)
            return res.status(500).send('读取失败')
        }
        res.type('application/json').send(data)
    })
})

// 更新图数据
app.post('/update-graph', (req, res) => {
    fs.writeFile(graphPath, JSON.stringify(req.body, null, 2), 'utf8', (err) => {
        if (err) {
            console.error('保存图数据失败:', err)
            return res.status(500).send('保存失败')
        }
        res.send('保存成功')
    })
})

app.listen(PORT, () => {
    console.log(`✅ 图数据服务已启动：http://localhost:${PORT}`)
})
