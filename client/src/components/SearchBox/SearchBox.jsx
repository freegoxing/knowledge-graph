import React, { useState } from 'react'
import styles from './SearchBox.module.css'

export default function SearchBox({ data, positions, camera, setSearchNodeId }) {
    const [inputText, setInputText] = useState('')
    const [suggestions, setSuggestions] = useState([])
    const [selectedIndex, setSelectedIndex] = useState(-1)

    const handleSearch = (label) => {
        const targetLabel = label ?? inputText
        if (!data || !positions || !camera) return

        const found = data.nodes.find(
            n => n.label.toLowerCase() === targetLabel.toLowerCase()
        )

        if (found) {
            setSearchNodeId(found.id)
            const pos = positions[found.id]
            if (pos) {
                camera.position.set(pos[0] + 5, pos[1] + 5, pos[2] + 5)
                camera.lookAt(pos[0], pos[1], pos[2])
            }
        } else {
            alert(`未找到该节点：${targetLabel}`)
        }
    }


    const handleChange = (e) => {
        const text = e.target.value
        setInputText(text)
        setSelectedIndex(-1)

        if (!data) return

        const matched = data.nodes
            .filter(n => n.label.toLowerCase().includes(text.toLowerCase()))
            .slice(0, 5)

        setSuggestions(matched)
    }

    const handleKeyDown = (e) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault()
            const nextIndex = (selectedIndex + 1) % suggestions.length
            setSelectedIndex(nextIndex)
            setInputText(suggestions[nextIndex].label)
        } else if (e.key === 'ArrowUp') {
            e.preventDefault()
            const nextIndex = (selectedIndex - 1 + suggestions.length) % suggestions.length
            setSelectedIndex(nextIndex)
            setInputText(suggestions[nextIndex].label)
        } else if (e.key === 'Enter') {
            e.preventDefault()
            if (selectedIndex >= 0) {
                handleSearch(suggestions[selectedIndex].label)
            } else {
                handleSearch()
            }
        }
    }

    return (
        <div className={styles["searchBoxContainer"]}>
            <input
                className={styles['searchBox']}
                type="text"
                placeholder="搜索节点"
                value={inputText}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
            />
            {suggestions.length > 0 && (
                <ul className={styles['suggestions']}>
                    {suggestions.map((node, index) => (
                        <li
                            key={node.id}
                            className={`${styles.suggestionItem} ${index === selectedIndex ? styles.selected : ''}`}
                            onClick={() => {
                                handleSearch(node.label)
                                setInputText(node.label)
                            }}
                        >
                            {node.label}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    )
}
