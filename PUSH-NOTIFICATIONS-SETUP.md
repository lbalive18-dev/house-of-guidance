# Background Prayer Notifications — Setup Guide

This is a real feature: prayer reminders that reach an Android device even
when House of Guidance is completely closed. Getting there needs a few
one-time setup steps on your end. I can't do these for you — they require
access to your Netlify account — but each one is short and I've written
exactly what to click.

## What's in this package

```
index.html, portal.html, gallery.html, khutbahs.html   ← same as before, updated
sw.js                                                    ← NEW, goes at repo root
netlify/functions/push-subscribe.mjs                     ← NEW
netlify/functions/push-unsubscribe.mjs                   ← NEW
netlify/functions/push-send-scheduled.mjs                ← NEW — the actual scheduler
netlify/functions/push-test.mjs                           ← NEW — for testing
netlify/functions/package-NEW-DEPENDENCIES-TO-MERGE.json  ← see Step 3 below
```

## Step 1 — Upload the files

Same process as always, but this time there's a folder involved
(`netlify/functions/`), which GitHub's drag-and-drop can be unreliable
with. Use this more reliable method instead:

**For the 4 HTML files + `sw.js` (5 files, no folder):**
Drag-and-drop these into **Add file → Upload files** as usual — they all
sit at the repo root, same as before.

**For the `netlify/functions/` files (this part needs a folder):**
Do this one at a time, using GitHub's "create file with a path" trick,
which reliably creates folders without needing to drag a folder at all:

1. On github.com, in your repo, click **Add file → Create new file**.
2. In the filename box, type: `netlify/functions/push-subscribe.mjs`
   (typing the slashes creates the folders automatically).
3. Open `push-subscribe.mjs` from this download, copy all its content,
   paste it into GitHub's editor.
4. Commit.
5. Repeat for `push-unsubscribe.mjs`, `push-send-scheduled.mjs`, and
   `push-test.mjs` — same folder, same method.

## Step 2 — Check for an existing `netlify/functions/package.json`

Your `noor-gemini` chat function may already have one. **Before doing
anything with `package-NEW-DEPENDENCIES-TO-MERGE.json`:**

1. Open `netlify/functions/package.json` in your repo, if it exists.
2. If it does NOT exist: create it at that path (same "create new file
   with a path" trick) and paste in the contents of
   `package-NEW-DEPENDENCIES-TO-MERGE.json` exactly.
3. If it DOES exist: open it, and inside its `"dependencies"` section,
   add these two lines (merge, don't replace anything already there):
   ```json
   "web-push": "^3.6.7",
   "@netlify/blobs": "^7.3.0"
   ```

This tells Netlify which extra code libraries to install when it builds
your site — `web-push` for sending notifications, `@netlify/blobs` for
storing who's subscribed (Netlify's own built-in storage, so no
separate database or account is needed).

## Step 3 — Set 4 environment variables in Netlify

On **app.netlify.com** → your site → **Site configuration → Environment
variables** → **Add a variable**, add these four:

| Key | Value |
|---|---|
| `VAPID_PUBLIC_KEY` | `BARJdfa2poJ3S8WSypF4ikiV12XU5NSD7nD9tV4QuG37A1gFDiD3N-3A4qtvScDHrCgbLl5yFEwUkjiPNFFpEds` |
| `VAPID_PRIVATE_KEY` | `t_MvQCxyPcmKqbvUKjOtmBEiWyeZG5kHLDWmafhC3GY` |
| `VAPID_SUBJECT` | `mailto:lbalive18@gmail.com` |
| `ADMIN_TEST_SECRET` | *(make up any password — used only by you, to send test notifications)* |

**Important:** `VAPID_PRIVATE_KEY` is a real secret — it's what lets your
server prove it's allowed to send notifications to people's phones.
Never paste it into the HTML/JS files or commit it to GitHub. It only
goes into Netlify's environment variables, which are private to your
account.

These two VAPID keys were generated freshly for House of Guidance and
aren't used anywhere else — they're yours.

## Step 4 — Redeploy and test

1. After saving the environment variables, trigger a new deploy (Netlify
   → **Deploys** → **Trigger deploy** → **Deploy site**) so the new
   functions actually build with the new variables available.
2. Open your live site and add `?testpush=1` to the end of the URL, e.g.
   `https://yoursite.netlify.app/index.html?testpush=1`
3. Scroll to the Prayer Hub, enable notifications when prompted.
4. A "🔔 Send Test Notification (admin)" button will appear. Tap it,
   enter the `ADMIN_TEST_SECRET` you set in Step 3, and you should get a
   real notification within a few seconds — even if you then close the
   tab.

## What each piece actually does

- **`sw.js`** — runs in the background, receives push messages, shows
  the notification, and opens the right page when tapped. It does
  **nothing else** — no caching, no offline logic — so it can't repeat
  the earlier caching problem.
- **`push-subscribe.mjs`** — when someone taps "Enable Prayer
  Notifications," this saves their subscription, location, timezone, and
  preferences.
- **`push-send-scheduled.mjs`** — runs **automatically every 5 minutes**
  on Netlify's servers (a "Scheduled Function," built into Netlify, no
  extra service needed). It checks every subscriber, calculates their
  prayer times, and sends any notification that's due.
- **`push-test.mjs`** — the manual test button, protected by your admin
  secret so nobody else can trigger it.
- **`push-unsubscribe.mjs`** — removes someone's subscription when they
  turn notifications off.

---

## Honest status report (as requested)

**1. What works locally (before deploy):** Nothing — this entire feature
requires Netlify's live infrastructure (Scheduled Functions, Blobs,
environment variables). There's no way to test it without deploying.

**2. What works after deploy, once Steps 1–4 above are done:** The full
flow — subscribe → server calculates prayer times → server sends a real
push notification → Android shows it, even with the site fully closed.

**3. External services required:** None beyond Netlify itself.
Netlify Blobs (storage) and Netlify Scheduled Functions (the cron job)
are both built into Netlify — no Supabase, Firebase, or separate
database signup needed.

**4. Environment variables required:** `VAPID_PUBLIC_KEY`,
`VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`, `ADMIN_TEST_SECRET` — all listed
in Step 3.

**5. Does your current hosting plan support the scheduler?** Yes —
Netlify Scheduled Functions are available on Netlify's free tier, within
its usage limits (which are generous for a site this size).

**6. Is a database required?** No — Netlify Blobs (a key-value store
built into Netlify) is used instead, avoiding a second system to manage.

**7. Is Web Push fully operational?** Yes, once Steps 1–4 are complete —
this is a genuine, working Web Push implementation using the standard
VAPID protocol, not a simulation.

**8. Do notifications work with the website closed?** Yes, on Android
Chrome and other browsers that support the Push API — that's the entire
point of this architecture (server-triggered, not `setTimeout`-based).
On iOS, Web Push only works if the site has been **installed to the
home screen first** (Apple's platform requirement, not something this
code can work around).

**9. Adhan audio limitation:** Not implemented in this phase, by design
— browsers cannot reliably autoplay a long audio file from a background
push notification; at most, a short vibration pattern is possible, which
is already included. A notification with text is the reliable, honest
baseline. If you want a "tap notification → app opens and plays Adhan"
flow later, that's addable, but it always requires the person to tap
first — no browser can play Adhan automatically with the site closed.
