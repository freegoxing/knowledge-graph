import React, { useRef, useState } from 'react'
import { useThree } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'

export default function DraggableNode({ id, position, onDrag, label }) {
    const meshRef = useRef()
    const { camera } = useThree()
    const [dragging, setDragging] = useState(false)
    const [offset, setOffset] = useState(new THREE.Vector3())
    const plane = useRef(new THREE.Plane())
    const intersection = useRef(new THREE.Vector3())
    const raycaster = useRef(new THREE.Raycaster())

    const pointerDown = (event) => {
        event.stopPropagation()
        setDragging(true)

        plane.current.setFromNormalAndCoplanarPoint(
            camera.getWorldDirection(new THREE.Vector3()).negate(),
            meshRef.current.position
        )

        raycaster.current.setFromCamera(event.pointer, camera)
        raycaster.current.ray.intersectPlane(plane.current, intersection)
        setOffset(intersection.current.clone().sub(meshRef.current.position))
    }

    const pointerMove = (event) => {
        if (!dragging) return
        event.stopPropagation()

        raycaster.current.setFromCamera(event.pointer, camera)
        if (raycaster.current.ray.intersectPlane(plane.current, intersection)) {
            const newPos = intersection.current.clone().sub(offset)
            onDrag([newPos.x, newPos.y, newPos.z])
        }
    }

    const pointerUp = (event) => {
        event.stopPropagation()
        setDragging(false)
    }

    return (
        <mesh
            ref={meshRef}
            position={position}
            onPointerDown={pointerDown}
            onPointerMove={pointerMove}
            onPointerUp={pointerUp}
            onPointerMissed={() => setDragging(false)}
            castShadow
            receiveShadow
        >
            <sphereGeometry args={[0.3, 16, 16]} />
            <meshStandardMaterial color="blue" />

            {/* Html文字显示 */}
            <Html
                position={[0, 0.5, 0]}  // 球体上方一点
                center
                style={{
                    pointerEvents: 'none',
                    userSelect: 'none',
                    color: 'black',
                    padding: '2px 6px',
                    fontSize: '12px',
                    whiteSpace: 'nowrap',
                    borderRadius: '4px',
                }}
            >
                {label}
            </Html>
        </mesh>
    )
}
