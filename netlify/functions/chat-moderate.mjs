// POST /.netlify/functions/chat-moderate
// Requires header: x-admin-secret: <CHAT_MODERATION_SECRET>
// Body: { action: "list" | "delete" | "dismiss", ...params }
//
// action "list"    -> returns all pending reports
// action "delete"  -> removes a specific message from its room, and
//                     clears any report for it
// action "dismiss" -> clears a report without deleting the message
//                     (use when a report turns out to be nothing)

import { getStore } from '@netlify/blobs';

export default async (req) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  const secret = req.headers.get('x-admin-secret');
  if (!secret || secret !== process.env.CHAT_MODERATION_SECRET) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  let body;
  try {
    body = await req.json();
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Invalid request' }), { status: 400 });
  }

  const reportStore = getStore('chat-reports');
  const msgStore = getStore('chat-messages');

  if (body.action === 'list') {
    const reports = (await reportStore.get('pending', { type: 'json' }).catch(() => null)) || [];
    return new Response(JSON.stringify({ ok: true, reports }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  }

  if (body.action === 'delete' || body.action === 'dismiss') {
    const { room, messageId } = body;
    if (!room || !messageId) {
      return new Response(JSON.stringify({ error: 'room and messageId are required' }), { status: 400 });
    }

    if (body.action === 'delete') {
      const key = 'room-' + room;
      let messages = await msgStore.get(key, { type: 'json' }).catch(() => null);
      if (Array.isArray(messages)) {
        messages = messages.filter(m => m.id !== messageId);
        await msgStore.setJSON(key, messages);
      }
    }

    // Either way, clear the report so it stops showing as pending
    let reports = (await reportStore.get('pending', { type: 'json' }).catch(() => null)) || [];
    reports = reports.filter(r => r.messageId !== messageId);
    await reportStore.setJSON('pending', reports);

    return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  }

  return new Response(JSON.stringify({ error: 'Unknown action' }), { status: 400 });
};
