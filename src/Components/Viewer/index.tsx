import { Fragment, useState } from "react"

export type JsonType = { [key: string]: unknown } | unknown[]

interface JsonViewerProps {
    data: JsonType
    level?: number
}

function getValueType(value: unknown): string {
    if (value === null) return 'null'
    if (Array.isArray(value)) return 'array'
    return typeof value
}

function getTypeLabel(value: unknown): string {
    if (value === null) return 'null'
    if (Array.isArray(value)) return `Array[${value.length}]`
    if (typeof value === 'object') return `Object{${Object.keys(value as object).length}}`
    return ''
}

export function Viewer({ data, level = 0 }: JsonViewerProps) {
    const [expanded, setExpanded] = useState<Record<string, boolean>>({})

    const toggleExpand = (key: string) => {
        setExpanded((prev) => ({ ...prev, [key]: !prev[key] }))
    }

    const entries = Object.entries(data)
    const isArray = Array.isArray(data)

    if (level === 0 && entries.length === 0) {
        return <div className="tree-view tree-empty">No data</div>
    }

    return (
        <div className="tree-view" style={{ paddingLeft: level > 0 ? 16 : 0 }}>
            {entries.map(([key, value], idx) => {
                const valueType = getValueType(value)
                const isComplex = valueType === 'object' || valueType === 'array'
                const valIsArray = Array.isArray(value)
                const typeLabel = getTypeLabel(value)
                const isOpen = expanded[key] ?? (level < 2)

                return (
                    <Fragment key={`${key}-${idx}`}>
                        <div className="tree-row">
                            {isComplex ? (
                                <span
                                    className="tree-toggle"
                                    onClick={() => toggleExpand(key)}
                                >
                                    {isOpen ? '▼' : '▶'}
                                </span>
                            ) : (
                                <span className="tree-toggle tree-toggle--hidden">▶</span>
                            )}

                            <span className="tree-key">
                                {isArray ? idx : key}
                            </span>
                            <span className="tree-colon">:</span>

                            {isComplex ? (
                                <>
                                    <span
                                        className={`tree-bracket tree-value--${valueType}`}
                                        onClick={() => toggleExpand(key)}
                                    >
                                        {isOpen ? (valIsArray ? '[' : '{') : typeLabel}
                                    </span>
                                    {!isOpen && typeLabel && (
                                        <span className="tree-type-hint">
                                            {valIsArray ? ` ${value.length} items` : ` ${Object.keys(value as object).length} keys`}
                                        </span>
                                    )}
                                </>
                            ) : (
                                <span className={`tree-value tree-value--${valueType}`}>
                                    {valueType === 'string' ? `"${value}"` : String(value)}
                                </span>
                            )}
                        </div>

                        {isComplex && isOpen && (
                            <>
                                <Viewer data={value as JsonType} level={level + 1} />
                                <div className="tree-row">
                                    <span className="tree-toggle tree-toggle--hidden">▶</span>
                                    <span className={`tree-bracket tree-value--${valueType}`}>
                                        {valIsArray ? ']' : '}'}
                                    </span>
                                </div>
                            </>
                        )}
                    </Fragment>
                )
            })}
        </div>
    )
}
