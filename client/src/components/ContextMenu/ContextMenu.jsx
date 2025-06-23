import React from 'react'
import ReactDOM from 'react-dom'
import styles from './ContextMenu.module.css'

export default function ContextMenu({ visible, x, y, nodeId, onClose, onAction }) {
    if (!visible) return null

    const handleClick = (action) => {
        onAction(action, nodeId)
        onClose()
    }

    return ReactDOM.createPortal(
        <div
            className={styles.contextMenu}
            style={{ top: y, left: x }}
        >
            <div className={styles.menuItem} onClick={() => handleClick('add-up')}>🔼 向上添加节点</div>
            <div className={styles.menuItem} onClick={() => handleClick('add')}>➕ 添加子节点</div>
            <div className={styles.menuItem} onClick={() => handleClick('add-down')}>🔽 向下添加节点</div>
            <div className={styles.menuItem} onClick={() => handleClick('replace')}>✏️ 替换标签</div>
            <div className={styles.menuItem} onClick={() => handleClick('delete')}>🗑️ 删除节点</div>
        </div>,
        document.body
    )
}
