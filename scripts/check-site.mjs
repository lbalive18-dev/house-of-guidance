import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const publicPages = [
  'index.html', 'apps.html', 'advocacy.html', 'duas.html', 'gallery.html',
  'hadith.html', 'khutbahs.html', 'learn-arabic.html', 'names.html',
  'portal.html', 'quran.html', 'tajweed.html', 'yassarna.html'
];
const failures = [];
const html = new Map();
const fail = (message) => failures.push(message);

for (const file of publicPages) {
  if (!fs.existsSync(file)) { fail(`Missing public page: ${file}`); continue; }
  const source = fs.readFileSync(file, 'utf8');
  html.set(file, source);
  if (!/<title>[^<]+<\/title>/i.test(source)) fail(`${file}: missing page title`);
  if (!/<meta\s+name="viewport"/i.test(source)) fail(`${file}: missing mobile viewport`);
  for (const match of source.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
    if (/\bsrc\s*=|application\/ld\+json/i.test(match[1])) continue;
    try { new vm.Script(match[2], { filename: file }); }
    catch (error) { fail(`${file}: inline JavaScript: ${error.message}`); }
  }

  const markup = source.replace(/<script\b[\s\S]*?<\/script>/gi, '');
  for (const match of markup.matchAll(/\b(?:src|href)="([^"#?]+)(?:#[^"]*)?"/gi)) {
    const target = match[1];
    if (/^(https?:|mailto:|tel:|data:|javascript:)/i.test(target) || target.includes('${')) continue;
    if (!/\.(?:html|css|js|mjs|png|jpe?g|webp|svg|json|webmanifest)$/i.test(target)) continue;
    const localPath = target.startsWith('/') ? target.slice(1) : path.join(path.dirname(file), target);
    if (!fs.existsSync(localPath)) fail(`${file}: missing local resource ${target}`);
  }
}

try { JSON.parse(fs.readFileSync('manifest.json', 'utf8')); }
catch (error) { fail(`Invalid PWA manifest: ${error.message}`); }
const manifest = JSON.parse(fs.readFileSync('manifest.json', 'utf8'));
for (const icon of manifest.icons ?? []) if (!fs.existsSync(icon.src)) fail(`PWA icon missing: ${icon.src}`);

const sitemap = fs.readFileSync('sitemap.xml', 'utf8');
if (!sitemap.includes('<urlset') || !sitemap.includes('</urlset>')) fail('Sitemap XML has no urlset root.');
for (const page of ['apps', 'quran.html', 'yassarna.html', 'learn-arabic.html'])
  if (!sitemap.includes(`/${page}`)) fail(`Sitemap missing public route: ${page}`);

const redirects = fs.readFileSync('_redirects', 'utf8');
if (!redirects.includes('/apps /apps.html 200')) fail('Missing /apps route redirect.');
const homepage = html.get('index.html') ?? '';
for (const url of [
  'https://quran-houseofguidance.netlify.app/',
  'https://yassarna-house-of-guidance.vercel.app/',
  'https://asmaul-husna.lbalive18.workers.dev',
  'https://wa.me/256751703270'
]) if (!homepage.includes(url)) fail(`Homepage missing verified destination: ${url}`);
for (const stale of ['chat.html', 'nasheeds.html', 'index.html#stories'])
  for (const [file, source] of html) if (source.includes(stale)) fail(`${file}: stale removed-page reference ${stale}`);

if (failures.length) {
  console.error(`Site checks failed (${failures.length}):\n- ${failures.join('\n- ')}`);
  process.exitCode = 1;
} else {
  console.log(`Site checks passed: ${publicPages.length} pages, inline scripts, local assets, PWA icons, sitemap routes and verified homepage destinations.`);
}
