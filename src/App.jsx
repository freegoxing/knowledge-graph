import React from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import Graph from './Graph'

export default function App() {
    return (
        <>
            <Canvas orthographic camera={{ zoom: 50, position: [0, 0, 100] }}>
                <ambientLight />
                <pointLight position={[10, 10, 10]} />
                <OrbitControls />
                <Graph />
            </Canvas>
        </>
    )
}