// POST /.netlify/functions/push-unsubscribe
// Removes a push subscription so the scheduler stops sending to it.

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

  const { endpoint } = body || {};
  if (!endpoint) {
    return new Response(JSON.stringify({ error: 'endpoint required' }), { status: 400 });
  }

  const store = getStore('push-subscriptions');
  const id = Buffer.from(endpoint).toString('base64url');
  await store.delete(id);

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
};
