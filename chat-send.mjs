// POST /.netlify/functions/chat-send
// Body: { room, name, text }
// Stores the message in Netlify Blobs, capped at the last 200 messages
// per room (oldest drop off automatically). Rate-limited per IP to
// discourage spam/flooding.

import { getStore } from '@netlify/blobs';

const MAX_MESSAGES_PER_ROOM = 200;
const MAX_NAME_LENGTH = 30;
const MAX_TEXT_LENGTH = 500;
const RATE_LIMIT_MAX = 20;              // messages
const RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000; // per 5 minutes, per IP

function getClientIp(req) {
  return req.headers.get('x-nf-client-connection-ip') || req.headers.get('x-forwarded-for') || 'unknown';
}

async function checkRateLimit(ip) {
  const store = getStore('chat-rate-limits');
  const key = 'ip-' + ip;
  const now = Date.now();
  let record = await store.get(key, { type: 'json' }).catch(() => null);
  if (!record || now - record.windowStart > RATE_LIMIT_WINDOW_MS) {
    record = { windowStart: now, count: 0 };
  }
  record.count++;
  await store.setJSON(key, record);
  return record.count <= RATE_LIMIT_MAX;
}

function makeId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

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
  const name = typeof body.name === 'string' ? body.name.trim().slice(0, MAX_NAME_LENGTH) : '';
  const text = typeof body.text === 'string' ? body.text.trim().slice(0, MAX_TEXT_LENGTH) : '';

  if (!room || !name || !text) {
    return new Response(JSON.stringify({ error: 'room, name, and text are required' }), { status: 400 });
  }

  const ip = getClientIp(req);
  const withinLimit = await checkRateLimit(ip).catch(() => true); // fail open
  if (!withinLimit) {
    return new Response(JSON.stringify({ error: 'rate_limited', message: "You're sending messages too quickly — please slow down." }), { status: 200 });
  }

  const store = getStore('chat-messages');
  const key = 'room-' + room;
  let messages = await store.get(key, { type: 'json' }).catch(() => null);
  if (!Array.isArray(messages)) messages = [];

  const message = {
    id: makeId(),
    room,
    name,
    text,
    ts: Date.now()
  };
  messages.push(message);
  if (messages.length > MAX_MESSAGES_PER_ROOM) {
    messages = messages.slice(messages.length - MAX_MESSAGES_PER_ROOM);
  }

  await store.setJSON(key, messages);

  return new Response(JSON.stringify({ ok: true, message }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
};
