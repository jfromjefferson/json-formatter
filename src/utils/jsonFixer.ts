export function fixJson(text: string): string {
  const trimmed = text.trim()
  if (!trimmed) return trimmed

  try {
    JSON.parse(trimmed)
    return trimmed
  } catch {
    // continue to fix
  }

  let result = ''
  let inDouble = false
  let inSingle = false
  let escaped = false

  for (let i = 0; i < trimmed.length; i++) {
    const ch = trimmed[i]

    if (escaped) {
      result += ch
      escaped = false
      continue
    }

    if (ch === '\\') {
      escaped = true
      result += ch
      continue
    }

    if (ch === '"' && !inSingle) {
      inDouble = !inDouble
      result += ch
    } else if (ch === "'" && !inDouble) {
      inSingle = !inSingle
      result += '"'
    } else {
      result += ch
    }
  }

  result = result.replace(/([{,]\s*)(\w[\w.]*)(\s*:)/g, '$1"$2"$3')

  return result
}
