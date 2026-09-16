import { getPendingQueue, removeFromQueue } from './db'
import { saveScreening } from './api'

export async function syncPendingScreenings() {
  if (!navigator.onLine) return { synced: 0, failed: 0 }

  const queue = await getPendingQueue()
  if (queue.length === 0) return { synced: 0, failed: 0 }

  console.log(`[SYNC] Found ${queue.length} pending screenings to sync`)

  let synced = 0
  let failed = 0

  for (const item of queue) {
    try {
      const { id, queued_at, ...screeningData } = item
      await saveScreening(screeningData)
      await removeFromQueue(id)
      synced++
    } catch (err) {
      failed++
      console.error(`[SYNC] Failed to sync ${item.id}:`, err)
    }
  }

  console.log(`[SYNC] Complete — ${synced} synced, ${failed} failed`)
  return { synced, failed }
}

export function setupAutoSync() {
  window.addEventListener('online', async () => {
    console.log('[SYNC] Back online — starting sync...')
    const result = await syncPendingScreenings()
    if (result.synced > 0) {
      console.log(`[SYNC] Auto-synced ${result.synced} screenings`)
    }
  })
}