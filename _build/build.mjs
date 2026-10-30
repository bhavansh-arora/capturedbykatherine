// Builds the static site: src/pages/*.html -> dist/*.html
// - Wraps each page in src/layout.html with the shared header + footer
// - Expands <x-img name="..." alt="..." sizes="..."> into responsive <img> tags
// Run: node build.mjs
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const src = join(root, 'src');
const dist = join(root, '..');
const meta = JSON.parse(readFileSync(join(src, 'imgmeta.json'), 'utf8'));
const layout = readFileSync(join(src, 'layout.html'), 'utf8');
const partial = (n) => readFileSync(join(src, 'partials', `${n}.html`), 'utf8');

const SITE = 'https://capturedbykatherine.com.au';
const variants = { sm: 900, lg: 1600, xl: 2400 };

function attrs(str) {
  const out = {};
  str.replace(/([\w-]+)(?:="([^"]*)")?/g, (_, k, v) => { out[k] = v ?? ''; });
  return out;
}

function img(a) {
  const m = meta[a.name];
  if (!m) throw new Error(`Unknown image: ${a.name}`);
  const long = Math.max(m.w, m.h);
  const set = Object.entries(variants)
    .filter(([k]) => k !== 'xl' || a.xl !== undefined)
    .map(([k, L]) => {
      const scale = Math.min(1, L / long);
      return `assets/img/${a.name}-${k}.webp ${Math.round(m.w * scale)}w`;
    });
  const w = Math.round(m.w * Math.min(1, 1600 / long));
  const h = Math.round(m.h * Math.min(1, 1600 / long));
  const eager = a.eager !== undefined;
  const extra = Object.entries(a)
    .filter(([k]) => !['name', 'alt', 'sizes', 'xl', 'eager', 'class', 'style', 'mobile'].includes(k))
    .map(([k, v]) => (v === '' ? ` ${k}` : ` ${k}="${v}"`)).join('');
  // A photo's focal point (fy, % from the top) keeps every crop centred on the people
  let style = a.style || '';
  // With JS, main.js keeps the faces in view for whatever frame the photo is in; this is the no-JS fallback.
  let fyAttr = '';
  if (m.fy !== undefined) { style = `object-position:${m.fx ?? 50}% ${Math.round(m.fy * 0.75)}%;` + style.replace(/object-position:[^;]*;?/g, ''); fyAttr = ` data-fy="${m.fy}"` + (m.fx !== undefined ? ` data-fx="${m.fx}"` : ''); }
  // Art direction: a different (portrait) photo on phones, where a wide shot can't fit everyone
  let picOpen = '', picClose = '', mAttrs = '';
  if (a.mobile) {
    const mm = meta[a.mobile];
    if (!mm) throw new Error(`Unknown mobile image: ${a.mobile}`);
    const mlong = Math.max(mm.w, mm.h);
    const mset = Object.entries(variants).filter(([k]) => k !== 'xl').map(([k, L]) => `assets/img/${a.mobile}-${k}.webp ${Math.round(mm.w * Math.min(1, L / mlong))}w`);
    const mw = Math.round(mm.w * Math.min(1, 1600 / mlong)), mh = Math.round(mm.h * Math.min(1, 1600 / mlong));
    picOpen = `<picture class="pic"><source media="(max-width: 760px)" srcset="${mset.join(', ')}" sizes="${a.sizes || '100vw'}" width="${mw}" height="${mh}">`;
    picClose = '</picture>';
    mAttrs = ` data-m-w="${mw}" data-m-h="${mh}"` + (mm.fx !== undefined ? ` data-m-fx="${mm.fx}"` : '') + (mm.fy !== undefined ? ` data-m-fy="${mm.fy}"` : '');
  }
  return picOpen + `<img src="assets/img/${a.name}-lg.webp" srcset="${set.join(', ')}" sizes="${a.sizes || '100vw'}" width="${w}" height="${h}" alt="${a.alt || ''}"${a.class ? ` class="${a.class}"` : ''} style="background-color:${m.c};${style}" ${eager ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async"${fyAttr}${mAttrs}${extra}>` + picClose;
}

// Cache-busting: stamp each CSS/JS link with a hash of the file, so browsers always fetch the latest
const stamp = (p) => createHash('sha1').update(readFileSync(join(dist, p))).digest('hex').slice(0, 8);
const versionAssets = (html) => html.replace(/(href|src)="(assets\/(?:css|js|vendor)\/[^"?]+\.(?:css|js))"/g, (_, attr, p) => `${attr}="${p}?v=${stamp(p)}"`);

// One build version for the whole site (changes whenever any page source, style or script changes).
// Internal page links carry it (?v=...), so browsers fetch the current page instead of an old cached copy.
const walk = (d) => readdirSync(d).flatMap((n) => { const p = join(d, n); return statSync(p).isDirectory() ? walk(p) : [p]; });
const BUILD = createHash('sha1').update(
  [...walk(src), ...walk(join(dist, 'assets', 'css')), ...walk(join(dist, 'assets', 'js'))].sort().map((p) => readFileSync(p)).join('')
).digest('hex').slice(0, 8);
const versionLinks = (html) => html.replace(/href="([a-z0-9-]+\.html)((?:\?[^"#]*)?)((?:#[^"]*)?)"/g,
  (_, page, q, hash) => `href="${page}${q ? q + '&amp;' : '?'}v=${BUILD}${hash}"`);

const files = readdirSync(join(src, 'pages')).filter((f) => f.endsWith('.html'));
for (const f of files) {
  let body = readFileSync(join(src, 'pages', f), 'utf8');
  // Front matter: <!--- { json } --->
  let fm = {};
  body = body.replace(/^<!---([\s\S]*?)--->\s*/, (_, j) => { fm = JSON.parse(j); return ''; });
  const page = { title: 'Captured by Katherine', description: '', nav: '', theme: 'dark', bodyClass: '', ...fm };
  let html = layout
    .replace('{{header}}', partial('header'))
    .replace('{{footer}}', fm.noFooterCta ? partial('footer') : partial('cta') + partial('footer'))
    .replace('{{content}}', body);
  html = html
    .replace(/{{title}}/g, page.title)
    .replace(/{{description}}/g, page.description)
    .replace(/{{canonical}}/g, `${SITE}/${f === 'index.html' ? '' : f}`)
    .replace(/{{ogimage}}/g, page.ogimage || 'wedding-golden-hour')
    .replace(/{{theme}}/g, page.theme)
    .replace(/{{page}}/g, f.replace('.html', ''))
    .replace(/{{bodyClass}}/g, page.bodyClass);
  // Mark the active nav link
  if (page.nav) html = html.replace(new RegExp(`data-nav="${page.nav}"`, 'g'), `data-nav="${page.nav}" aria-current="page"`);
  html = html.replace(/<x-img\s([^>]*?)\/?>/g, (_, a) => img(attrs(a)));
  html = versionLinks(versionAssets(html)).replace('</head>', `  <meta name="cbk-build" content="${BUILD}">\n</head>`);
  writeFileSync(join(dist, f), html);
  console.log('built', f);
}
