import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

/**
 * Collapses whitespace/punctuation into single underscores for safe use in
 * a downloaded filename (e.g. "Anitha R." -> "Anitha_R").
 * @param {string} value
 */
export function sanitizeFilenameSegment(value) {
  return String(value).trim().replace(/[^\w-]+/g, '_').replace(/^_+|_+$/g, '')
}

/**
 * Renders an offscreen DOM node to a paginated A4 PDF and triggers a
 * browser download. Used for both the patient history report and the
 * single-visit screening report — both render a fixed-width (794px, A4 @
 * 96dpi) React component offscreen, then this captures it as an image and
 * slices it across as many A4 pages as the content needs.
 * @param {HTMLElement} node
 * @param {string} filename
 */
export async function exportNodeToPdf(node, filename) {
  if (!node) throw new Error('exportNodeToPdf: no node to capture')

  const canvas = await html2canvas(node, {
    scale: 2,
    useCORS: true,
    backgroundColor: '#ffffff',
  })

  const imgData = canvas.toDataURL('image/png')
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' })

  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  const imgWidth = pageWidth
  const imgHeight = (canvas.height * imgWidth) / canvas.width

  let heightLeft = imgHeight
  let position = 0

  pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
  heightLeft -= pageHeight

  while (heightLeft > 0) {
    position = heightLeft - imgHeight
    pdf.addPage()
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
    heightLeft -= pageHeight
  }

  pdf.save(filename)
}
