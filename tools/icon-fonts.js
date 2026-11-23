// Find every element whose glyph is an icon-font pseudo-element (private use
// area U+E000..U+F8FF) and whose colour is dark, i.e. invisible on our dark UI.
// Run with chrome-devtools evaluate_script(sourcePath=...).
() => {
  const pua = (s) => {
    if (!s || s === 'none' || s === 'normal' || s.length < 1) return false;
    const ch = s.replace(/^["']|["']$/g, '');
    if (ch.length !== 1) return false;
    const c = ch.codePointAt(0);
    return (c >= 0xe000 && c <= 0xf8ff) || (c >= 0xf0000 && c <= 0xffffd);
  };
  const dark = (col) => {
    const m = col.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
    if (!m) return false;
    const a = m[4] === undefined ? 1 : +m[4];
    return a > 0.3 && +m[1] < 130 && +m[2] < 130 && +m[3] < 130;
  };
  const groups = new Map();
  for (const el of document.querySelectorAll('body *')) {
    const cls = typeof el.className === 'string' ? el.className.trim() : '';
    if (!cls) continue;
    for (const pseudo of ['::before', '::after']) {
      const cs = getComputedStyle(el, pseudo);
      if (!pua(cs.content)) continue;
      const key = cls.split(/\s+/)[0];
      const entry = groups.get(key) || { count: 0, dark: 0, sample: cs.content, colors: new Set() };
      entry.count++;
      if (dark(cs.color)) {
        entry.dark++;
        entry.colors.add(cs.color);
      }
      groups.set(key, entry);
      break;
    }
  }
  const rows = [...groups.entries()]
    .filter(([, v]) => v.dark > 0)
    .sort((a, b) => b[1].dark - a[1].dark)
    .slice(0, 40)
    .map(([k, v]) => [k, v.dark, [...v.colors].slice(0, 2)]);
  const total = [...groups.values()].reduce((n, v) => n + v.count, 0);
  return JSON.stringify({ iconClasses: groups.size, glyphs: total, darkOnes: rows });
}