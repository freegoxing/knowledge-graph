import React, { useMemo } from 'react'
import * as THREE from 'three'

export default function Edge({ start, end }) {
    const points = useMemo(() => [
        new THREE.Vector3(...start),
        new THREE.Vector3(...end)
    ], [start, end])

    const geometry = useMemo(() => new THREE.BufferGeometry().setFromPoints(points), [points])

    return (
        <line>
            <primitive object={geometry} attach="geometry" />
            <lineBasicMaterial attach="material" color="gray" />
        </line>
    )
}
