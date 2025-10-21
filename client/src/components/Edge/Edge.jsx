import React, { useMemo } from 'react'
import * as THREE from 'three'
import { Line } from '@react-three/drei'

export default function Edge({ start, end, sourceDegree = 1, targetDegree = 1 }) {
    const points = useMemo(() => [
        new THREE.Vector3(...start),
        new THREE.Vector3(...end)
    ], [start, end])

    const avgDegree = (sourceDegree + targetDegree) / 2;
    const maxDegree = 50; // 与DraggableNode中一致
    const normalizedDegree = Math.min(avgDegree / maxDegree, 1);


    const lineWidth = 1 + normalizedDegree * 4; // 宽度从1到5
    const lineOpacity = 0.2 + normalizedDegree * 0.8; // 透明度从0.2到1.0

    return (
        <Line
            points={points}
            color="#00aaff" // 使用主题色
            lineWidth={lineWidth}
            transparent
            opacity={lineOpacity}
        />
    )
}
