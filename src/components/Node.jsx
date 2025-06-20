import React from 'react'
import { Text } from '@react-three/drei'

export default function Node({ position, label }) {
    return (
        <group position={position}>
            <mesh>
                <sphereGeometry args={[0.5, 32, 32]} />
                <meshStandardMaterial color="skyblue" />
            </mesh>
            <Text
                position={[0, 1, 0]} // 文字在球体上方
                fontSize={0.3}
                color="black"
                anchorX="center"
                anchorY="middle"
            >
                {label}
            </Text>
        </group>
    )
}
