/* Background script: handles periodic refresh via chrome.alarms */

const STORAGE_KEY = 'parcel-tracker:items'

type StoredItem = {
  id: string
  code: string
  label?: string
  status: string
  lastUpdated: number
  statusText?: string
}

async function updateBadgeFromStorage() {
  try {
    const data = await chrome.storage.local.get([STORAGE_KEY])
    const items = (data[STORAGE_KEY] as StoredItem[] | undefined) ?? []
    const delivered = items.filter((i) => i.status === 'Delivered').length
    const inTransit = items.filter((i) => i.status !== 'Delivered').length

    // If there are no items, clear the badge
    if (delivered + inTransit === 0) {
      await chrome.action.setBadgeText({ text: '' })
      await chrome.action.setTitle({ title: 'מעקב משלוחים' })
      return
    }

    // Show both counts as "inTransit/delivered"
    const text = `${delivered} ֿ/ ${inTransit}`
    await chrome.action.setBadgeText({ text })
    // Prefer blue when there are items in transit; otherwise green when all delivered
    await chrome.action.setBadgeBackgroundColor({ color: inTransit > 0 ? '#3B82F6' : '#10B981' })
    if (chrome.action.setBadgeTextColor) {
      await chrome.action.setBadgeTextColor({ color: '#FFFFFF' })
    }
    // Update tooltip title with full details
    await chrome.action.setTitle({ title: `בדרך: ${inTransit} | נמסרו: ${delivered}` })
    return
  } catch (err) {
    await chrome.action.setBadgeText({ text: '' })
  }
}

chrome.runtime.onInstalled.addListener(() => {
  // Create a repeating alarm to refresh parcel statuses every 3 hours
  chrome.alarms.create('refresh-parcel-statuses', { periodInMinutes: 180 });
  void updateBadgeFromStorage()
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name !== 'refresh-parcel-statuses') return;
  // Broadcast a message so the UI (if open) can refresh; otherwise, a future
  // enhancement could refresh in the background by reading storage and hitting
  // provider APIs directly.
  chrome.runtime.sendMessage({ type: 'REFRESH_ALL' });
  void updateBadgeFromStorage()
});

// When the browser starts, ensure the badge reflects current storage
if (chrome.runtime.onStartup) {
  chrome.runtime.onStartup.addListener(() => {
    void updateBadgeFromStorage()
  })
}

// Update the badge whenever our items change
chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== 'local') return
  if (Object.prototype.hasOwnProperty.call(changes, STORAGE_KEY)) {
    void updateBadgeFromStorage()
  }
})