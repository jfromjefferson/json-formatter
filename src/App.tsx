import { useCallback, useState } from "react"
import "./App.scss"
import { Viewer, type JsonType } from "./Components/Viewer"
import { XmlViewer } from "./Components/XmlViewer"
import { fixJson } from "./utils/jsonFixer"
import { parseXml, formatXml } from "./utils/xmlParser"
import type { XmlNode } from "./utils/xmlParser"

type Tab = 'json' | 'xml'

export function App() {
	const [tab, setTab] = useState<Tab>('json')
	const [rawInput, setRawInput] = useState('')

	// JSON state
	const [jsonFormatted, setJsonFormatted] = useState('')
	const [jsonTree, setJsonTree] = useState<JsonType | null>(null)
	const [jsonValid, setJsonValid] = useState(true)
	const [jsonError, setJsonError] = useState('')

	// XML state
	const [xmlFormatted, setXmlFormatted] = useState('')
	const [xmlTree, setXmlTree] = useState<XmlNode | null>(null)
	const [xmlValid, setXmlValid] = useState(true)
	const [xmlError, setXmlError] = useState('')

	// Toggle visibility
	const [showFormatted, setShowFormatted] = useState(true)
	const [showTree, setShowTree] = useState(true)

	// Copy
	const [copied, setCopied] = useState(false)

	function handleContent(text: string) {
		setRawInput(text)

		if (!text.trim()) {
			setJsonFormatted('')
			setJsonTree(null)
			setJsonValid(true)
			setJsonError('')
			setXmlFormatted('')
			setXmlTree(null)
			setXmlValid(true)
			setXmlError('')
			return
		}

		// Always parse both
		parseJsonInput(text)
		parseXmlInput(text)
	}

	function parseJsonInput(text: string) {
		const fixed = fixJson(text)
		try {
			const parsed = JSON.parse(fixed)
			setJsonTree(parsed)
			setJsonFormatted(jsonHighlight(JSON.stringify(parsed, null, 2)))
			setJsonValid(true)
			setJsonError('')
		} catch (err) {
			const msg = err instanceof SyntaxError ? err.message : String(err)
			setJsonError(msg)
			setJsonValid(false)
			setJsonTree(null)
			setJsonFormatted('')
		}
	}

	function parseXmlInput(text: string) {
		try {
			const node = parseXml(text)
			setXmlTree(node)
			setXmlFormatted(formatXml(node, 0))
			setXmlValid(true)
			setXmlError('')
		} catch (err) {
			const msg = err instanceof Error ? err.message : String(err)
			setXmlError(msg)
			setXmlValid(false)
			setXmlTree(null)
			setXmlFormatted('')
		}
	}

	const handleCopy = useCallback(() => {
		if (tab === 'json' && jsonTree) {
			navigator.clipboard.writeText(JSON.stringify(jsonTree, null, 2)).then(() => {
				setCopied(true)
				setTimeout(() => setCopied(false), 2000)
			})
		} else if (tab === 'xml' && xmlTree) {
			const text = stripHtml(formatXml(xmlTree))
			navigator.clipboard.writeText(text).then(() => {
				setCopied(true)
				setTimeout(() => setCopied(false), 2000)
			})
		}
	}, [tab, jsonTree, xmlTree])

	function jsonHighlight(text: string) {
		return text
			.replace(/"([^"]+)"(?=\s*:)/g, m => `<span class="hl-key">${m}</span>`)
			.replace(/(?<=:\s*)"(.*?)"/g, m => `<span class="hl-string">${m}</span>`)
			.replace(/\b(true|false|null)\b/g, m => `<span class="hl-bool">${m}</span>`)
			.replace(/(?<=:\s*)(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)(?!["'\w])/g, m => `<span class="hl-number">${m}</span>`)
	}

	const valid = tab === 'json' ? jsonValid : xmlValid
	const errorMsg = tab === 'json' ? jsonError : xmlError
	const formattedContent = tab === 'json' ? jsonFormatted : xmlFormatted
	const hasOutput = tab === 'json' ? jsonTree !== null : xmlTree !== null
	const currentLabel = tab === 'json' ? 'JSON' : 'XML'
	const placeholder = tab === 'json'
		? 'Paste your JSON here...\ne.g. {"name": "test"} or {\'name\': \'test\'}'
		: 'Paste your XML here...\ne.g. <root><item id="1">value</item></root>'

	return (
		<main>
			<header className="app-header">
				<h1>Formatter</h1>
				<nav className="tabs">
					<button
						className={`tab ${tab === 'json' ? 'tab--active' : ''}`}
						onClick={() => setTab('json')}
					>
						JSON
					</button>
					<button
						className={`tab ${tab === 'xml' ? 'tab--active' : ''}`}
						onClick={() => setTab('xml')}
					>
						XML
					</button>
				</nav>
			</header>

			<div className="panels">
				<section className="panel panel--input">
					<div className="panel__header">
						<span className="panel__title">Input</span>
						{rawInput.trim() && (
							<span className={`panel__badge ${valid ? 'panel__badge--ok' : 'panel__badge--err'}`}>
								{valid ? `Valid ${currentLabel}` : `Invalid ${currentLabel}`}
							</span>
						)}
					</div>
					<textarea
						autoFocus
						spellCheck={false}
						placeholder={placeholder}
						onChange={e => handleContent(e.target.value)}
						className={!valid && rawInput.trim() ? 'textarea--error' : ''}
					/>
				</section>

				<section className="panel panel--output">
					<div className="panel__header">
						<span className="panel__title">Output</span>
						<div className="panel__actions">
							<button
								className={`btn-icon ${showFormatted ? 'btn-icon--active' : ''}`}
								onClick={() => setShowFormatted(v => !v)}
								title="Toggle formatted view"
							>
								{'{}'}
							</button>
							<button
								className={`btn-icon ${showTree ? 'btn-icon--active' : ''}`}
								onClick={() => setShowTree(v => !v)}
								title="Toggle tree view"
							>
								{'{ }'}
							</button>
							{hasOutput && (
								<button className="btn-copy" onClick={handleCopy}>
									{copied ? 'Copied!' : 'Copy'}
								</button>
							)}
						</div>
					</div>
					<div className="output-wrapper">
						{errorMsg && (
							<div className="error-banner">
								<span className="error-banner__icon">!</span>
								<span className="error-banner__text">{errorMsg}</span>
							</div>
						)}
						{showFormatted && (
							<pre
								dangerouslySetInnerHTML={{ __html: formattedContent }}
								spellCheck={false}
							/>
						)}
						{showTree && (
							<div className="tree-area">
								{tab === 'json' && (
									<Viewer data={jsonValid && jsonTree ? jsonTree : {}} />
								)}
								{tab === 'xml' && xmlValid && xmlTree && (
									<XmlViewer node={xmlTree} />
								)}
								{tab === 'xml' && !xmlValid && (
									<div className="tree-empty">No data</div>
								)}
							</div>
						)}
					</div>
				</section>
			</div>
		</main>
	)
}

function stripHtml(html: string): string {
	return html.replace(/<[^>]+>/g, '').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').replace(/&quot;/g, '"')
}
