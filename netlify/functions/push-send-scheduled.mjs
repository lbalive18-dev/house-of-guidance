// Netlify Scheduled Function — runs automatically every 5 minutes.
// For each active subscription: fetches today's prayer times for that
// subscriber's location, checks whether any enabled prayer notification
// (or Jumu'ah / adhkar reminder) is due in this window, and sends it via
// Web Push. This is the piece that makes notifications work even when
// the website is completely closed — it runs on Netlify's servers, not
// in the visitor's browser.

import { getStore } from '@netlify/blobs';
import webpush from 'web-push';

const PRAYERS = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];

async function fetchTimings(lat, lng, method) {
  const url = `https://api.aladhan.com/v1/timings?latitude=${lat}&longitude=${lng}&method=${method}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Aladhan request failed: ' + res.status);
  const data = await res.json();
  return data.data.timings;
}

function todayKeyInTZ(tz) {
  try { return new Date().toLocaleDateString('en-CA', { timeZone: tz }); }
  catch (e) { return new Date().toISOString().slice(0, 10); }
}

function nowInTZ(tz) {
  try { return new Date(new Date().toLocaleString('en-US', { timeZone: tz })); }
  catch (e) { return new Date(); }
}

async function sendOrDeactivate(webpushLib, record, payload) {
  try {
    await webpushLib.sendNotification(record.subscription, payload);
    return { ok: true };
  } catch (err) {
    if (err.statusCode === 404 || err.statusCode === 410) {
      record.status = 'inactive';
      return { ok: false, deactivated: true };
    }
    return { ok: false, deactivated: false };
  }
}

export default async () => {
  if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
    console.error('VAPID keys not configured — scheduled push run skipped.');
    return new Response('Missing VAPID configuration', { status: 500 });
  }

  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || 'mailto:lbalive18@gmail.com',
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );

  const store = getStore('push-subscriptions');
  const { blobs } = await store.list();

  for (const b of blobs) {
    const record = await store.get(b.key, { type: 'json' }).catch(() => null);
    if (!record || record.status !== 'active') continue;

    const prefs = record.preferences || {};
    if (!prefs.enabled) continue;

    let timings;
    try {
      timings = await fetchTimings(record.lat, record.lng, record.calculationMethod || 3);
    } catch (e) {
      continue; // try this subscriber again next run
    }

    const tz = record.timezone || 'UTC';
    const dayKey = todayKeyInTZ(tz);
    const now = nowInTZ(tz);

    if (!record.sentLog || record.sentLog.day !== dayKey) {
      record.sentLog = { day: dayKey };
    }

    let changed = false;

    // --- Daily prayers ---
    for (const prayer of PRAYERS) {
      if (!prefs.prayers || !prefs.prayers[prayer]) continue;
      const timeStr = (timings[prayer] || '').split(' ')[0];
      if (!timeStr) continue;
      const [h, m] = timeStr.split(':').map(Number);
      const prayerDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m, 0);
      const timing = Number.isFinite(prefs.timing) ? prefs.timing : 0;
      const targetTime = new Date(prayerDate.getTime() - timing * 60000);
      const diffMinutes = (now - targetTime) / 60000;
      const eventKey = `${prayer}-${timing}`;

      // 16-minute window covers the 15-minute run interval without double-firing.
      if (diffMinutes >= 0 && diffMinutes < 16 && !record.sentLog[eventKey]) {
        const title = timing === 0 ? `🕌 ${prayer} Prayer` : `🕌 ${prayer} Reminder`;
        const body = timing === 0 ? `It is time for ${prayer} prayer.` : `${prayer} prayer is in ${timing} minutes.`;
        const payload = JSON.stringify({ title, body, prayer, timing, url: '/index.html#prayer-hub', tag: `hog-${prayer}-${dayKey}` });
        const result = await sendOrDeactivate(webpush, record, payload);
        if (result.ok) { record.sentLog[eventKey] = true; changed = true; }
        else if (result.deactivated) { changed = true; break; }
      }
    }

    if (record.status === 'inactive') { await store.setJSON(b.key, record); continue; }

    // --- Jumu'ah: Thursday from 5pm local time, once per week ---
    if (prefs.jumuah && now.getDay() === 4 && now.getHours() >= 17) {
      const key = `jumuah-${dayKey}`;
      if (!record.sentLog[key]) {
        const payload = JSON.stringify({
          title: "🕌 Jumu'ah Reminder",
          body: "Jumu'ah is tomorrow. Prepare yourself, increase your Ṣalawāt upon the Prophet ﷺ, and attend the Friday prayer.",
          url: '/index.html#prayer-hub', tag: 'hog-jumuah'
        });
        const result = await sendOrDeactivate(webpush, record, payload);
        if (result.ok) { record.sentLog[key] = true; changed = true; }
        else if (result.deactivated) changed = true;
      }
    }

    // --- Morning / evening adhkar: ~10 minutes after Fajr / Asr ---
    if (record.status === 'active' && (prefs.morningAdhkar || prefs.eveningAdhkar)) {
      const fajrStr = (timings.Fajr || '').split(' ')[0];
      const asrStr = (timings.Asr || '').split(' ')[0];

      if (prefs.morningAdhkar && fajrStr && !record.sentLog.morningAdhkar) {
        const [h, m] = fajrStr.split(':').map(Number);
        const target = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m + 10, 0);
        const diff = (now - target) / 60000;
        if (diff >= 0 && diff < 16) {
          const result = await sendOrDeactivate(webpush, record, JSON.stringify({
            title: '🌅 Morning Adhkar', body: 'A gentle reminder for your morning remembrance of Allah.',
            url: '/index.html#prayer-hub', tag: 'hog-morning-adhkar'
          }));
          if (result.ok) { record.sentLog.morningAdhkar = true; changed = true; }
          else if (result.deactivated) changed = true;
        }
      }
      if (record.status === 'active' && prefs.eveningAdhkar && asrStr && !record.sentLog.eveningAdhkar) {
        const [h, m] = asrStr.split(':').map(Number);
        const target = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m + 10, 0);
        const diff = (now - target) / 60000;
        if (diff >= 0 && diff < 16) {
          const result = await sendOrDeactivate(webpush, record, JSON.stringify({
            title: '🌇 Evening Adhkar', body: 'A gentle reminder for your evening remembrance of Allah.',
            url: '/index.html#prayer-hub', tag: 'hog-evening-adhkar'
          }));
          if (result.ok) { record.sentLog.eveningAdhkar = true; changed = true; }
          else if (result.deactivated) changed = true;
        }
      }
    }

    if (changed) await store.setJSON(b.key, record);
  }

  return new Response('OK', { status: 200 });
};

// Netlify Scheduled Function config — runs every 5 minutes automatically
// once deployed. No separate cron service needed; this is built into
// Netlify itself (available on Netlify's free tier).
export const config = {
  // Every 15 minutes instead of every 5 — a 3x reduction in Netlify Function
  // invocations, since this runs continuously whether or not anyone visits
  // the site. A prayer reminder within 15 minutes is still perfectly useful.
  schedule: '*/15 * * * *'
};
