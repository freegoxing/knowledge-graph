import React, { useState, useRef, useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import Graph from '@/Graph'
import SearchBox from '@components/SearchBox/SearchBox'
import ContextMenu from '@components/ContextMenu/ContextMenu'
import QueryBox from "@components/QueryBox/QueryBox";

export default function App() {
    const [searchNodeId, setSearchNodeId] = useState(null)
    const [graphReady, setGraphReady] = useState(false)
    const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, nodeId: null })
    const [isDragging, setIsDragging] = useState(false)
    const [query, setQuery] = useState('')
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

    function handleDragStateChange(dragging) {
        setIsDragging(dragging)
    }

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

    const handleAction = async (action, nodeId) => {
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

                await saveGraphData()
                graph.setData && graph.setData({ ...graph.data })
                break
            }

            case 'add-up': {
                const childNode = graph.data.nodes.find(n => n.id === nodeId)
                if (!childNode) return

                const nodeName = prompt('请输入父节点名字', '')
                if (!nodeName || !nodeName.trim()) return

                const newId = `node-${Date.now()}`

                const originalLayer = childNode.layer
                const newLayer = Math.max(0, originalLayer - 1) + 1

                // 让所有比这个小的层都 +1
                graph.data.nodes.forEach(n => {
                    if (n.layer >= newLayer) {
                        n.layer += 1
                    }
                })

                const newNode = {
                    id: newId,
                    label: nodeName.trim(),
                    layer: newLayer
                }

                graph.data.nodes.push(newNode)

                await saveGraphData()
                graph.setData && graph.setData({ ...graph.data })
                break
            }

            case 'add-down': {
                const parentNode = graph.data.nodes.find(n => n.id === nodeId)
                if (!parentNode) return

                const nodeName = prompt('请输入子节点名字', '')
                if (!nodeName || !nodeName.trim()) return

                const newId = `node-${Date.now()}`

                const originalLayer = parentNode.layer
                const newLayer = originalLayer + 1

                // 所有层 >= newLayer 的节点层数 +1，腾出新节点层位置
                graph.data.nodes.forEach(n => {
                    if (n.layer >= newLayer) {
                        n.layer += 1
                    }
                })

                const newNode = {
                    id: newId,
                    label: nodeName.trim(),
                    layer: newLayer
                }

                graph.data.nodes.push(newNode)

                await saveGraphData()
                graph.setData && graph.setData({ ...graph.data })
                break
            }

            case 'replace': {
                const node = graph.data.nodes.find(n => n.id === nodeId)
                if (node) {
                    const newLabel = prompt('请输入新的标签', node.label)
                    if (newLabel !== null && newLabel.trim() !== '') node.label = newLabel.trim()
                }

                await saveGraphData()
                graph.setData && graph.setData({ ...graph.data })
                break
            }

            case 'delete': {
                const targetNode = graph.data.nodes.find(n => n.id === nodeId)
                if (!targetNode) break

                const deletedLayer = targetNode.layer

                graph.data.nodes = graph.data.nodes.filter(n => n.id !== nodeId)

                graph.data.edges = graph.data.edges.filter(
                    e => e.source !== nodeId && e.target !== nodeId
                )

                delete graph.positions[nodeId]

                // 检查被删除的那一层是否还有节点
                const layerStillExists = graph.data.nodes.some(n => n.layer === deletedLayer)

                // 如果该层已经没有节点，则整体调整更高层
                if (!layerStillExists) {
                    graph.data.nodes.forEach(n => {
                        if (n.layer > deletedLayer) {
                            n.layer -= 1
                        }
                    })
                }

                await saveGraphData()
                graph.setData && graph.setData({ ...graph.data })
                break
            }

            default:
                break
        }
    }

    const closeMenu = () => setContextMenu(prev => ({ ...prev, visible: false }))

    useEffect(() => {
        console.log('isDragging:', isDragging)
        const handleClick = () => {
            if (contextMenu.visible) closeMenu()
        }
        window.addEventListener('click', handleClick)
        return () => window.removeEventListener('click', handleClick)
    }, [contextMenu.visible])

    return (
        <>
            {/*<QueryBox*/}
            {/*    onSubmit={setQuery}*/}
            {/*    onResult={(data) => {*/}
            {/*        const graph = graphRef.current;*/}
            {/*        if (!graph || !graph.data) return;*/}

            {/*        if (data.nodes && data.edges) {*/}
            {/*            // 1. 合并 nodes，避免重复 id*/}
            {/*            const existingIds = new Set(graph.data.nodes.map(n => n.id));*/}
            {/*            const newNodes = data.nodes.filter(n => !existingIds.has(n.id));*/}
            {/*            graph.data.nodes.push(...newNodes);*/}

            {/*            // 2. 合并 edges*/}
            {/*            graph.data.edges.push(...data.edges);*/}

            {/*            // 3. 调整 layout 或 layer（可选）*/}

            {/*            // 4. 重新触发渲染*/}
            {/*            graph.setData && graph.setData({ ...graph.data });*/}

            {/*            // 5. 可选：保存数据*/}
            {/*            saveGraphData();*/}
            {/*        }*/}
            {/*    }}*/}
            {/*/>*/}

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
                <OrbitControls enabled={!isDragging}/>
                <Graph
                    ref={graphRef}
                    query={query}
                    highlightedNodeId={searchNodeId}
                    onRightClick={handleRightClick}
                    onDragStateChange={handleDragStateChange}
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
