import React, { useState, useEffect, useImperativeHandle, forwardRef } from 'react'
import { useThree } from '@react-three/fiber'
import DraggableNode from './components/DraggableNode'
import Edge from './components/Edge'

// 计算每层的圆环半径
const radiusPerLayer = 5;

const Graph = forwardRef(({ highlightedNodeId }, ref) => {
    const [data, setData] = useState({ nodes: [], edges: [] })
    const [positions, setPositions] = useState({})
    const { camera } = useThree()

    useImperativeHandle(ref, () => ({
        data,
        positions,
        camera
    }))

    useEffect(() => {
        fetch('/graph.json')
            .then(res => res.json())
            .then(json => {
                setData(json)
                // 初始化节点位置
                const pos = {}

                // 分组：每层一个数组
                const layers = {}
                json.nodes.forEach(n => {
                    if (!layers[n.layer]) layers[n.layer] = []
                    layers[n.layer].push(n)
                })

                // 先设置最底层（例如 layer 0）为圆心或固定位置
                layers[0]?.forEach((node, idx) => {
                    pos[node.id] = [0, 0, 0]
                })

                // 从第一层开始依次排列
                Object.entries(layers).forEach(([layerStr, nodes]) => {
                    const layer = Number(layerStr)
                    if (layer === 0) return // 跳过0层

                    nodes.forEach((node, idxInLayer) => {
                        const parentEdges = json.edges.filter(e => e.target === node.id)
                        const parentPositions = parentEdges
                            .map(edge => pos[edge.source])
                            .filter(p => !!p)

                        let cx = 0, cy = 0, cz = 0
                        if (parentPositions.length > 0) {
                            parentPositions.forEach(p => {
                                cx += p[0];
                                cy += p[1];
                                cz += p[2]
                            })
                            cx /= parentPositions.length
                            cy /= parentPositions.length
                            cz /= parentPositions.length
                        }

                        // 每个节点自己一个圆，避免重叠：引入本层节点索引偏移
                        const baseAngle = (idxInLayer / nodes.length) * 2 * Math.PI
                        const randomOffset = (Math.random() - 0.5) * (Math.PI / 6)  // ±15度随机偏移
                        const angle = baseAngle + randomOffset
                        const r = radiusPerLayer  // 所有层统一使用同样的半径


                        pos[node.id] = [
                            cx + r * Math.cos(angle),
                            layer * 3,  // 固定高度层级
                            cz + r * Math.sin(angle)
                        ]
                    })
                })

                setPositions(pos)
            })
            .catch(err => console.error('加载graph.json失败', err))
    }, [])

    // 拖动更新位置（伪代码，具体实现依赖你用的三维库）
    const onDragNode = (id, newPos) => {
        setPositions(prev => ({
            ...prev,
            [id]: newPos
        }))
    }

    return (
        <group>
            {data.nodes.map(node => {
                const position = positions[node.id] || [0, 0, 0]

                // 计算节点连接数：只算出现次数（可以双向）
                const degree = data.edges.filter(
                    e => e.source === node.id || e.target === node.id
                ).length

                return (
                    <DraggableNode
                        key={node.id}
                        position={position}
                        label={node.label}
                        draggable={true}
                        highlighted={highlightedNodeId === node.id}
                        degree={degree}
                        onDrag={(pos) => onDragNode(node.id, pos)}
                    />
                )
            })}

            {data.edges.map((edge, i) => {
                const from = positions[edge.source]
                const to = positions[edge.target]
                if (!from || !to) return null
                return <Edge key={i} start={from} end={to} />
            })}
        </group>
    )
})

export default Graph