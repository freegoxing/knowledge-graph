import React, { useState, useRef, useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import Graph from './Graph'
import SearchBox from './components/SearchBox/SearchBox'
import ContextMenu from './components/ContextMenu/ContextMenu'

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



    const handleAction = (action, nodeId) => {
        const graph = graphRef.current
        if (!graph || !graph.data || !nodeId) return

        switch (action) {
            case 'add': {
                const parentNode = graph.data.nodes.find(n => n.id === nodeId)
                if (!parentNode) return

                const nodeName = prompt('请输入新节点名字', '')
                if (!nodeName) return // 用户取消或没输入就不添加

                const newId = `node-${Date.now()}`
                const newNode = {
                    id: newId,
                    label: nodeName,
                    layer: parentNode.layer  // 同一层
                }
                graph.data.nodes.push(newNode)
                graph.data.edges.push({ source: nodeId, target: newId })

                // 重新触发状态更新，确保界面刷新
                graph.setData && graph.setData({ ...graph.data }) // 如果有setData方法的话
                break
            }
            case 'replace': {
                const node = graph.data.nodes.find(n => n.id === nodeId)
                if (node) {
                    const newLabel = prompt('请输入新的标签', node.label)
                    if (newLabel !== null) node.label = newLabel
                }
                break
            }
            case 'delete': {
                graph.data.nodes = graph.data.nodes.filter(n => n.id !== nodeId)
                graph.data.edges = graph.data.edges.filter(
                    e => e.source !== nodeId && e.target !== nodeId
                )
                delete graph.positions[nodeId]
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
