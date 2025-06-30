import React, { useState, useEffect, useImperativeHandle, forwardRef } from 'react'
import { useThree } from '@react-three/fiber'
import DraggableNode from './components/DraggableNode/DraggableNode'
import Edge from './components/Edge/Edge'

const radiusPerLayer = 3

// 计算节点位置的函数
function calculatePositions(data) {
    const pos = {}
    const layers = {}

    const allLayers = data.nodes.map(n => n.layer)
    const minLayer = Math.min(...allLayers)

    data.nodes.forEach(n => {
        n._adjustedLayer = n.layer - minLayer
    })

    // 按调整后的层分组
    data.nodes.forEach(n => {
        if (!layers[n._adjustedLayer]) layers[n._adjustedLayer] = []
        layers[n._adjustedLayer].push(n)
    })

    // 其他层
    Object.entries(layers).forEach(([layerStr, nodes]) => {
        const layer = Number(layerStr)
        if (layer === -1) return
        nodes.forEach((node, idxInLayer) => {
            const parentEdges = data.edges.filter(e => e.target === node.id)
            const parentPositions = parentEdges.map(e => pos[e.source]).filter(Boolean)
            let cx = 0, cy = 0, cz = 0
            if (parentPositions.length > 0) {
                parentPositions.forEach(p => {
                    cx += p[0]; cy += p[1]; cz += p[2]
                })
                cx /= parentPositions.length
                cy /= parentPositions.length
                cz /= parentPositions.length
            }
            const baseAngle = (idxInLayer / nodes.length) * 2 * Math.PI
            const angle = baseAngle + (Math.random() - 0.5) * (Math.PI / 6)
            const r = radiusPerLayer
            pos[node.id] = [cx + r * Math.cos(angle),  layer * -5, cz + r * Math.sin(angle)]
        })
    })

    return pos
}

// 计算力向导布局
function applyForces(data, positions, iterations = 100) {
    const K_REPEL = 20     // 斥力常数
    const K_ATTRACT = 0.4 // 弹簧吸引力常数
    const K_CENTER = 0.1  // 向心力常数
    const STEP_SIZE = 0.01

    const newPositions = { ...positions }

    for (let iter = 0; iter < iterations; iter++) {
        const forces = {}

        data.nodes.forEach(n => {
            forces[n.id] = [0, 0]
        })

        // 计算斥力
        for (let i = 0; i < data.nodes.length; i++) {
            const ni = data.nodes[i]
            const pi = newPositions[ni.id]
            for (let j = i + 1; j < data.nodes.length; j++) {
                const nj = data.nodes[j]
                if (ni.layer !== nj.layer) continue // 不同层跳过
                const pj = newPositions[nj.id]

                const dx = pi[0] - pj[0]
                const dz = pi[2] - pj[2]
                const distSq = dx * dx + dz * dz + 0.01 // 避免除0
                const force = K_REPEL / distSq

                const fx = force * dx
                const fz = force * dz

                forces[ni.id][0] += fx
                forces[ni.id][1] += fz
                forces[nj.id][0] -= fx
                forces[nj.id][1] -= fz
            }
        }

        // 向心力
        data.nodes.forEach(n => {
            const pos = newPositions[n.id]
            const fx = -K_CENTER * pos[0]
            const fz = -K_CENTER * pos[2]
            forces[n.id][0] += fx
            forces[n.id][1] += fz
        })

        // 相邻吸引力（弹簧力）
        data.edges.forEach(edge => {
            const source = newPositions[edge.source]
            const target = newPositions[edge.target]
            const sNode = data.nodes.find(n => n.id === edge.source)
            const tNode = data.nodes.find(n => n.id === edge.target)

            if (!source || !target || sNode.layer !== tNode.layer) return

            const dx = target[0] - source[0]
            const dz = target[2] - source[2]

            const fx = K_ATTRACT * dx
            const fz = K_ATTRACT * dz

            forces[edge.source][0] += fx
            forces[edge.source][1] += fz
            forces[edge.target][0] -= fx
            forces[edge.target][1] -= fz
        })

        // 应用力更新位置（仅 x 和 z 方向）
        data.nodes.forEach(n => {
            const pos = newPositions[n.id]
            const force = forces[n.id]
            pos[0] += force[0] * STEP_SIZE
            pos[2] += force[1] * STEP_SIZE
        })
    }

    return newPositions
}


const Graph = forwardRef(({
                              highlightedNodeId,
                              onRightClick,
                              onDragStateChange,
                              query
                          }, ref) => {
    const [data, setData] = useState({ nodes: [], edges: [] })
    const [positions, setPositions] = useState({})
    const [isDragging, setIsDragging] = useState(false)

    const { camera } = useThree()

    useImperativeHandle(ref, () => ({
        data,
        positions,
        camera,
        isDragging,
        setData: (newData) => {
            setData(newData)
            const initPos = calculatePositions(newData)
            const finalPos = applyForces(newData, initPos, 100)
            setPositions(finalPos)
        },
    }))

    const onDragNode = (id, newPos) => {
        onDragStart()
        setPositions((prev) => ({
            ...prev,
            [id]: newPos
        }))
    }

    const onDragStart = () => {
        if (!isDragging) {
            setIsDragging(true)
            onDragStateChange && onDragStateChange(true)
        }
    }

    const onDragEnd = () => {
        if (isDragging) {
            setIsDragging(false)
            onDragStateChange && onDragStateChange(false)

            // 同步更新节点的位置信息，注意保留y坐标不变
            setData(prevData => {
                const newNodes = prevData.nodes.map(n => {
                    if (positions[n.id]) {
                        return { ...n, position: positions[n.id] }
                    }
                    return n
                })
                return { ...prevData, nodes: newNodes }
            })
        }
    }

    // useEffect(() => {
    //     if (!query) return;
    //     console.log('query =', query)
    //
    //     fetch('http://localhost:3001/api/graph', {
    //         method: 'POST',
    //         headers: {
    //             'Content-Type': 'application/json'
    //         },
    //         body: JSON.stringify({ query })
    //     })
    //         .then(res => res.json())
    //         .then(json => {
    //             setData(json)
    //             const initPos = calculatePositions(json)
    //             const finalPos = applyForces(json, initPos, 100)
    //             setPositions(finalPos)
    //         })
    //         .catch(err => console.error('加载graph.json失败', err))
    // }, [query]) // ✅ 添加 query 作为依赖

    return (
        <group>
            {data.nodes.map((node) => {
                const position = positions[node.id] || [0, 0, 0]
                const degree = data.edges.filter(
                    (e) => e.source === node.id || e.target === node.id
                ).length

                return (
                    <DraggableNode
                        key={node.id}
                        id={node.id}
                        position={position}
                        label={node.label}
                        highlighted={highlightedNodeId === node.id}
                        degree={degree}
                        onDrag={(pos) => onDragNode(node.id, pos)}
                        onRightClick={(e) => onRightClick(e, node.id)}
                        onDragEnd={onDragEnd}
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
