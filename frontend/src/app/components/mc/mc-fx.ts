// Page-wide motion for the Mission Control home page, installed once after
// the sections render. Everything is opt-out under prefers-reduced-motion.
//
//  · .mc-title       words rise in with a 3D flip, staggered
//  · .mc-kicker      mono labels decode like a terminal readout
//  · .mc-holo        cards tilt toward the pointer with a holographic glare
//  · .mc-btn         buttons lean magnetically toward the pointer
//  · section.mc-sec  a gold scan-line crosses each section as it arrives

const GLYPHS = '!<>-_\\/[]{}=+*^?#01ABCDEFKX';

export function installMcFx(root: HTMLElement): () => void {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(pointer: fine)').matches;
  const cleanups: (() => void)[] = [];

  root.querySelectorAll<HTMLElement>('.mc-title').forEach(splitWords);

  if (!reduced && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver(entries => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        const el = e.target as HTMLElement;
        el.classList.add('fx-in');
        if (el.classList.contains('mc-kicker')) scramble(el);
        io.unobserve(el);
      }
    }, { rootMargin: '0px 0px -12% 0px' });
    root.querySelectorAll('.mc-title, .mc-kicker, section.mc-sec').forEach(el => io.observe(el));
    cleanups.push(() => io.disconnect());
  } else {
    root.querySelectorAll('.mc-title, .mc-kicker, section.mc-sec').forEach(el => el.classList.add('fx-in'));
  }

  if (!reduced && fine) {
    const move = (e: PointerEvent) => {
      const t = e.target as Element | null;
      const card = t?.closest?.('.mc-holo') as HTMLElement | null;
      if (card) {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
        card.style.setProperty('--ry', `${(px - .5) * 9}deg`);
        card.style.setProperty('--rx', `${(.5 - py) * 9}deg`);
        card.style.setProperty('--hx', `${px * 100}%`);
        card.style.setProperty('--hy', `${py * 100}%`);
      }
      const btn = t?.closest?.('.mc-btn') as HTMLElement | null;
      if (btn) {
        const r = btn.getBoundingClientRect();
        btn.style.translate = `${(e.clientX - r.left - r.width / 2) * .18}px ${(e.clientY - r.top - r.height / 2) * .3}px`;
      }
    };
    const out = (e: PointerEvent) => {
      const t = e.target as Element | null;
      const card = t?.closest?.('.mc-holo') as HTMLElement | null;
      if (card && !card.contains(e.relatedTarget as Node)) {
        ['--rx', '--ry', '--hx', '--hy'].forEach(p => card.style.removeProperty(p));
      }
      const btn = t?.closest?.('.mc-btn') as HTMLElement | null;
      if (btn && !btn.contains(e.relatedTarget as Node)) btn.style.translate = '';
    };
    root.addEventListener('pointermove', move, { passive: true });
    root.addEventListener('pointerout', out);
    cleanups.push(() => { root.removeEventListener('pointermove', move); root.removeEventListener('pointerout', out); });
  }

  return () => cleanups.forEach(c => c());
}

/** Wraps each word (and each inline element, kept whole) in a mask so it can rise into view. */
function splitWords(el: HTMLElement) {
  if (el.dataset['split']) return;
  el.dataset['split'] = '1';
  el.setAttribute('aria-label', el.textContent?.replace(/\s+/g, ' ').trim() ?? '');
  let i = 0;
  const wrap = (content: Node) => {
    const outer = document.createElement('span');
    outer.className = 'fx-w'; outer.setAttribute('aria-hidden', 'true');
    const inner = document.createElement('span');
    inner.style.setProperty('--i', String(i++));
    inner.appendChild(content);
    outer.appendChild(inner);
    return outer;
  };
  for (const node of Array.from(el.childNodes)) {
    if (node.nodeType === Node.TEXT_NODE) {
      const frag = document.createDocumentFragment();
      (node.textContent ?? '').split(/(\s+)/).forEach(part => {
        if (!part) return;
        frag.appendChild(/^\s+$/.test(part) ? document.createTextNode(' ') : wrap(document.createTextNode(part)));
      });
      el.replaceChild(frag, node);
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      el.replaceChild(wrap(node.cloneNode(true)), node);
    }
  }
}

/** Decodes the text nodes of a label from random glyphs, left to right. */
function scramble(el: HTMLElement) {
  const nodes: { n: Text; final: string }[] = [];
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    if ((n.textContent ?? '').trim()) nodes.push({ n: n as Text, final: n.textContent ?? '' });
  }
  const total = nodes.reduce((a, x) => a + x.final.length, 0);
  const start = performance.now(), dur = 700;
  const tick = (now: number) => {
    const p = Math.min(1, (now - start) / dur);
    let budget = Math.floor(p * total);
    for (const x of nodes) {
      const keep = Math.min(x.final.length, Math.max(0, budget));
      budget -= x.final.length;
      x.n.textContent = x.final.slice(0, keep) + Array.from(x.final.slice(keep), c =>
        c === ' ' ? ' ' : GLYPHS[(Math.random() * GLYPHS.length) | 0]).join('');
    }
    if (p < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}
