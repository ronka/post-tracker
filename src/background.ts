/* Background script: handles periodic refresh via chrome.alarms */

chrome.runtime.onInstalled.addListener(() => {
  // Create a repeating alarm to refresh parcel statuses every 3 hours
  chrome.alarms.create('refresh-parcel-statuses', { periodInMinutes: 180 });
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name !== 'refresh-parcel-statuses') return;
  // Broadcast a message so the UI (if open) can refresh; otherwise, a future
  // enhancement could refresh in the background by reading storage and hitting
  // provider APIs directly.
  chrome.runtime.sendMessage({ type: 'REFRESH_ALL' });
});