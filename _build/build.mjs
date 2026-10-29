// Builds the static site: src/pages/*.html -> dist/*.html
// - Wraps each page in src/layout.html with the shared header + footer
// - Expands <x-img name="..." alt="..." sizes="..."> into responsive <img> tags
// Run: node build.mjs
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
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
    .filter(([k]) => !['name', 'alt', 'sizes', 'xl', 'eager', 'class', 'style'].includes(k))
    .map(([k, v]) => (v === '' ? ` ${k}` : ` ${k}="${v}"`)).join('');
  return `<img src="assets/img/${a.name}-lg.webp" srcset="${set.join(', ')}" sizes="${a.sizes || '100vw'}" width="${w}" height="${h}" alt="${a.alt || ''}"${a.class ? ` class="${a.class}"` : ''} style="background-color:${m.c};${a.style || ''}" ${eager ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async"${extra}>`;
}

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
  writeFileSync(join(dist, f), html);
  console.log('built', f);
}
