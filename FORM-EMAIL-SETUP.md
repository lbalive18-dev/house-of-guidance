# Getting Form Submissions by Email

This replaces the unreliable form submission with one I fully control —
it no longer depends on Netlify guessing which forms exist. Registration,
Volunteer, Path to Marriage, and the new Village Advocacy form all now
use this.

## Step 1 — Upload the new function

Same "create new file with a path" method as before:
1. GitHub → **Add file → Create new file**
2. Type: `netlify/functions/send-form-email.mjs`
3. Paste in that file's content, commit

## Step 2 — Get a free Resend API key

1. Go to **resend.com** and sign up — use `lbalive18@gmail.com` as your account email (important, see below)
2. Once logged in, go to **API Keys → Create API Key**
3. Copy the key it gives you (starts with `re_`)

## Step 3 — Set one environment variable

On Netlify → your site → **Site configuration → Environment variables**:

| Key | Value |
|---|---|
| `RESEND_API_KEY` | *(the key from Step 2)* |

## Step 4 — Redeploy and test

Trigger a new deploy, then submit any form on the site (Registration,
Volunteer, Marriage, or the new Village Advocacy form). You should get
an email within a few seconds.

## Why sign up with lbalive18@gmail.com specifically

Until you verify your own domain with Resend (an extra step, not
required to start), their free tier only allows sending **to the email
address you signed up with**. Since that's exactly where you want form
submissions to land, this works perfectly with zero extra setup. If you
later want a different notify address, you can add an environment
variable `FORM_NOTIFY_EMAIL` to override it — but it still needs to be
a Resend-verified address unless you verify a domain.

## Honest status

- **Email delivery**: fully real once the above is done — not a mockup.
- **WhatsApp, automatic and silent**: not built, and I want to be
  upfront about why — sending WhatsApp messages programmatically
  requires Meta's WhatsApp Business API, which needs business
  verification and approval from Meta (a real multi-day application
  process, not something an API key alone can unlock). If you want to
  pursue that later, it's a separate project I'm happy to help scope,
  but I won't fake a version of it now.
- The old Netlify Forms markup is still in the HTML as a bonus/backup —
  if it happens to work too, you'll see submissions in Netlify's
  Forms dashboard as well, but you don't need it to work for email
  delivery to succeed.

## Community Chat — one more environment variable

If you're also setting up Community Chat (`chat.html`), it needs its
own secret so only you can moderate it. Add one more environment
variable on Netlify:

| Key | Value |
|---|---|
| `CHAT_MODERATION_SECRET` | *(make up any password — used only by you, in `admin.html`, to review and delete reported chat messages)* |

No new account or API key needed for chat itself — it uses Netlify
Blobs, the same built-in storage already used for push notifications.

**Honest note on chat**: messages refresh every 5 seconds, not
instantly like WhatsApp — genuine instant messaging needs a different
kind of backend (a real-time service), which is a bigger future upgrade
if this feature takes off. Display names aren't a real login — anyone
can type any name. The safety net is: every message has a "Report"
button, and you can review + delete reported messages from `admin.html`
using the secret above.
