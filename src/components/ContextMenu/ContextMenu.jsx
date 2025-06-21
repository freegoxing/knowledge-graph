import React from 'react'
import styles from './ContextMenu.module.css'

export default function ContextMenu({ visible, x, y, nodeId, onClose, onAction }) {
    if (!visible) return null

    const handleClick = (action) => {
        onAction(action, nodeId)
        onClose()
    }

    return (
        <div
            className={styles['context-menu']}
            style={{
                position: 'absolute',
                top: y,
                left: x,
                background: 'white',
                border: '1px solid #ccc',
                borderRadius: '6px',
                zIndex: 1000,
                padding: '4px',
                boxShadow: '0 2px 10px rgba(0,0,0,0.2)'
            }}
        >
            <div onClick={() => handleClick('add')}>➕ 添加子节点</div>
            <div onClick={() => handleClick('replace')}>✏️ 替换标签</div>
            <div onClick={() => handleClick('delete')}>🗑️ 删除节点</div>
        </div>
    )
}
