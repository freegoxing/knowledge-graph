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

    const lineWidth = 1 + normalizedDegree * 9; // 宽度从1到10
    const lineLightness = 80 - normalizedDegree * 60; // 亮度从80%到20%
    const lineColor = `hsl(0, 0%, ${lineLightness}%)`;


    return (
        <Line
            points={points}
            color={lineColor}
            lineWidth={lineWidth}
        />
    )
}
