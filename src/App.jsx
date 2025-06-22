import React, { useState, useRef, useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import Graph from '@/Graph'
import SearchBox from '@components/SearchBox/SearchBox'
import ContextMenu from '@components/ContextMenu/ContextMenu'

export default function App() {
    const [searchNodeId, setSearchNodeId] = useState(null)
    const [graphReady, setGraphReady] = useState(false)
    const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, nodeId: null })
    const graphRef = useRef()

    useEffect(() => {
        const interval = setInterval(() => {
            if (graphRef.current?.data && graphRef.current?.positions && graphRef.current?.camera) {
                setGraphReady(true)
                clearInterval(interval)
            }
        }, 100)
        return () => clearInterval(interval)
    }, [])

    function handleRightClick(event, nodeId) {
        event?.nativeEvent?.preventDefault?.()

        setContextMenu({
            visible: true,
            x: event.clientX,
            y: event.clientY,
            nodeId
        })
    }

    async function saveGraphData() {
        const response = await fetch('http://localhost:3001/update-graph', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(graphRef.current.data)
        })

        if (response.ok) {
            console.log('✅ 图数据已保存')
        } else {
            console.error('❌ 图数据保存失败')
        }
    }

    const handleAction = (action, nodeId) => {
        const graph = graphRef.current
        if (!graph || !graph.data || !nodeId) return

        switch (action) {
            case 'add': {
                const parentNode = graph.data.nodes.find(n => n.id === nodeId)
                if (!parentNode) return

                const nodeName = prompt('请输入新节点名字', '')
                if (!nodeName || !nodeName.trim()) return

                const newId = `node-${Date.now()}`
                const newNode = {
                    id: newId,
                    label: nodeName,
                    layer: parentNode.layer
                }
                graph.data.nodes.push(newNode)
                graph.data.edges.push({ source: nodeId, target: newId })

                saveGraphData()
                graph.setData && graph.setData({ ...graph.data })
                break
            }
            case 'replace': {
                const node = graph.data.nodes.find(n => n.id === nodeId)
                if (node) {
                    const newLabel = prompt('请输入新的标签', node.label)
                    if (newLabel !== null && newLabel.trim() !== '') node.label = newLabel.trim()
                }

                saveGraphData()
                graph.setData && graph.setData({ ...graph.data })
                break
            }
            case 'delete': {
                graph.data.nodes = graph.data.nodes.filter(n => n.id !== nodeId)
                graph.data.edges = graph.data.edges.filter(
                    e => e.source !== nodeId && e.target !== nodeId
                )
                delete graph.positions[nodeId]

                saveGraphData()
                graph.setData && graph.setData({ ...graph.data })
                break
            }
            default:
                break
        }
    }


    const closeMenu = () => setContextMenu(prev => ({ ...prev, visible: false }))

    useEffect(() => {
        const handleClick = () => {
            if (contextMenu.visible) closeMenu()
        }
        window.addEventListener('click', handleClick)
        return () => window.removeEventListener('click', handleClick)
    }, [contextMenu.visible])

    return (
        <>
            {graphReady && (
                <SearchBox
                    data={graphRef.current?.data}
                    positions={graphRef.current?.positions}
                    camera={graphRef.current?.camera}
                    setSearchNodeId={setSearchNodeId}
                />
            )}

            <Canvas orthographic camera={{ zoom: 50, position: [0, 0, 100] }}>
                <ambientLight />
                <pointLight position={[10, 10, 10]} />
                <OrbitControls />
                <Graph
                    ref={graphRef}
                    highlightedNodeId={searchNodeId}
                    onRightClick={handleRightClick}
                />
            </Canvas>

            <ContextMenu
                {...contextMenu}
                onClose={closeMenu}
                onAction={handleAction}
            />
        </>
    )
}
