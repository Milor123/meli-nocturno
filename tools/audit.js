// Compact DOM/color audit for MercadoLibre pages.
// Run with chrome-devtools evaluate_script(sourcePath=...).
() => {
  const norm = (c) => c;
  const rgba = (c) => {
    const m = c.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
    if (!m) return null;
    return { r: +m[1], g: +m[2], b: +m[3], a: m[4] === undefined ? 1 : +m[4] };
  };
  const nearWhite = (v) => v && v.a > 0.5 && v.r > 235 && v.g > 235 && v.b > 235;
  const nearBlack = (v) => v && v.a > 0.5 && v.r < 45 && v.g < 45 && v.b < 45;
  const nearGrey = (v) => v && v.a > 0.5 && v.r > 200 && v.r < 250 && Math.abs(v.r - v.g) < 6 && Math.abs(v.g - v.b) < 6;

  const all = Array.from(document.querySelectorAll('body *'));
  const bgMap = new Map(), fgMap = new Map(), bdMap = new Map();
  const whiteCls = new Map(), blackCls = new Map(), greyCls = new Map();
  const andes = new Map(), ui = new Map();

  for (const el of all) {
    const s = getComputedStyle(el);
    const bg = s.backgroundColor;
    bgMap.set(bg, (bgMap.get(bg) || 0) + 1);
    if (el.children.length === 0 && el.textContent.trim()) {
      fgMap.set(s.color, (fgMap.get(s.color) || 0) + 1);
    }
    if (s.borderTopWidth !== '0px' && s.borderTopStyle !== 'none') {
      bdMap.set(s.borderTopColor, (bdMap.get(s.borderTopColor) || 0) + 1);
    }
    const cl = el.classList;
    for (const c of cl) {
      if (c.startsWith('andes-')) andes.set(c, (andes.get(c) || 0) + 1);
      const m = c.match(/^ui-[a-z0-9]+/);
      if (m) ui.set(m[0], (ui.get(m[0]) || 0) + 1);
    }
    const v = rgba(bg);
    let bucket = null;
    if (nearWhite(v)) bucket = whiteCls;
    else if (nearBlack(v)) bucket = blackCls;
    else if (nearGrey(v)) bucket = greyCls;
    if (bucket) {
      if (!cl.length) bucket.set('<inline/no-class>', (bucket.get('<inline/no-class>') || 0) + 1);
      for (const c of cl) bucket.set(c, (bucket.get(c) || 0) + 1);
    }
  }
  const top = (m, n) => [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, n);

  return JSON.stringify({
    url: location.href,
    title: document.title.slice(0, 70),
    elements: all.length,
    images: document.images.length,
    iframes: document.querySelectorAll('iframe').length,
    bg: top(bgMap, 14),
    fg: top(fgMap, 14),
    bd: top(bdMap, 10),
    whiteBgClasses: top(whiteCls, 24),
    greyBgClasses: top(greyCls, 12),
    andes: top(andes, 40),
    ui: top(ui, 30),
  });
}