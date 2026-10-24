// Dwell in the frame for DELAY ms → reveal that edge; leave the panel for GRACE ms → hide.
const DELAY = 150, GRACE = 300;
let dwell = null, grace = null, armedAt = 0, open = null;
const samples = [];

function edgeAt(x, y) {
  const w = innerWidth, h = innerHeight, m = 8;
  if (x < m) return "left";
  if (x > w - m) return "right";
  if (y < m) return "top";
  if (y > h - m) return "bottom";
  return null;
}

document.addEventListener("mousemove", (e) => {
  if (open) { clearTimeout(grace); grace = null; return; }
  const edge = edgeAt(e.clientX, e.clientY);
  if (!edge) return;
  if (!dwell) dwell = setTimeout(() => { dwell = null; armedAt = performance.now(); cb.reveal(edge); }, DELAY);
});

document.addEventListener("mouseleave", () => {
  clearTimeout(dwell); dwell = null;
  if (open) grace = setTimeout(() => cb.hide(), GRACE);
});

cb.onState((s) => {
  open = s.open;
  document.body.classList.toggle("open", !!open);
  document.getElementById("title").textContent = open ? `${open} panel` : "";
  if (open && armedAt) {
    requestAnimationFrame(() => requestAnimationFrame(() => {
      samples.push(performance.now() - armedAt); armedAt = 0;
      const sorted = [...samples].sort((a, b) => a - b);
      document.getElementById("log").textContent =
        `reveal → painted: last ${samples.at(-1).toFixed(1)} ms, median ${sorted[sorted.length >> 1].toFixed(1)} ms (n=${samples.length})`;
      console.log("CB_REVEAL_MS", samples.at(-1).toFixed(2));
    }));
  }
});
