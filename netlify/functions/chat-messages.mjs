// GET /.netlify/functions/chat-messages?room=general
// Returns the most recent messages for a room (up to 100), newest last.

import { getStore } from '@netlify/blobs';

export default async (req) => {
  if (req.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  const url = new URL(req.url);
  const room = (url.searchParams.get('room') || '').trim();
  if (!room) {
    return new Response(JSON.stringify({ error: 'room is required' }), { status: 400 });
  }

  const store = getStore('chat-messages');
  let messages = await store.get('room-' + room, { type: 'json' }).catch(() => null);
  if (!Array.isArray(messages)) messages = [];

  // Never return messages that have been deleted by a moderator — those
  // are removed from storage entirely in chat-moderate.mjs, so this is
  // just returning whatever remains.
  return new Response(JSON.stringify({ messages: messages.slice(-100) }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
};
