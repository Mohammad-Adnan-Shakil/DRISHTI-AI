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
 * Captures an offscreen or onscreen DOM node and produces a paginated A4 jsPDF instance and PDF Blob.
 * @param {HTMLElement} node
 * @returns {Promise<{ pdf: jsPDF, blob: Blob }>}
 */
export async function nodeToPdfBlob(node) {
  if (!node) throw new Error('nodeToPdfBlob: no node to capture')

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

  const blob = pdf.output('blob')
  return { pdf, blob }
}

/**
 * Renders an offscreen DOM node to a paginated A4 PDF, triggers a browser download,
 * and optionally uploads the PDF to the backend if options.screeningId is provided.
 * @param {HTMLElement} node
 * @param {string} filename
 * @param {Object} [options]
 * @param {number|string} [options.screeningId]
 * @returns {Promise<{ pdf: jsPDF, blob: Blob }>}
 */
export async function exportNodeToPdf(node, filename, options = {}) {
  const { pdf, blob } = await nodeToPdfBlob(node)

  pdf.save(filename)

  if (options.screeningId) {
    try {
      const { uploadScreeningReport } = await import('./api')
      await uploadScreeningReport(options.screeningId, blob)
      console.info(`[pdfExport] Uploaded report PDF for screening ${options.screeningId}`)
    } catch (err) {
      console.error('[pdfExport] Failed to upload screening report PDF to backend:', err)
    }
  }

  return { pdf, blob }
}

