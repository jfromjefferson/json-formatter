import { useState } from "react"

export type JsonType = { [key: string]: any } | any[]

interface JsonViewerProps {
    data: JsonType
    level?: number
}

export function Viewer({ data, level = 0 }: JsonViewerProps) {
    const [expanded, setExpanded] = useState<Record<string, boolean>>({})

    const toggleExpand = (key: string) => {
        setExpanded((prev) => ({ ...prev, [key]: !prev[key] }))
    }

    return (
        <div style={{ marginLeft: level * 10 }}>
            {Object.entries(data).map(([key, value]) => (
                <div key={key}>
                    {typeof value === "object" && value !== null ? (
                        <>
                            <span
                                onClick={() => toggleExpand(key)}
                                style={{ cursor: "pointer", fontWeight: "bold", color: "#6A8759" }}
                            >
                                {expanded[key] ? "▼ " : "▶ "} {key}:
                            </span>
                            {expanded[key] && <Viewer data={value} level={level + 1} />}
                        </>
                    ) : (
                        <div>
                            <b style={{color: "#9876AA"}}>{key}:</b> {JSON.stringify(value)}
                        </div>
                    )}
                </div>
            ))}
        </div>
    )
}