#!/usr/bin/env node
/**
 * Build the MercadoLibre dark theme.
 *
 *   node tools/build.mjs
 *
 * Emits:
 *   dist/meli-nocturno.css       plain CSS for any injector
 *                                    (Dark Reader custom CSS, uBlock, Vivaldi,
 *                                    bookmarklet, Tampermonkey)
 *   dist/meli-nocturno.user.css  UserCSS for userstyles.world / Stylus
 *                                    (@var palette + domain scope)
 *   dist/inject.js                   dev-only: injects the plain CSS into the
 *                                    current page (for chrome-devtools checks)
 *   dist/inject-off.js               dev-only: removes it again
 */
import { readFileSync, writeFileSync, readdirSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const src = join(root, 'src');
const dist = join(root, 'dist');
mkdirSync(dist, { recursive: true });

const TOKENS = 'tokens.css';
const BASE = 'base.css';

const all = readdirSync(src).filter((f) => f.endsWith('.css'));
const components = all
  .filter((f) => f !== TOKENS && f !== BASE)
  .sort((a, b) => a.localeCompare(b, 'en', { numeric: true }));

const order = [TOKENS, BASE, ...components];
const parts = order.map((f) => `/* ===== ${f} ===== */\n` + readFileSync(join(src, f), 'utf8').trim());
const css = parts.join('\n\n') + '\n';

/* ------------------------------------------------------------------ plain */
writeFileSync(join(dist, 'meli-nocturno.css'), css);

/* ----------------------------------------------------------------- usercss */
const META = {
  name: 'Meli Nocturno',
  namespace: 'https://github.com/Milor123/meli-nocturno',
  version: '1.0.1',
  description:
    'Comfortable dark mode for MercadoLibre in all 18 countries. Neutral blue-grey surfaces (never pure black), off-white text (never pure white), brand colours and product photos kept intact. Token-based, so it survives MELI redesigns.',
  author: 'Milor123',
  license: 'MIT',
  preprocessor: 'default',
};

/* Stylus reads @updateURL on a timer and pulls the new file when a build is
   published. The download URL points at the release asset, which is the only
   stable URL GitHub gives a single file: a raw.githubusercontent link would
   always serve `main` and could hand Stylus a half-finished work in progress. */
const REPO = 'https://github.com/Milor123/meli-nocturno';
const UPDATE_URL = `${REPO}/releases/latest/download/meli-nocturno.user.css`;

/* Each @var is emitted as a CSS custom property named exactly like the token,
   so the UserCSS surface and the token layer are the same thing. */
const VARS = [
  ['color', 'ml-surface-0', 'Page background', '#12151a'],
  ['color', 'ml-surface-1', 'Cards and panels', '#181c22'],
  ['color', 'ml-surface-2', 'Inputs, chips, hover', '#1f242c'],
  ['color', 'ml-surface-3', 'Dropdowns and tooltips', '#262c35'],
  ['color', 'ml-text-primary', 'Primary text', '#e3e8ef'],
  ['color', 'ml-text-secondary', 'Secondary text', '#a9b3c1'],
  ['color', 'ml-text-muted', 'Muted text', '#7c8794'],
  ['color', 'ml-border', 'Borders', '#2f3742'],
  ['color', 'ml-green', 'Price / shipping green', '#34d17a'],
  ['color', 'ml-blue', 'Links and accents', '#5b9bff'],
  ['color', 'ml-blue-fill', 'Brand button fill', '#3483fa'],
  ['color', 'ml-yellow', 'Brand yellow', '#ffe600'],
  ['color', 'ml-red', 'Danger red', '#ff6b7a'],
  ['color', 'ml-pink', 'Promo pink', '#ff4d94'],
];

const varLines = VARS.map(
  ([type, name, label, def]) => `@var ${type} ${name} "${label}" ${def}`,
).join('\n');

const selectVars = `@var select ml-img-dim "Product photo brightness" {
  "As shot (1.0)": "1",
  "Subtle, recommended*": "0.88",
  "Strong, least glare": "0.78"
}`;

const DOMAINS = [
  'mercadolibre.com',
  'mercadolibre.com.co',
  'mercadolibre.com.ar',
  'mercadolibre.com.mx',
  'mercadolibre.com.pe',
  'mercadolibre.com.ec',
  'mercadolibre.com.uy',
  'mercadolibre.com.py',
  'mercadolibre.com.bo',
  'mercadolibre.cl',
  'mercadolibre.com.ve',
  'mercadolibre.com.gt',
  'mercadolibre.com.hn',
  'mercadolibre.com.sv',
  'mercadolibre.com.ni',
  'mercadolibre.com.cr',
  'mercadolibre.com.pa',
  'mercadolibre.com.do',
  'mercadolivre.com.br',
];

const scoped = css
  .split('\n')
  .map((line) => (line.trim() ? '  ' + line : line))
  .join('\n');

/* ---- Cascade safety for the UserCSS variant -----------------------------
   Stylus turns every `@var` into its own `:root { --token: <value> }` block.
   Our tokens.css ALSO declares `:root { --token: <default> }`, and whichever
   block comes last wins. Stylus's insertion order is an implementation detail,
   so relying on it would make the settings panel work or silently do nothing.
   Lowering our own block to `:where(:root)` (specificity 0) makes Stylus's
   `:root` (specificity 0,1,0) win REGARDLESS of order, while the defaults still
   apply when Stylus (or another injector) supplies nothing. */
const scopedSafe = scoped.replace(/(^|\n)(\s*):root \{/, '$1$2:where(:root) {');

const usercss = `/* ==UserStyle==
@name         ${META.name}
@namespace    ${META.namespace}
@version      ${META.version}
@description  ${META.description}
@author       ${META.author}
@license      ${META.license}
@updateURL    ${UPDATE_URL}
@downloadURL  ${UPDATE_URL}
@preprocessor ${META.preprocessor}
${varLines}
${selectVars}
==/UserStyle== */

@-moz-document ${DOMAINS.map((d) => `domain("${d}")`).join(', ')} {
${scopedSafe}
}
`;

/* ---- Guard: the section-splitter token may appear exactly once ----------
   Stylus (and Stylish) split a UserCSS into independent sections by locating
   the document-wrapper at-rule. The split is a plain text search: CSS comments
   are NOT skipped and nesting is NOT supported.

   Consequence, learned the hard way: writing that at-rule name inside a CSS
   comment creates a phantom boundary, the braces stop balancing, and the whole
   style silently stops applying on EVERY page. Symptom: "nothing applies on
   /ayuda, /ofertas, /c/..." plus Stylus reporting nested-section breakage.

   We emit it once, ourselves, so any second occurrence can only come from
   source text. Fail loudly instead of shipping a style that does nothing. */
const WRAPPER = '@-moz-' + 'document'; // split so this file can never trip itself
const occurrences = usercss.split(WRAPPER).length - 1;
if (occurrences !== 1) {
  const where = css
    .split(/\r?\n/)
    .map((line, i) => (line.includes(WRAPPER) ? `  built line ~${i + 1}: ${line.trim().slice(0, 80)}` : null))
    .filter(Boolean)
    .join('\n');
  console.error(
    [
      '',
      `BUILD FAILED: the UserCSS section-splitter token appears ${occurrences} times, expected exactly 1.`,
      'Stylus splits on it as plain text (comments included), so a second occurrence breaks the whole style.',
      where ? 'Remove it from these source lines:' : '',
      where,
      '',
    ]
      .filter((line) => line !== '')
      .join('\n')
  );
  process.exit(1);
}

/* ---- Guard: prose must never leak out of a comment ----------------------
   Writing the two-character comment terminator inside a comment block ends it
   early. Everything after it is then parsed as CSS, and the linters report
   bogus syntax errors far from the real cause -- that is exactly how the
   selector fragments in the SCOPE NOTE of 99-iframes.css became
   "Expected a brace but found a dash".

   A naive "comment contains a terminator" scan cannot detect this: the first
   terminator found IS the comment end, by definition. The reliable check is
   to strip every well-formed comment and then require that every remaining
   non-empty line looks like CSS: it must end with one of `{ } ; ,` or be a
   line inside an open parenthesis. Prose that escaped a prematurely closed
   comment never does, and is reported with its line number. */
{
  const stripped = usercss.replace(/\/\*[\s\S]*?\*\//g, '');
  const leaks = [];
  let depth = 0;
  let paren = 0;  stripped.split(/\r?\n/).forEach((raw, idx) => {
    const line = raw.trim();
    if (!line) return;
    if (paren === 0) {
      const okShape = /[{};,]$/.test(line) || line.endsWith('(');
      if (!okShape) leaks.push({ line: idx + 1, text: line.slice(0, 84) });
    }
    for (const ch of line) {
      if (ch === '{') depth += 1;
      else if (ch === '}') depth = Math.max(0, depth - 1);
      else if (ch === '(') paren += 1;
      else if (ch === ')') paren = Math.max(0, paren - 1);
    }
  });
  if (leaks.length) {
    console.error(
      [
        '',
        `BUILD FAILED: ${leaks.length} line(s) of text escaped a CSS comment and would be parsed as CSS.`,
        'This happens when the two-character comment terminator is written inside a comment.',
        'Describe a comment in words instead of writing the terminator characters.',
        ...leaks.slice(0, 8).map((l) => `  built line ~${l.line}: ${l.text}`),
        '',
      ].join('\n')
    );
    process.exit(1);
  }
}
/* ---- Guard: comment blocks must balance --------------------------------
   Two distinct bugs, same root cause family, both caught only after shipping:

     1. Writing the comment TERMINATOR inside a comment ends it early, so the
        text after it is parsed as CSS (bogus "expected a brace" errors far
        from the cause).
     2. Writing a slash-then-asterisk inside a comment — typically to mean a
        route glob such as the help pages — OPENS a nested comment. CSS has no
        nested comments, so the block never really closes and everything after
        it is swallowed.

   Bug 2 went unnoticed by every other check: braces and parentheses still
   balanced, and the file "looked" fine, while four comments were left
   unterminated in the output. A simple open/close tally plus a depth walk
   catches both. */
{
  const OPEN = '/' + '*';
  const CLOSE = '*' + '/';
  let depth = 0;
  const unclosed = [];
  usercss.split(/\r?\n/).forEach((line, idx) => {
    let i = 0;
    while (i < line.length) {
      if (line.startsWith(OPEN, i)) {
        if (depth >= 1) unclosed.push({ line: idx + 1, why: 'nested comment opened', text: line.trim().slice(0, 80) });
        depth += 1;
        i += 2;
        continue;
      }
      if (line.startsWith(CLOSE, i)) {
        depth -= 1;
        if (depth < 0) depth = 0;
        i += 2;
        continue;
      }
      i += 1;
    }
  });
  if (depth !== 0 || unclosed.length) {
    console.error(
      [
        '',
        `BUILD FAILED: comment blocks do not balance (final depth ${depth}).`,
        'CSS has no nested comments: a slash-then-asterisk inside a comment opens one',
        'and swallows the rest of the file. Write route globs without the asterisk.',
        ...unclosed.slice(0, 8).map((u) => `  built line ~${u.line} (${u.why}): ${u.text}`),
        '',
      ].join('\n')
    );
    process.exit(1);
  }
}

writeFileSync(join(dist, 'meli-nocturno.user.css'), usercss);
/* ------------------------------------------------------------- dev inject */
const inject = `(() => {
  const id = 'ml-dark-inject';
  document.getElementById(id)?.remove();
  const s = document.createElement('style');
  s.id = id;
  s.textContent = ${JSON.stringify(css)};
  document.head.appendChild(s);
  return 'injected ' + s.textContent.length + ' chars';
})()`;
writeFileSync(join(dist, 'inject.js'), inject);

writeFileSync(
  join(dist, 'inject-off.js'),
  `(() => { document.getElementById('ml-dark-inject')?.remove(); return 'removed'; })()`,
);

/* ------------------------------------------------------------ dev probe
   Injects the theme AND returns a compact audit in one call, so verifying a
   page costs one round trip instead of two. */
const probe = `(async () => {
  const id = 'ml-dark-inject';
  document.getElementById(id)?.remove();
  const s = document.createElement('style');
  s.id = id;
  s.textContent = ${JSON.stringify(css)};
  document.head.appendChild(s);
  /* Wait two animation frames: appendChild only invalidates style, and a
     getComputedStyle in the same task can still answer from the OLD computed
     tree. Measuring too early silently reports the pre-injection colours. */
  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));

  const parse = (c) => { const m = c.match(/rgba?\\((\\d+),\\s*(\\d+),\\s*(\\d+)(?:,\\s*([\\d.]+))?\\)/); return m ? { r: +m[1], g: +m[2], b: +m[3], a: m[4] === undefined ? 1 : +m[4] } : null; };
  const isDark = (c) => { const v = parse(c); return !!v && v.a > 0.3 && v.r < 135 && v.g < 135 && v.b < 135; };
  const isLight = (c) => { const v = parse(c); return !!v && v.a > 0.4 && v.r > 232 && v.g > 232 && v.b > 232; };
  const darkText = new Map(), lightBg = new Map();
  for (const el of document.querySelectorAll('body *')) {
    if (el.closest('.andes-visually-hidden,[class*=visually-hidden]')) continue;
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden') continue;
    const key = (el.getAttribute('class') || el.tagName.toLowerCase()).split(/\\s+/).slice(0, 2).join('.').slice(0, 46);
    if (el.children.length === 0 && el.textContent.trim() && isDark(cs.color) && isDark(cs.webkitTextFillColor)) darkText.set(key, (darkText.get(key) || 0) + 1);
    if (isLight(cs.backgroundColor) && !el.closest('img,picture,[class*=thumbnail],[class*=picture]')) lightBg.set(key, (lightBg.get(key) || 0) + 1);
  }
  const top = (m) => [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12);
  const total = [...darkText.values()].reduce((a, b) => a + b, 0) + [...lightBg.values()].reduce((a, b) => a + b, 0);
  return JSON.stringify({ url: location.href, title: document.title.slice(0, 60), problems: total, darkText: top(darkText), lightBg: top(lightBg) });
})()`;
writeFileSync(join(dist, 'probe.js'), probe);

const nLines = css.split('\n').length;
console.log(`order: ${order.join(' -> ')}`);
console.log(`plain : dist/meli-nocturno.css        ${nLines} lines, ${css.length} bytes`);
console.log(`usercss: dist/meli-nocturno.user.css  ${usercss.split('\n').length} lines`);
console.log(`inject: dist/inject.js (dev)`);
console.log(`probe : dist/probe.js  (dev: inject + audit in one call)`);