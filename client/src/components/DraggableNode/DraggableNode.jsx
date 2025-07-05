import React, { useRef, useState, useEffect } from 'react'
import { useThree } from '@react-three/fiber'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import styles from './DraggableNode.module.css'
import * as THREE from 'three'

export default function DraggableNode({                                          id,
                                          position,
                                          onDrag,
                                          onRightClick,
                                          onDragEnd,
                                          onDragStart,
                                          label,
                                          highlighted,
                                          degree = 0
                                      }) {
    const meshRef = useRef()
    const { camera } = useThree()
    const [dragging, setDragging] = useState(false)
    const offset = useRef(new THREE.Vector3())
    const plane = useRef(new THREE.Plane())
    const intersection = useRef(new THREE.Vector3())
    const raycaster = useRef(new THREE.Raycaster())

    const pointerDown = (event) => {
        event.stopPropagation()
        setDragging(true)
        onDragStart && onDragStart()

        // 计算拖拽平面，垂直于相机视线，经过当前节点位置
        plane.current.setFromNormalAndCoplanarPoint(
            camera.getWorldDirection(new THREE.Vector3()).negate(),
            meshRef.current.position
        )

        raycaster.current.setFromCamera(event.pointer, camera)
        raycaster.current.ray.intersectPlane(plane.current, intersection.current)
        offset.current.copy(intersection.current).sub(meshRef.current.position)
    }

    const pointerMove = (event) => {
        if (!dragging) return
        event.stopPropagation()

        raycaster.current.setFromCamera(event.pointer, camera)
        if (raycaster.current.ray.intersectPlane(plane.current, intersection.current)) {
            const newPos = intersection.current.clone().sub(offset.current)
            newPos.y = position[1] // 限制在当前层移动
            onDrag([newPos.x, newPos.y, newPos.z])
        }
    }

    const pointerUp = (event) => {
        event.stopPropagation()
        if (dragging) {
            setDragging(false)
            onDragEnd && onDragEnd()
        }
    }

    // 鼠标右键事件
    const handleContextMenu = (event) => {
        event.stopPropagation()
        event.nativeEvent.preventDefault()

        // 使用 nativeEvent 的 preventDefault
        if (event?.nativeEvent?.preventDefault) {
            event.nativeEvent.preventDefault()
        }

        if (onRightClick) {
            onRightClick(event, id)
        }
    }


    const maxDegree = 50; // 假设一个最大的度，用于归一化
    const normalizedDegree = Math.min(degree / maxDegree, 1);

    const radius = 0.2 + normalizedDegree * 1.8;
    const colorLightness = 70 - normalizedDegree * 50; // Lightness from 70% down to 20%
    const nodeColor = highlighted ? 'hotpink' : `hsl(240, 100%, ${colorLightness}%)`;
    const labelFontSize = 14 + normalizedDegree * 36;
    const labelYOffset = radius + 0.2;


    useFrame(() => {
        if (meshRef.current) {
            meshRef.current.rotation.y += 0.005
        }
    })

    // 组件内
    useEffect(() => {
        function onPointerUpGlobal(event) {
            pointerUp(event)
        }
        window.addEventListener('pointerup', onPointerUpGlobal)
        window.addEventListener('pointercancel', onPointerUpGlobal)

        return () => {
            window.removeEventListener('pointerup', onPointerUpGlobal)
            window.removeEventListener('pointercancel', onPointerUpGlobal)
        }
    }, [dragging, onDragEnd])

    return (
        <mesh
            ref={meshRef}
            position={position}
            onPointerDown={pointerDown}
            onPointerMove={pointerMove}
            onPointerUp={pointerUp}
            onPointerMissed={() => {
                setDragging(false)
                if (onDragEnd) onDragEnd()
            }}
            onContextMenu={handleContextMenu}
            castShadow
            receiveShadow
        >
            <sphereGeometry args={[radius, 32, 32]} />
            <meshStandardMaterial
                color={nodeColor}
                transparent={true}
                opacity={highlighted ? 1 : 0.75}
            />

            <Html
                position={[0, labelYOffset, 0]}
                center
                className={styles.graphLabel}
                occlude={false}
            >
                <div style={{ fontSize: `${labelFontSize}px` }}>
                    {label}
                </div>
            </Html>
        </mesh>
    )
}
