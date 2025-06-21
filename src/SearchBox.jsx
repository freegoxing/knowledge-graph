import React, { useState } from 'react'
import './css/SearchBox.css'

export default function SearchBox({ data, positions, camera, setSearchNodeId }) {
    const [inputText, setInputText] = useState('')
    const [suggestions, setSuggestions] = useState([])
    const [selectedIndex, setSelectedIndex] = useState(-1) // 当前选中索引

    const handleSearch = (label) => {
        const targetLabel = label ?? inputText

        if (!data || !positions || !camera) {
            return
        }

        const found = data.nodes.find(n => n.label === targetLabel)
        if (found) {
            setSearchNodeId(found.id)
            const pos = positions[found.id]
            if (pos) {
                camera.position.set(pos[0] + 5, pos[1] + 5, pos[2] + 5)
                camera.lookAt(pos[0], pos[1], pos[2])
            }
        } else {
            alert('未找到该节点')
        }
    }

    const handleChange = (e) => {
        const text = e.target.value
        setInputText(text)

        if (!data) return

        const matched = data.nodes
            .filter(n => n.label.toLowerCase().includes(text.toLowerCase()))
            .slice(0, 5) // 最多展示5个匹配
        setSuggestions(matched)
    }

    const handleKeyDown = (e) => {
        if (suggestions.length === 0) return

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
            if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
                handleSearch(suggestions[selectedIndex].label)
            } else {
                handleSearch()
            }
            setSuggestions([]) // 回车后清除建议列表
        }
    }

        return (
        <div className="search-box-container">
            <input
                className="search-box"
                type="text"
                placeholder="搜索节点"
                value={inputText}
                onChange={handleChange}
                onKeyDown={handleKeyDown}  // 这里改为用 handleKeyDown
            />

            {suggestions.length > 0 && (
                <ul className="suggestions">
                    {suggestions.map((node, index) => (
                        <li
                            key={node.id}
                            onClick={() => {
                                handleSearch(node.label)
                                setInputText(node.label)
                                setSuggestions([])
                            }}
                            className={index === selectedIndex ? 'selected' : ''}
                        >
                            {node.label}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    )
}