import React, { useState, useRef, useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import Graph from './Graph'
import SearchBox from './SearchBox'

export default function App() {
    const [searchNodeId, setSearchNodeId] = useState(null)
    const [graphReady, setGraphReady] = useState(false)
    const graphRef = useRef()

    // 检查 Graph 是否加载完成（graphRef.current.data 是否存在）
    useEffect(() => {
        const interval = setInterval(() => {
            if (
                graphRef.current?.data &&
                graphRef.current?.positions &&
                graphRef.current?.camera
            ) {
                setGraphReady(true)
                clearInterval(interval)
            }
        }, 100)

        return () => clearInterval(interval)
    }, [])

    return (
        <>
            {/* 等 graph 初始化后再渲染 SearchBox */}
            {graphReady && (
                <SearchBox
                    data={graphRef.current.data}
                    positions={graphRef.current.positions}
                    camera={graphRef.current.camera}
                    setSearchNodeId={setSearchNodeId}
                />
            )}

            <Canvas orthographic camera={{ zoom: 50, position: [0, 0, 100] }}>
                <ambientLight />
                <pointLight position={[10, 10, 10]} />
                <OrbitControls />
                <Graph ref={graphRef} highlightedNodeId={searchNodeId} />
            </Canvas>
        </>
    )
}
