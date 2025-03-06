import { useState } from "react"
import "./App.scss"
import { Viewer } from "./Components/Viewer"

export function App() {
	const [content, setContent] = useState('')
	const [jsonContent, setJsonContent] = useState({})
	const [valid, setValid] = useState(true)

	function handleContent(text: string) {

		try {
			const textInJSON = JSON.parse(text)
			setJsonContent(textInJSON)
			const textFormatted = JSON.stringify(textInJSON, null, 2)

			setContent(syntaxHighlight(textFormatted))
			setValid(true)
		} catch (err) {
			console.error(`handleContent error: ${err}`)
			setValid(false)
		}
	}

	function syntaxHighlight(text: string) {
		return text
			.replace(/"([^"]+)"(?=\s*:)/g, (match: string) => {
				// Keys
				return `<span style="color: #9876AA;">${match}</span>`
			})
			.replace(/(?<=:\s*)"(.*?)"/g, (match: string) => {
				// Values
				return `<span style="color: #6A8759;">${match}</span>`
			})
			.replace(/\b(true|false|null)\b/g, (match: string) => {
				// Bool values
				return `<span style="color: #CC7832;">${match}</span>`
			})
			.replace(/\b\d+(\.\d+)?\b(?!")/g, (match: string) => {
				// Numeric values
				return `<span style="color: #6A8759;">${match}</span>`
			})
	}

	return (
		<main>
			<textarea
				autoFocus
				spellCheck={false}
				onChange={e => handleContent(e.target.value)}
			>
			</textarea>
			<div className="result-area">
				<pre
					dangerouslySetInnerHTML={{ __html: content }}
					spellCheck={false}
					style={{ border: !valid ? '1px solid #9c3333' : '' }}>
				</pre>
				<div className="resume-area">
					<Viewer data={valid ? jsonContent : {}} />
				</div>
			</div>
		</main>
	)
}
