import { useState } from "react"
import type { XmlNode } from "../../utils/xmlParser"

interface XmlViewerProps {
    node: XmlNode
    level?: number
}

export function XmlViewer({ node, level = 0 }: XmlViewerProps) {
    const [expanded, setExpanded] = useState<Record<string, boolean>>({})

    const toggleExpand = (key: string) => {
        setExpanded(prev => ({ ...prev, [key]: !prev[key] }))
    }

    const attrStr = Object.entries(node.attributes)
        .map(([k, v]) => v ? `${k}="${v}"` : k)
        .join(' ')

    const hasChildren = node.children.length > 0
    const isOpen = expanded[node.tag] ?? (level < 2)

    return (
        <div className="tree-view" style={{ paddingLeft: level > 0 ? 16 : 0 }}>
            <div className="tree-row">
                {hasChildren ? (
                    <span className="tree-toggle" onClick={() => toggleExpand(node.tag)}>
                        {isOpen ? '▼' : '▶'}
                    </span>
                ) : (
                    <span className="tree-toggle tree-toggle--hidden">▶</span>
                )}

                <span className="tree-key xml-tag-name">&lt;{node.tag}</span>
                {attrStr && <span className="tree-colon xml-attr">{attrStr}</span>}
                {!hasChildren && <span className="tree-bracket"> /&gt;</span>}
                {hasChildren && (
                    <span
                        className="tree-bracket"
                        onClick={() => toggleExpand(node.tag)}
                    >
                        {isOpen ? '>' : `&gt;...&lt;/${node.tag}&gt;`}
                    </span>
                )}
            </div>

            {hasChildren && isOpen && (
                <>
                    {node.children.map((child, idx) => {
                        if (typeof child === 'string') {
                            return (
                                <div key={`text-${idx}`} className="tree-row" style={{ paddingLeft: 16 }}>
                                    <span className="tree-toggle tree-toggle--hidden">▶</span>
                                    <span className="xml-text">{child}</span>
                                </div>
                            )
                        }
                        return (
                            <XmlViewer key={`${child.tag}-${idx}`} node={child} level={level + 1} />
                        )
                    })}
                    <div className="tree-row">
                        <span className="tree-toggle tree-toggle--hidden">▶</span>
                        <span className="tree-bracket xml-tag-name">&lt;/{node.tag}&gt;</span>
                    </div>
                </>
            )}
        </div>
    )
}
