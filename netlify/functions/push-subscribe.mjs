// POST /.netlify/functions/push-subscribe
// Stores (or updates) a push subscription plus the visitor's location,
// timezone, calculation method, and notification preferences.
// Uses Netlify Blobs — a key/value store built into Netlify itself, so
// no separate database or account is needed.

import { getStore } from '@netlify/blobs';

export default async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  let body;
  try {
    body = await req.json();
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 });
  }

  const { subscription, lat, lng, city, country, timezone, calculationMethod, preferences } = body || {};

  if (!subscription || !subscription.endpoint || !subscription.keys || !subscription.keys.p256dh || !subscription.keys.auth) {
    return new Response(JSON.stringify({ error: 'Invalid subscription object' }), { status: 400 });
  }
  if (typeof lat !== 'number' || typeof lng !== 'number') {
    return new Response(JSON.stringify({ error: 'lat/lng required' }), { status: 400 });
  }

  const store = getStore('push-subscriptions');
  const id = Buffer.from(subscription.endpoint).toString('base64url');

  const existing = await store.get(id, { type: 'json' }).catch(() => null);

  const record = {
    id,
    subscription,
    lat,
    lng,
    city: city || '',
    country: country || '',
    timezone: timezone || 'UTC',
    calculationMethod: Number.isFinite(calculationMethod) ? calculationMethod : 3,
    preferences: preferences || {},
    status: 'active',
    createdAt: existing ? existing.createdAt : new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    sentLog: existing ? (existing.sentLog || {}) : {}
  };

  await store.setJSON(id, record);

  return new Response(JSON.stringify({ ok: true, id }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
};
