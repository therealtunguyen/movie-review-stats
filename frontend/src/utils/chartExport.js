import { toPng } from 'html-to-image'

/**
 * Download a DOM node as a PNG file.
 * @param {HTMLElement} node - The DOM node to capture
 * @param {string} filename - Output filename (e.g. 'sentiment-arc.png')
 */
export async function downloadChartPng(node, filename) {
  try {
    const dataUrl = await toPng(node, { cacheBust: true })
    const link = document.createElement('a')
    link.download = filename
    link.href = dataUrl
    link.click()
  } catch (err) {
    console.error('Chart export failed:', err)
  }
}
