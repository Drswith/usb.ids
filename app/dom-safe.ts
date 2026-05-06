/**
 * Safe text → DOM: escape for attribute context; highlights use <mark> after splitting text.
 */

/**
 * Fill container with text, wrapping matches of `query` in <mark class="highlight">.
 * Query is treated as literal after regex escape.
 */
export function appendHighlighted(container: HTMLElement, text: string, query: string): void {
  container.replaceChildren()
  const q = query.trim()
  if (!q) {
    container.appendChild(document.createTextNode(text))
    return
  }
  const re = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi')
  let last = 0
  let m: RegExpExecArray | null = null
  // eslint-disable-next-line no-cond-assign
  while ((m = re.exec(text)) !== null) {
    if (m.index > last)
      container.appendChild(document.createTextNode(text.slice(last, m.index)))
    const mark = document.createElement('mark')
    mark.className = 'highlight'
    mark.appendChild(document.createTextNode(m[0]))
    container.appendChild(mark)
    last = m.index + m[0].length
    if (m[0].length === 0)
      re.lastIndex++
  }
  if (last < text.length)
    container.appendChild(document.createTextNode(text.slice(last)))
}
