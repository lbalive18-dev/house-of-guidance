# Noor Assistant — Setup Guide

Noor now has a real architecture behind it: it searches House of Guidance's
own content first, sends relevant excerpts to Google's Gemini AI along with
careful instructions about how to answer Islamic questions responsibly, and
shows its sources under each answer. But it needs one thing from you to
actually work: an API key.

## What's in this package

```
index.html, portal.html, gallery.html, khutbahs.html, quran.html, nasheeds.html   ← updated
netlify/functions/noor-chat.mjs        ← NEW — the real assistant backend
netlify/functions/noor-knowledge.json  ← NEW — House of Guidance's content, for Noor to search
```

Your old `noor-gemini` function (wherever it currently lives in your repo)
is left completely untouched. The site now points at a new function,
`noor-chat`, instead. You can delete the old one later once you've
confirmed the new one works, or just leave it there unused.

## Step 1 — Get a free Gemini API key

1. Go to **aistudio.google.com** and sign in with a Google account.
2. Click **Get API key** → **Create API key**.
3. Copy the key it gives you (a long string of letters and numbers).

This has a genuinely free usage tier, well within what a community site
like this needs.

## Step 2 — Upload the new files

Same process as always for the HTML files (drag into **Add file → Upload
files**). For the two new files inside `netlify/functions/`, use the
"create new file with a path" method (safer than dragging a folder):

1. On github.com, in your repo, click **Add file → Create new file**.
2. Type the filename: `netlify/functions/noor-chat.mjs`
3. Copy the contents of `noor-chat.mjs` from this download, paste it in.
4. Commit.
5. Repeat for `netlify/functions/noor-knowledge.json`.

**Important — check for an existing `netlify/functions/package.json`:**
This function needs `@netlify/blobs` as a dependency (used for basic
rate-limiting, so one person can't spam the assistant). If you already
added this when setting up push notifications, it's already there —
nothing to do. If not, make sure `netlify/functions/package.json`
contains:
```json
{
  "dependencies": {
    "@netlify/blobs": "^7.3.0"
  }
}
```
(merge this in rather than overwrite, if you already have other
dependencies listed there.)

## Step 3 — Set the environment variable

On **app.netlify.com** → your site → **Site configuration → Environment
variables** → **Add a variable**:

| Key | Value |
|---|---|
| `GEMINI_API_KEY` | *(the key you copied in Step 1)* |

This is a real secret — it's never placed in any HTML/JS file, only in
Netlify's private environment variables.

## Step 4 — Redeploy and test

1. Trigger a new deploy (Netlify → **Deploys** → **Trigger deploy**).
2. Open your live site, tap "Ask Noor," and ask a real question — try
   "What is Tajweed?" or "How can I volunteer?"
3. You should get a genuine answer, with a **Sources** row underneath
   linking back to the relevant part of your own site when relevant.
4. Try the 🗑️ button in the chat header — it clears the conversation.
5. Try Shift+Enter in the message box — it should add a new line instead
   of sending.

If you see: *"Noor isn't fully set up yet — the assistant's AI connection
hasn't been configured"* — that means `GEMINI_API_KEY` isn't set correctly
yet, or the deploy hasn't picked it up. Double-check Step 3, then
redeploy again.

## How it actually works

1. Your question is checked against 17 chunks of House of Guidance's own
   real content (About, Programs, Knowledge Hub articles, Support,
   Volunteer, Marriage, Prayer, Contact, Team, etc.) — automatically
   extracted from the same `content.js` that powers the rest of your site,
   so it can never drift out of sync with what's actually on the site.
2. The most relevant matches (if any) are sent to Gemini along with your
   question and a system instruction that tells it to: prefer Qur'an and
   authentic Sunnah, cite surah/verse or hadith collection when it's
   confident, never fabricate a verse or hadith, note when scholars
   disagree, never claim to be a mufti, and recommend a real scholar for
   personal religious rulings.
3. Gemini's answer comes back, and if any House of Guidance content was
   used, it's listed as clickable Sources underneath.

## Honest limitations

- **I could not test a live API call from my side** — I have no network
  access to actually call Gemini and confirm the exact response format
  matches what I coded against. I wrote it precisely to Google's
  documented API shape, and tested the House-of-Guidance-content search
  logic directly (that part runs with real data, no API needed) — but the
  final "does Gemini actually reply correctly" check has to happen on
  your end, per Step 4 above.
- **External trusted-source search (Level 2 in the original spec)** isn't
  implemented as live web search — that would need scraping or another
  paid API, which the spec itself said to avoid. Instead, Gemini answers
  from its own general knowledge when House of Guidance content doesn't
  cover a question, with the same strict honesty rules applied (no
  fabricated verses/hadith, recommend a scholar for rulings).
- **Rate limiting** is basic (20 messages per 10 minutes per visitor) —
  enough to stop casual abuse, not a full production-grade system.
- If a message doesn't match anything in your site's content, Noor still
  answers using general Islamic knowledge, but sources will be empty for
  that reply — that's expected, not a bug.
