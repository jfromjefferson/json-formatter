export interface XmlNode {
    tag: string
    attributes: Record<string, string>
    children: XmlChild[]
}

export type XmlChild = XmlNode | string

export function parseXml(xml: string): XmlNode {
    let pos = 0

    function skipWs() {
        while (pos < xml.length && /\s/.test(xml[pos])) pos++
    }

    function parseAttributes(): Record<string, string> {
        const attrs: Record<string, string> = {}
        while (pos < xml.length) {
            skipWs()
            if (pos >= xml.length || xml[pos] === '>' || xml[pos] === '/' || xml[pos] === '?') break
            let name = ''
            while (pos < xml.length && /[\w\-.:]/.test(xml[pos])) {
                name += xml[pos++]
            }
            if (!name) break
            skipWs()
            if (xml[pos] === '=') {
                pos++
                skipWs()
                const q = xml[pos]
                if (q !== '"' && q !== "'") throw new Error(`Expected quote at pos ${pos}`)
                pos++
                let val = ''
                while (pos < xml.length && xml[pos] !== q) {
                    val += xml[pos++]
                }
                if (xml[pos] !== q) throw new Error(`Unclosed attribute at pos ${pos}`)
                pos++
                attrs[name] = val
            } else {
                attrs[name] = ''
            }
        }
        return attrs
    }

    function parseNode(): XmlNode {
        if (xml[pos] !== '<') throw new Error(`Expected < at pos ${pos}`)
        pos++

        skipWs()
        let tag = ''
        while (pos < xml.length && /[\w\-.:]/.test(xml[pos])) {
            tag += xml[pos++]
        }
        if (!tag) throw new Error(`Expected tag name at pos ${pos}`)

        const attrs = parseAttributes()
        skipWs()

        if (xml[pos] === '/' && xml[pos + 1] === '>') {
            pos += 2
            return { tag, attributes: attrs, children: [] }
        }

        if (xml[pos] === '?' && xml[pos + 1] === '>') {
            pos += 2
            return { tag, attributes: attrs, children: [] }
        }

        if (xml[pos] !== '>') throw new Error(`Expected > at pos ${pos}`)
        pos++

        const children: XmlChild[] = []
        while (pos < xml.length) {
            skipWs()
            if (pos >= xml.length) break

            if (xml[pos] === '<' && xml[pos + 1] === '/') {
                pos += 2
                skipWs()
                let closeTag = ''
                while (pos < xml.length && /[\w\-.:]/.test(xml[pos])) {
                    closeTag += xml[pos++]
                }
                skipWs()
                if (xml[pos] !== '>') throw new Error(`Expected > at pos ${pos}`)
                pos++
                if (closeTag !== tag) throw new Error(`Mismatched tag: </${closeTag}>, expected </${tag}>`)
                return { tag, attributes: attrs, children }
            }

            if (xml[pos] === '<') {
                children.push(parseNode())
                continue
            }

            let text = ''
            while (pos < xml.length && xml[pos] !== '<') {
                text += xml[pos++]
            }
            const t = text.trim()
            if (t) children.push(t)
        }

        throw new Error(`Unclosed tag <${tag}>`)
    }

    skipWs()

    if (pos >= xml.length) throw new Error('Empty input')

    if (xml.startsWith('<?xml', pos)) {
        while (pos < xml.length && xml[pos] !== '>') pos++
        if (xml[pos] === '>') pos++
        skipWs()
    }

    if (pos >= xml.length) throw new Error('No root element found')

    const root = parseNode()

    skipWs()
    if (pos < xml.length && xml[pos] === '<') {
        const siblings: XmlChild[] = [root]
        while (pos < xml.length) {
            skipWs()
            if (pos >= xml.length) break
            if (xml[pos] === '<') {
                siblings.push(parseNode())
            } else {
                const remaining = xml.slice(pos).trim()
                if (remaining) throw new Error(`Unexpected content: "${remaining.slice(0, 40)}..."`)
                break
            }
            skipWs()
        }
        return { tag: '#root', attributes: {}, children: siblings }
    }

    return root
}

export function formatXml(node: XmlNode, indent = 0): string {
    const pad = '  '.repeat(indent)
    const attrStr = Object.entries(node.attributes)
        .map(([k, v]) => v ? ` ${k}="${escapeXml(v)}"` : ` ${k}`)
        .join('')

    if (node.children.length === 0) {
        return `${pad}<span class="hl-xml-tag">&lt;${node.tag}</span><span class="hl-xml-attr">${attrStr}</span><span class="hl-xml-tag"> /&gt;</span>`
    }

    const textChildren = node.children.every(c => typeof c === 'string')
    if (textChildren) {
        const text = node.children.join('')
        return `${pad}<span class="hl-xml-tag">&lt;${node.tag}</span><span class="hl-xml-attr">${attrStr}</span><span class="hl-xml-tag">&gt;</span>${escapeXml(text)}<span class="hl-xml-tag">&lt;/${node.tag}&gt;</span>`
    }

    const lines: string[] = []
    lines.push(`${pad}<span class="hl-xml-tag">&lt;${node.tag}</span><span class="hl-xml-attr">${attrStr}</span><span class="hl-xml-tag">&gt;</span>`)

    for (const child of node.children) {
        if (typeof child === 'string') {
            lines.push(`${pad}  ${escapeXml(child)}`)
        } else {
            lines.push(formatXml(child, indent + 1))
        }
    }

    lines.push(`${pad}<span class="hl-xml-tag">&lt;/${node.tag}&gt;</span>`)
    return lines.join('\n')
}

function escapeXml(str: string): string {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
}
