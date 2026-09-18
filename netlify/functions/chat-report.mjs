// POST /.netlify/functions/chat-report
// Body: { room, messageId }
// Flags a message for moderator review — doesn't delete it automatically,
// just queues it for a human to look at in the admin page.

import { getStore } from '@netlify/blobs';

export default async (req) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  let body;
  try {
    body = await req.json();
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Invalid request' }), { status: 400 });
  }

  const room = typeof body.room === 'string' ? body.room.trim() : '';
  const messageId = typeof body.messageId === 'string' ? body.messageId.trim() : '';
  if (!room || !messageId) {
    return new Response(JSON.stringify({ error: 'room and messageId are required' }), { status: 400 });
  }

  const msgStore = getStore('chat-messages');
  const messages = await msgStore.get('room-' + room, { type: 'json' }).catch(() => null);
  const reportedMessage = Array.isArray(messages) ? messages.find(m => m.id === messageId) : null;

  const reportStore = getStore('chat-reports');
  const reports = (await reportStore.get('pending', { type: 'json' }).catch(() => null)) || [];

  // Avoid duplicate reports piling up for the same message
  if (!reports.some(r => r.messageId === messageId)) {
    reports.push({
      messageId,
      room,
      snapshot: reportedMessage || null, // keep a copy in case the message is edited/removed later
      reportedAt: Date.now()
    });
    await reportStore.setJSON('pending', reports);
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
};
