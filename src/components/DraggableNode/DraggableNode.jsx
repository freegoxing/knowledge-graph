import React, { useRef, useState } from 'react'
import { useThree } from '@react-three/fiber'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import styles from './DraggableNode.module.css'
import * as THREE from 'three'

export default function DraggableNode({
                                          id,
                                          position,
                                          onDrag,
                                          onRightClick,
                                          label,
                                          highlighted,
                                          degree = 0
                                      }) {
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
        raycaster.current.ray.intersectPlane(plane.current, intersection.current)
        setOffset(intersection.current.clone().sub(meshRef.current.position))
    }

    const pointerMove = (event) => {
        if (!dragging) return
        event.stopPropagation()

        raycaster.current.setFromCamera(event.pointer, camera)
        if (raycaster.current.ray.intersectPlane(plane.current, intersection.current)) {
            const newPos = intersection.current.clone().sub(offset)
            newPos.y = position[1] // 限制在当前层移动
            onDrag([newPos.x, newPos.y, newPos.z])
        }
    }

    const pointerUp = (event) => {
        event.stopPropagation()
        setDragging(false)
    }

    // 鼠标右键事件
    const handleContextMenu = (event) => {
        event.stopPropagation()

        // 使用 nativeEvent 的 preventDefault
        if (event?.nativeEvent?.preventDefault) {
            event.nativeEvent.preventDefault()
        }

        if (onRightClick) {
            onRightClick(event, id)
        }
    }


    const radius = Math.min(0.2 + degree * 0.02, 2)
    const opacity = highlighted ? 1 : Math.min(0.25 + degree * 0.05, 1)

    // 可选：做一些 hover 或动画效果
    useFrame(() => {
        if (meshRef.current) {
            meshRef.current.rotation.y += 0.005
        }
    })

    return (
        <mesh
            ref={meshRef}
            position={position}
            onPointerDown={pointerDown}
            onPointerMove={pointerMove}
            onPointerUp={pointerUp}
            onPointerMissed={() => setDragging(false)}
            onContextMenu={handleContextMenu}
            castShadow
            receiveShadow
        >
            <sphereGeometry args={[radius, 16, 16]} />
            <meshStandardMaterial
                color={highlighted ? 'hotpink' : 'blue'}
                transparent={true}
                opacity={opacity}
            />

            <Html
                position={[0, 0.5, 0]}
                center
                className={styles.graphLabel}
                occlude={false}
            >
                {label}
            </Html>
        </mesh>
    )
}
