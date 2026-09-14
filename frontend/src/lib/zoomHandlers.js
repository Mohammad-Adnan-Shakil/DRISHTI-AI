/**
 * Zoom handler utilities for image viewers
 * These handlers provide consistent zoom behavior across the application
 */

/**
 * Handle zoom in action
 * @param {Function} setZoomLevel - State setter for zoom level
 * @param {number} maxZoom - Maximum zoom level (default: 2.0)
 * @param {number} step - Zoom increment step (default: 0.2)
 */
export const handleZoomIn = (setZoomLevel, maxZoom = 2.0, step = 0.2) => {
  setZoomLevel(prev => Math.min(prev + step, maxZoom))
}

/**
 * Handle zoom out action
 * @param {Function} setZoomLevel - State setter for zoom level
 * @param {number} minZoom - Minimum zoom level (default: 0.8)
 * @param {number} step - Zoom decrement step (default: 0.2)
 */
export const handleZoomOut = (setZoomLevel, minZoom = 0.8, step = 0.2) => {
  setZoomLevel(prev => Math.max(prev - step, minZoom))
}

/**
 * Handle zoom reset action
 * @param {Function} setZoomLevel - State setter for zoom level
 * @param {number} defaultZoom - Default zoom level to reset to (default: 1.0)
 */
export const handleZoomReset = (setZoomLevel, defaultZoom = 1.0) => {
  setZoomLevel(defaultZoom)
}
