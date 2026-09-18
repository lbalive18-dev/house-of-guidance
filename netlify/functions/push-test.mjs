// POST /.netlify/functions/push-test
// Sends a test notification. Protected by a shared secret — this is NOT
// a public endpoint. Requires header: x-admin-secret: <ADMIN_TEST_SECRET>
//
// Body (optional): { "endpoint": "<specific subscription endpoint>" }
// If no endpoint is given, sends the test to ALL active subscriptions —
// use with care, this is meant for you (the admin) to confirm the whole
// pipeline works, not for routine use.

import { getStore } from '@netlify/blobs';
import webpush from 'web-push';

export default async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const secret = req.headers.get('x-admin-secret');
  if (!secret || secret !== process.env.ADMIN_TEST_SECRET) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
    return new Response(JSON.stringify({ error: 'VAPID keys not configured on the server' }), { status: 500 });
  }

  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || 'mailto:lbalive18@gmail.com',
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );

  const payload = JSON.stringify({
    title: '🔔 House of Guidance Test',
    body: 'Your prayer notification system is working correctly.',
    url: '/index.html#prayer-hub',
    tag: 'hog-test'
  });

  let body = {};
  try { body = await req.json(); } catch (e) { /* no body is fine */ }

  const store = getStore('push-subscriptions');

  if (body.endpoint) {
    const id = Buffer.from(body.endpoint).toString('base64url');
    const record = await store.get(id, { type: 'json' });
    if (!record) return new Response(JSON.stringify({ error: 'Subscription not found' }), { status: 404 });
    try {
      await webpush.sendNotification(record.subscription, payload);
      return new Response(JSON.stringify({ ok: true, sent: 1 }), { status: 200 });
    } catch (err) {
      return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
    }
  }

  const { blobs } = await store.list();
  let sent = 0, failed = 0;
  for (const b of blobs) {
    const record = await store.get(b.key, { type: 'json' }).catch(() => null);
    if (!record || record.status !== 'active') continue;
    try {
      await webpush.sendNotification(record.subscription, payload);
      sent++;
    } catch (err) {
      failed++;
      if (err.statusCode === 404 || err.statusCode === 410) {
        record.status = 'inactive';
        await store.setJSON(b.key, record);
      }
    }
  }

  return new Response(JSON.stringify({ ok: true, sent, failed }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
};
