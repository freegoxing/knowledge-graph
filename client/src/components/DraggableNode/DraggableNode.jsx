import React, { useRef, useState, useEffect } from 'react'
import { useThree, useFrame, extend, useLoader } from '@react-three/fiber'
import { Html, shaderMaterial } from '@react-three/drei'
import * as THREE from 'three'
import styles from './DraggableNode.module.css'

const GlowMaterial = shaderMaterial(
    {
        glowColor: new THREE.Color(0, 0, 0),
        viewVector: new THREE.Vector3(0, 0, 0),
        power: 2.5,
        intensity: 1.5,
    },
    // Vertex Shader
    `
    varying vec3 vNormal;
    varying vec3 vPosition;
    void main() {
        vNormal = normalize(normalMatrix * normal);
        vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
    `,
    // Fragment Shader
    `
    uniform vec3 glowColor;
    uniform vec3 viewVector;
    uniform float power;
    uniform float intensity;
    varying vec3 vNormal;
    varying vec3 vPosition;

    void main() {
        vec3 viewDir = normalize(viewVector - vPosition);
        float fresnel = pow(1.0 - abs(dot(vNormal, viewDir)), power);
        vec3 finalColor = glowColor * fresnel * intensity;
        gl_FragColor = vec4(finalColor, fresnel * intensity);
    }
    `
);

extend({GlowMaterial});

export default function DraggableNode({
                                          id,
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
    const {camera} = useThree()
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
    const labelFontSize = 14 + normalizedDegree * 36;
    const labelYOffset = radius + 0.2;

    const normalColor = new THREE.Color('#00aaff');
    const highlightedColor = new THREE.Color('#00ffaa');
    const currentColor = useRef(normalColor.clone());

    useFrame((state, delta) => {
        if (meshRef.current) {
            meshRef.current.rotation.y += 0.005;
        }

        const targetColor = highlighted ? highlightedColor : normalColor;
        currentColor.current.lerp(targetColor, delta * 5); // delta * 5 控制过渡速度

        // 更新材质颜色
        if (meshRef.current) {
            const coreMaterial = meshRef.current.children[0].material;
            const glowMaterial = meshRef.current.children[1].material;

            coreMaterial.color = currentColor.current;
            coreMaterial.emissive = currentColor.current;

            glowMaterial.uniforms.glowColor.value = currentColor.current;
            glowMaterial.uniforms.viewVector.value = camera.position;
        }
    });

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
        <group ref={meshRef} position={position}>
            <mesh
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
                {/* Inner Core */}
                <sphereGeometry args={[radius * 0.6, 32, 32]}/>
                <meshStandardMaterial emissiveIntensity={0.5} toneMapped={false}/>
            </mesh>
            {/* Outer Glow */}
            <mesh>
                <sphereGeometry args={[radius, 32, 32]}/>
                <glowMaterial transparent={true} depthWrite={false} blending={THREE.AdditiveBlending}/>
            </mesh>

            <Html
                position={[0, labelYOffset, 0]}
                center
                className={styles.graphLabel}
                occlude={false}
            >
                <div style={{fontSize: `${labelFontSize}px`}}>
                    {label}
                </div>
            </Html>
        </group>
    )
}