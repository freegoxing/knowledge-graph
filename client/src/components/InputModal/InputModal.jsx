import React, { useState, useEffect } from 'react'
import styles from './InputModal.module.css'

export default function InputModal({
                                       isOpen,
                                       onClose,
                                       onSubmit,
                                       title,
                                       defaultValue = ''
                                   }) {
    const [value, setValue] = useState(defaultValue)

    useEffect(() => {
        if (isOpen) {
            setValue(defaultValue)
        }
    }, [isOpen, defaultValue])

    if (!isOpen) return null

    function handleSubmit(e) {
        e.preventDefault()
        if (value.trim()) {
            onSubmit(value.trim())
        }
    }

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
                <h2>{title}</h2>
                <form onSubmit={handleSubmit}>
                    <input
                        type="text"
                        value={value}
                        onChange={e => setValue(e.target.value)}
                        autoFocus
                    />
                </form>
                <div className={styles.buttons}>
                    <button onClick={onClose} className={styles.cancel}>
                        Cancel
                    </button>
                    <button onClick={handleSubmit}>OK</button>
                </div>
            </div>
        </div>
    )
}
