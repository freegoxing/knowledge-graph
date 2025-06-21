import React, { useRef, useState } from 'react'
import { useThree } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'

export default function DraggableNode({ position, onDrag, label, highlighted, degree = 0 }) {
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

        // 计算拖拽平面，垂直于相机视线，经过当前节点位置
        plane.current.setFromNormalAndCoplanarPoint(
            camera.getWorldDirection(new THREE.Vector3()).negate(),
            meshRef.current.position
        )

        raycaster.current.setFromCamera(event.pointer, camera)
        // 注意这里必须传入 intersection.current，而不是 intersection
        raycaster.current.ray.intersectPlane(plane.current, intersection.current)

        setOffset(intersection.current.clone().sub(meshRef.current.position))
    }

    const pointerMove = (event) => {
        if (!dragging) return
        event.stopPropagation()

        raycaster.current.setFromCamera(event.pointer, camera)
        if (raycaster.current.ray.intersectPlane(plane.current, intersection.current)) {
            const newPos = intersection.current.clone().sub(offset)
            onDrag([newPos.x, newPos.y, newPos.z])
        }
    }

    const pointerUp = (event) => {
        event.stopPropagation()
        setDragging(false)
    }

    // 半径范围 0.2 - 2，随 degree 变化
    const radius = Math.min(0.2 + degree * 0.05, 2)

    // 透明度，选中时为1，未选中时最低0.3，最高1
    const opacity = highlighted ? 1 : Math.min(0.3 + degree * 0.05, 1)

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
            <sphereGeometry args={[radius, 16, 16]} />
            <meshStandardMaterial
                color={highlighted ? 'hotpink' : 'blue'}
                transparent={true}
                opacity={opacity}
            />

            {/* 球体上方显示标签 */}
            <Html
                position={[0, 0.5, 0]}
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
                occlude={false}
            >
                {label}
            </Html>
        </mesh>
    )
}
