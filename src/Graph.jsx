import React, { useState, useEffect, useImperativeHandle, forwardRef } from 'react'
import { useThree } from '@react-three/fiber'
import DraggableNode from './components/DraggableNode/DraggableNode'
import Edge from './components/Edge/Edge'

const radiusPerLayer = 4

const Graph = forwardRef(({ highlightedNodeId, onRightClick }, ref) => {
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
                const pos = {}
                const layers = {}
                json.nodes.forEach(n => {
                    if (!layers[n.layer]) layers[n.layer] = []
                    layers[n.layer].push(n)
                })

                layers[0]?.forEach((node, idx) => {
                    pos[node.id] = [0, 0, 0]
                })

                Object.entries(layers).forEach(([layerStr, nodes]) => {
                    const layer = Number(layerStr)
                    if (layer === 0) return
                    nodes.forEach((node, idxInLayer) => {
                        const parentEdges = json.edges.filter(e => e.target === node.id)
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
                        pos[node.id] = [cx + r * Math.cos(angle), layer * 3, cz + r * Math.sin(angle)]
                    })
                })

                setPositions(pos)
            })
            .catch(err => console.error('加载graph.json失败', err))
    }, [])

    const onDragNode = (id, newPos) => {
        setPositions((prev) => ({
            ...prev,
            [id]: newPos
        }))
    }

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
