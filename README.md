# House of Guidance — Simple Version (no folders)

This version is just 4 files. No subfolders, nothing to link together —
each file has everything it needs built in. This is specifically so you
can upload it to GitHub the way you already do: drag files in.

## What to do

1. Open your GitHub repo in the browser.
2. Click **Add file → Upload files**.
3. Drag in these 4 files: `index.html`, `portal.html`, `gallery.html`,
   `khutbahs.html`. That's it — no folders, no assets, nothing else
   required to upload right now.
4. Scroll down, write a commit message like "Simplify site," click
   **Commit changes**.
5. Netlify redeploys automatically. Give it a minute, then open your
   site fresh (close the tab fully, reopen).

## About your logo and photos

You don't need to upload any images for the site to work — it already
shows clean, good-looking fallbacks everywhere (a text logo badge, empty
gallery/khutbah messages, etc.). Add real photos whenever you're ready,
no rush:

1. In your GitHub repo, click **Add file → Upload files** again.
2. Drag in your image/audio files directly — no folder needed, they go
   right next to `index.html`. For example: `logo.png`, `hero.jpg`,
   photos for the gallery, `.mp3` files for khutbahs.
3. Then tell me the filenames you used, and I'll wire them into the
   site's content for you (or you can do it yourself — see below).

## Editing text yourself (no upload needed at all)

For small text changes — the WhatsApp number, an announcement, a quiz
question — you don't need to upload anything. On github.com:

1. Open `index.html` in your repo.
2. Click the **pencil icon** (top right of the file) to edit it directly
   in the browser.
3. Use Ctrl+F (or your browser's find) to search for the text you want
   to change — for example search for `whatsapp:` to find the WhatsApp
   link, or `quizQuestions` to find the quiz.
4. Change the text between the quotes, scroll down, commit.

Everything editable (WhatsApp/TikTok links, prayer city, quiz questions,
dhikr phrases, khutbah list, gallery list, events) lives near the very
top of the file, inside a clearly labeled section that starts with:

```
const SITE_CONTENT = {
```

Change what's between the quotes `" "`. Don't change anything outside
the quotes unless you're comfortable with that — the structure
(commas, brackets) needs to stay intact for the file to work.

## What's different from before

- No `assets` folder, no separate CSS/JS files, no service worker, no
  app-install manifest. All of that added moving parts that made drag
  ‑and-drop uploads fragile. This version trades a few extra features
  for something that reliably works with how you're deploying.
- Everything that worked before (live prayer times, Qibla direction,
  daily Ayah, Sakinah breathing + verses of comfort, dhikr counter,
  halal quiz, Noor chat, registration form, gallery, khutbahs) is still
  here — just packed into 4 self-contained files instead of many small
  ones.

## If something still looks wrong after uploading

Please send me a screenshot AND tell me the exact web address (URL) you
see in the browser bar when it looks wrong — that helps me check the
actual live file instead of guessing.
