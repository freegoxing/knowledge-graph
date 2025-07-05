import React, { useState, useEffect, useImperativeHandle, forwardRef } from 'react'
import { useThree } from '@react-three/fiber'
import DraggableNode from './components/DraggableNode/DraggableNode'
import Edge from './components/Edge/Edge'

const radiusPerLayer = 3

// 计算节点位置的函数
function calculatePositions(data) {
    const pos = {}
    const layers = {}

    const allLayers = data.nodes.map(n => n.layer)
    const minLayer = Math.min(...allLayers)

    data.nodes.forEach(n => {
        n._adjustedLayer = n.layer - minLayer
    })

    // 按调整后的层分组
    data.nodes.forEach(n => {
        if (!layers[n._adjustedLayer]) layers[n._adjustedLayer] = []
        layers[n._adjustedLayer].push(n)
    })

    // 其他层
    Object.entries(layers).forEach(([layerStr, nodes]) => {
        const layer = Number(layerStr)
        if (layer === -1) return
        nodes.forEach((node, idxInLayer) => {
            const parentEdges = data.edges.filter(e => e.target === node.id)
            const parentPositions = parentEdges.map(e => pos[e.source]).filter(Boolean)
            let cx = 0, cy = 0, cz = 0
            if (parentPositions.length > 0) {
                parentPositions.forEach(p => {
                    cx += p[0]; cy += p[1]; cz += p[2]
                })
                cx /= parentPositions.length
                cy /= parentPositions.length
                cz /= parentPositions.length
            }
            const baseAngle = (idxInLayer / nodes.length) * 2 * Math.PI
            const angle = baseAngle + (Math.random() - 0.5) * (Math.PI / 6)
            const r = radiusPerLayer
            pos[node.id] = [cx + r * Math.cos(angle),  layer * -5, cz + r * Math.sin(angle)]
        })
    })

    return pos
}

// 计算力向导布局
function applyForces(data, positions, maxIterations = 200, energyThreshold = 0.01) {
    const K_REPEL = 20;     // 斥力常数
    const K_ATTRACT = 0.2; // 弹簧吸引力常数
    const K_CENTER = 0.05;  // 向心力常数

    const newPositions = JSON.parse(JSON.stringify(positions)); // Deep copy

    // 预处理，创建节点ID到节点的映射
    const nodeMap = new Map(data.nodes.map(node => [node.id, node]));

    for (let iter = 0; iter < maxIterations; iter++) {
        let totalEnergy = 0;
        const forces = {};

        data.nodes.forEach(n => {
            forces[n.id] = { x: 0, z: 0 };
        });

        // 计算斥力 (O(N^2))
        for (let i = 0; i < data.nodes.length; i++) {
            for (let j = i + 1; j < data.nodes.length; j++) {
                const ni = data.nodes[i];
                const nj = data.nodes[j];

                // 仅在同一层内计算斥力
                if (ni.layer !== nj.layer) continue;

                const pi = newPositions[ni.id];
                const pj = newPositions[nj.id];

                const dx = pi[0] - pj[0];
                const dz = pi[2] - pj[2];
                const distSq = dx * dx + dz * dz + 0.01; // 避免除0
                const dist = Math.sqrt(distSq);
                const force = K_REPEL / distSq;

                const fx = force * (dx / dist);
                const fz = force * (dz / dist);

                forces[ni.id].x += fx;
                forces[ni.id].z += fz;
                forces[nj.id].x -= fx;
                forces[nj.id].z -= fz;
            }
        }

        // 计算吸引力 (弹簧力)
        data.edges.forEach(edge => {
            const sourceNode = nodeMap.get(edge.source);
            const targetNode = nodeMap.get(edge.target);

            if (!sourceNode || !targetNode) return;

            const sourcePos = newPositions[edge.source];
            const targetPos = newPositions[edge.target];

            const dx = targetPos[0] - sourcePos[0];
            const dz = targetPos[2] - sourcePos[2];
            const dist = Math.sqrt(dx * dx + dz * dz) + 0.01;

            // 胡克定律 F = k * x
            const force = K_ATTRACT * dist;

            const fx = force * (dx / dist);
            const fz = force * (dz / dist);

            forces[edge.source].x += fx;
            forces[edge.source].z += fz;
            forces[edge.target].x -= fx;
            forces[edge.target].z -= fz;
        });

        // 计算向心力
        data.nodes.forEach(n => {
            const pos = newPositions[n.id];
            forces[n.id].x -= K_CENTER * pos[0];
            forces[n.id].z -= K_CENTER * pos[2];
        });

        // 模拟退火：步长（alpha）随迭代次数减小
        const alpha = 1.0 - (iter / maxIterations);

        // 更新位置并计算总能量
        data.nodes.forEach(n => {
            const pos = newPositions[n.id];
            const force = forces[n.id];

            const displacementX = force.x * alpha * 0.1; // 调整步长因子
            const displacementZ = force.z * alpha * 0.1;

            pos[0] += displacementX;
            pos[2] += displacementZ;

            totalEnergy += displacementX * displacementX + displacementZ * displacementZ;
        });

        // 如果系统能量低于阈值，则认为布局稳定，提前退出
        if (totalEnergy < energyThreshold) {
            // console.log(`布局稳定于第 ${iter} 次迭代`);
            break;
        }
    }

    return newPositions;
}


const Graph = forwardRef(({
                              highlightedNodeId,
                              onRightClick,
                              onDragStateChange,
                              query
                          }, ref) => {
    const [data, setData] = useState({ nodes: [], edges: [] })
    const [positions, setPositions] = useState({})
    const [isDragging, setIsDragging] = useState(false)

    const { camera } = useThree()

    useEffect(() => {
        fetch('/api/graph')
            .then(res => res.json())
            .then(initialData => {
                if (initialData && initialData.nodes && initialData.edges) {
                    setData(initialData)
                    const initPos = calculatePositions(initialData)
                    const finalPos = applyForces(initialData, initPos, 300)
                    setPositions(finalPos)
                }
            })
            .catch(err => console.error('加载graph.json失败', err))
    }, [])

    useImperativeHandle(ref, () => ({
        data,
        positions,
        camera,
        isDragging,
        setData: (newData) => {
            setData(newData)
            const initPos = calculatePositions(newData)
            const finalPos = applyForces(newData, initPos, 300)
            setPositions(finalPos)
        },
    }))

    const onDragNode = (id, newPos) => {
        setPositions((prev) => ({
            ...prev,
            [id]: newPos
        }))
    }

    const onDragStart = () => {
        if (!isDragging) {
            setIsDragging(true)
            onDragStateChange && onDragStateChange(true)
        }
    }
    const onDragEnd = () => {
        if (isDragging) {
            setIsDragging(false);
            onDragStateChange && onDragStateChange(false);

            // 以当前位置为起点，重新进行力导向计算
            const finalPos = applyForces(data, positions, 50); // 使用较少的迭代次数进行微调
            setPositions(finalPos);
        }
    };

    return (
        <group>
            {data.nodes.map((node) => {
                const position = positions[node.id] || [0, 0, 0]
                const degree = data.edges.filter(
                    (e) => e.source === node.id || e.target === node.id
                ).length

                return (
                     <DraggableNode
                        key={node.id}
                        id={node.id}
                        position={position}
                        label={node.label}
                        highlighted={highlightedNodeId === node.id}
                        degree={degree}
                        onDrag={(pos) => onDragNode(node.id, pos)}
                        onDragStart={onDragStart}
                        onRightClick={(e) => onRightClick(e, node.id)}
                        onDragEnd={onDragEnd}
                    />
                )
            })}

            {data.edges.map((edge, i) => {
                const from = positions[edge.source]
                const to = positions[edge.target]
                if (!from || !to) return null

                const sourceNode = data.nodes.find(n => n.id === edge.source)
                const targetNode = data.nodes.find(n => n.id === edge.target)
                if (!sourceNode || !targetNode) return null

                const sourceDegree = data.edges.filter(e => e.source === sourceNode.id || e.target === sourceNode.id).length;
                const targetDegree = data.edges.filter(e => e.source === targetNode.id || e.target === targetNode.id).length;


                return <Edge key={`${edge.source}-${edge.target}`} start={from} end={to} sourceDegree={sourceDegree} targetDegree={targetDegree}/>
            })}
        </group>
    )
})

export default Graph
