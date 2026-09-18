// POST /.netlify/functions/send-form-email
// Sends form submissions (Registration, Volunteer, Path to Marriage) as an
// email, using Resend (https://resend.com) — a real transactional email API.
// Requires RESEND_API_KEY to be set as a Netlify environment variable; see
// FORM-EMAIL-SETUP.md for exactly how to get one.

const NOTIFY_EMAIL = process.env.FORM_NOTIFY_EMAIL || 'lbalive18@gmail.com';

const FORM_LABELS = {
  registration: 'New Registration',
  volunteer: 'New Volunteer Interest',
  'marriage-interest': 'New Path to Marriage Submission (Private)',
  'village-advocacy': 'Village Advocacy — Private Report'
};

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
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

  const { formType, fields } = body || {};
  if (!formType || typeof fields !== 'object' || !fields) {
    return new Response(JSON.stringify({ error: 'formType and fields are required' }), { status: 400 });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    // Honest response — don't pretend it was sent when it wasn't.
    return new Response(JSON.stringify({
      ok: false,
      unavailable: true,
      message: 'Email delivery is not configured yet.'
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  }

  const label = FORM_LABELS[formType] || `New Submission: ${formType}`;
  const rows = Object.entries(fields)
    .filter(([key]) => key !== 'form-name' && !key.startsWith('bot-field'))
    .map(([key, value]) => `<tr><td style="padding:6px 12px;font-weight:600;vertical-align:top;">${escapeHtml(key)}</td><td style="padding:6px 12px;">${escapeHtml(value || '—')}</td></tr>`)
    .join('');

  const html = `
    <div style="font-family:sans-serif;">
      <h2>${escapeHtml(label)}</h2>
      <table style="border-collapse:collapse;">${rows}</table>
      <p style="color:#888;font-size:12px;margin-top:16px;">Sent automatically from the House of Guidance website.</p>
    </div>
  `;

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'House of Guidance <onboarding@resend.dev>',
        to: NOTIFY_EMAIL,
        subject: label,
        html
      })
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      console.error('Resend API error:', res.status, errText.slice(0, 500));
      return new Response(JSON.stringify({ ok: false, error: 'Email service error' }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (e) {
    console.error('send-form-email error:', e);
    return new Response(JSON.stringify({ ok: false, error: 'Could not send email' }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  }
};
