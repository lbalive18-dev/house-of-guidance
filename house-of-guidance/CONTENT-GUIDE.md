# Updating House of Guidance

## 1. Text — edit one file
Almost everything you'd want to change lives in **`assets/js/content.js`**:
hero text, the announcement banner, programs, daily motivations, khutbahs,
events, and social links. Open it, change what's between the quotes, save,
then commit and push. Netlify rebuilds automatically.

## 2. Media — nothing is faked, everything is a labeled placeholder
No logo, photo, PDF, or video is invented anywhere in this site. Every
media reference points to a file path under `assets/media/` that **you
upload yourself**. Until a file exists at that path, the site shows a
clean fallback (initials logo, empty-state message) instead of a broken
image or a stock photo.

Create this folder structure and drop your real files in:

```
assets/media/
  logo.png              — square logo, transparent background
  hero.jpg              — wide photo for the homepage banner
  og-share.jpg          — image shown when the link is shared
  favicon.png
  gallery/
    your-photo-1.jpg
  khutbahs/
    your-recording.mp3
  documents/
    registration-form.pdf
```

Then register each one in `content.js`:
- **Gallery photo** → add a line to the `gallery` array with the file path and a caption.
- **Khutbah recording** → add a line to the `khutbahs` array with title, speaker, date, and the audio file path.
- **Event** → add a line to the `events` array. Only add events that are actually confirmed — an empty list shows "No events scheduled" instead of a made-up one.
- **PDF download** (registration form, syllabus) → fill in the path under `documents`.

## 3. Social links
`social.whatsapp` and `social.tiktok` in `content.js` are blank on
purpose. The buttons stay visibly disabled until you paste in your real
WhatsApp link (`https://wa.me/2567xxxxxxxx`) and TikTok handle.

## 4. Prayer times
These are calculated live from the **Aladhan API** using the visitor's
location (or the city you set in `content.js` under `location` if they
don't share it) — they are not hardcoded. They're accurate estimates;
the site says so on-page and points people to confirm with their local
mosque, since calculation methods can vary slightly by region.

## 5. Daily Ayah
Pulled live from **api.alquran.cloud** (Arabic text, an accepted English
translation, and audio recitation), so nothing is invented. If a visitor
is offline, the fallback ayah in `content.js` — which you should replace
with a verse you've verified yourself — is shown instead.

## 6. Prayer notifications
Visitors can tap "Turn on prayer notifications" to get a browser
notification when a prayer time arrives, while the site is open in a
tab. Full background push (notifications even with the browser fully
closed) needs a push-notification server, which this static site
doesn't have — that would be a future addition if you want it.

## 7. Deploying
Same as before: commit your changes, push to GitHub, Netlify picks it up
automatically. No build step is required — this is plain HTML/CSS/JS.

## 8. Registration form (portal.html)
The form uses **Netlify Forms** — no backend code needed. Once this is
deployed on Netlify, submissions appear automatically under your site's
**Forms** tab in the Netlify dashboard, and you can turn on an email
notification there. The honeypot field is a spam trap; leave it as is.

## 9. All pages now included
`portal.html`, `gallery.html`, and `khutbahs.html` are now built and
share the same design system, nav, footer, and Noor assistant as the
homepage. `gallery.html` and `khutbahs.html` will show a clear empty
state until you add real photos/recordings in `content.js` as described
in section 2 above.

## 11. Dhikr Counter
A tap-to-count tasbeeh, right on the homepage. Visitors pick a dhikr
phrase and a target (33/99/100), tap the circle to count, and it
vibrates gently on each tap and pulses on hitting the target. The count
is saved in the visitor's own browser (`localStorage`), so it's private
to them and persists next time they open the site — nothing is sent to
a server. Add or edit phrases in `dhikrOptions` in `content.js`.

## 12. Halal Quiz
A short, light multiple-choice quiz on basic Islamic knowledge (pillars
of Islam, Ramadan, the Qur'an, etc.) — nothing obscure or debated, just
well-known basics. Score 70% or higher and it celebrates with a burst
of floating hearts/stars; otherwise it just encourages another try, no
scolding. Edit or add questions in `quizQuestions` in `content.js` —
each needs a `question`, an `options` array, and `correctIndex` (0 =
first option).

## 13. Sakinah — breathing + verses of comfort
A calm-down space between the Daily Ayah and Daily Motivation sections:
- A guided breathing circle (inhale 4s, hold 2s, exhale 4s, six rounds by
  default — edit `breathingPattern` in `content.js` to change timing).
- A rotating "verse of comfort" — real Qur'an text and an accepted
  English translation fetched live from api.alquran.cloud, picked from a
  short list of well-known verses about patience, ease, and reliance on
  Allah (`comfortVerses` in `content.js` — add more by surah:ayah
  reference, e.g. `"2:155"`).
No music or instrumental sound is used anywhere — only breathing pacing
and real Qur'an recitation audio, so it stays comfortably halal.

- **Hijri date** — shown next to the Gregorian date in the Prayer Hub, pulled from the same Aladhan API call as prayer times.
- **Qibla direction** — calculated with real great-circle bearing math from the visitor's location to the Kaaba (21.4225, 39.8262). It's a number in degrees from true North, not a live compass — pair it with any compass app.
- **Share this Ayah** — button under the Daily Ayah card. Uses the phone's native share sheet where available, otherwise opens WhatsApp with the verse pre-filled.
- **Add to Home Screen** — `manifest.json` lets visitors install the site like an app. You need to add `assets/media/icon-192.png` and `assets/media/icon-512.png` (square icons) for this to look right; until then, most browsers just use a generic icon.
