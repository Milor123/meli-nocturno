// Which classes produce which computed text colors?
// Run with chrome-devtools evaluate_script(sourcePath=...).
() => {
  const targets = [
    'rgba(0, 0, 0, 0.9)',
    'rgba(0, 0, 0, 0.55)',
    'rgba(0, 0, 0, 0.898)',
    'rgb(0, 0, 0)',
    'rgb(51, 51, 51)',
    'rgb(102, 102, 102)',
    'rgb(115, 115, 115)',
    'rgb(117, 117, 117)',
    'rgb(140, 140, 140)',
    'rgb(153, 153, 153)',
    'rgb(0, 166, 80)',
    'rgb(52, 131, 250)',
    'rgb(255, 255, 255)',
    'rgb(230, 84, 11)',
    'rgb(41, 104, 200)',
    'rgb(67, 76, 228)',
  ];
  const out = {};
  for (const t of targets) out[t] = new Map();

  for (const el of document.querySelectorAll('body *')) {
    if (el.children.length > 0 || !el.textContent.trim()) continue;
    const c = getComputedStyle(el).color;
    if (!out[c]) continue;
    const map = out[c];
    const cl = el.classList;
    if (!cl.length) {
      map.set('<' + el.tagName.toLowerCase() + ' no-class>', (map.get('<' + el.tagName.toLowerCase() + ' no-class>') || 0) + 1);
    } else {
      // keep only the class that most likely carries the color (last color-ish or first 3)
      const cand = Array.from(cl).filter((x) => /color|text|label|title|price|link|muted|secondary|primary/.test(x));
      const list = (cand.length ? cand : Array.from(cl)).slice(0, 3);
      for (const k of list) map.set(k, (map.get(k) || 0) + 1);
    }
  }
  const res = {};
  for (const [k, m] of Object.entries(out)) {
    if (!m.size) continue;
    res[k] = [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);
  }
  return JSON.stringify(res);
}