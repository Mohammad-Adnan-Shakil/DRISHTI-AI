import { getPendingQueue, removeFromQueue, updateQueueItem } from './db'
import { classify, createReferral, saveScreening } from './api'

// Mirrors the risk/recommendation copy in Screening.jsx's GRADE_CONFIG, kept
// here too since sync.js runs independently of that page (e.g. triggered by
// the 'online' event while the user is elsewhere in the app).
const RISK_BY_GRADE = {
  0: { risk: 'No Risk', recommendation: 'Continue annual eye check-up and manage diabetes well.' },
  1: { risk: 'Low to Moderate Risk', recommendation: 'Re-check in 6 months and keep blood sugar under control.' },
  2: { risk: 'HIGH RISK', recommendation: 'Visit an eye specialist at the district hospital within 2-4 weeks.' },
  3: { risk: 'URGENT RISK', recommendation: 'Visit an eye specialist urgently within 1-2 weeks.' },
  4: { risk: 'CRITICAL SIGHT THREAT', recommendation: 'Go to a specialist hospital within 48 hours. Do not delay.' },
}

// A queue item created by Screening.jsx's queueForOfflineClassification()
// carries the raw image instead of an already-computed grade — classify()
// has to run before there's anything to save.
async function resolvePendingClassification(item) {
  const result = await classify(item.image)
  const grade = result.grade
  const riskInfo = RISK_BY_GRADE[grade] ?? RISK_BY_GRADE[2]
  return {
    patient_id: item.patient_id,
    dr_grade: grade,
    dr_confidence: result.confidence,
    quality_score: null,
    fundus_image_url: result.fundus_image_url ?? '',
    heatmap_url: '',
    risk_stratification: riskInfo.risk,
    referral_recommended: grade >= 2,
    recommendation_text: riskInfo.recommendation,
    recommendation_language: 'English',
  }
}

export async function syncPendingScreenings() {
  if (!navigator.onLine) return { synced: 0, failed: 0 }

  const queue = await getPendingQueue()
  if (queue.length === 0) return { synced: 0, failed: 0 }

  console.log(`[SYNC] Found ${queue.length} pending screenings to sync`)

  let synced = 0
  let failed = 0

  for (const item of queue) {
    const emitStatus = (status, error = null) => {
      window.dispatchEvent(new CustomEvent('drishti:offline-sync', {
        detail: { status, offlineKey: item.offline_key, queueId: item.id, error },
      }))
    }
    try {
      emitStatus('syncing')
      const {
        id,
        referral_intent,
        referral_patient_id,
        remote_screening_id,
        type,
        image,
        demo_grade,
        ...rest
      } = item
      let screeningId = remote_screening_id
      let screeningData = rest
      let referralNeeded = referral_intent
      let referralPatientId = referral_patient_id ?? rest.patient_id

      if (!screeningId) {
        if (type === 'pending_classification') {
          emitStatus('classifying')
          screeningData = await resolvePendingClassification(item)
          referralNeeded = screeningData.referral_recommended
          referralPatientId = screeningData.patient_id
        }
        const savedScreening = await saveScreening(screeningData)
        screeningId = savedScreening?.id
        if (!screeningId) throw new Error('Screening sync returned no ID')
        await updateQueueItem(id, { remote_screening_id: screeningId })
      }
      if (referralNeeded) {
        await createReferral({
          screening_id: screeningId,
          patient_id: referralPatientId,
        })
      }
      await removeFromQueue(id)
      emitStatus('synced')
      synced++
    } catch (err) {
      failed++
      emitStatus('failed', err.message)
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