(() => {
  const FULL_NAME = "Sonoth Amin";
  const grid = document.querySelector(".design-grid");
  const siteCursor = document.querySelector("[data-site-cursor]");
  const name = document.querySelector("[data-hero-name]");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const coarse = window.matchMedia("(hover: none), (pointer: coarse)").matches;

  /* ---------- Cursor sizing (unchanged behaviour) ---------- */
  const getCursorMetrics = () => {
    const dpr = window.devicePixelRatio || 1;
    const density = (96 * dpr) / 160;

    let scale = 1;
    if (density >= 3.5) scale = 4;
    else if (density >= 2.5) scale = 3;
    else if (density >= 1.75) scale = 2;
    else if (density >= 1.25) scale = 1.5;

    const shortCss = Math.min(window.innerWidth, window.innerHeight);
    const baseMdpi = Math.round(Math.max(48, Math.min(64, shortCss * 0.045)));
    const sizeCss = Math.round(baseMdpi * scale);

    return {
      sizeCss,
      hotspotX: Math.round(sizeCss * (10.5 / 24)),
      hotspotY: Math.round(sizeCss * (9 / 24)),
    };
  };

  let metrics = getCursorMetrics();

  const applyCursorSize = (m) => {
    const root = document.documentElement;
    root.style.setProperty("--cursor-size", `${m.sizeCss}px`);
    root.style.setProperty("--cursor-hot-x", `${m.hotspotX}px`);
    root.style.setProperty("--cursor-hot-y", `${m.hotspotY}px`);
    root.style.setProperty("--cursor", `url("/assets/cursors/cursor.svg") ${m.hotspotX} ${m.hotspotY}, auto`);

    if (!siteCursor) return;
    // Hand pointer: ~0.58x the arrow box, fingertip (41.5% / 9%) lands on the hotspot.
    const hand = Math.round(m.sizeCss * 0.58);
    const hx = hand * 0.415;
    const hy = hand * 0.09;
    siteCursor.style.setProperty("--hand-size", `${hand}px`);
    siteCursor.style.setProperty("--hand-hx", `${hx}px`);
    siteCursor.style.setProperty("--hand-hy", `${hy}px`);
    siteCursor.style.setProperty("--hand-left", `${m.hotspotX - hx}px`);
    siteCursor.style.setProperty("--hand-top", `${m.hotspotY - hy}px`);
  };

  applyCursorSize(metrics);
  window.addEventListener(
    "resize",
    () => {
      metrics = getCursorMetrics();
      applyCursorSize(metrics);
    },
    { passive: true }
  );

  /* ---------- Site cursor + grid glow ---------- */
  // Independent of the intro: it simply takes over on the first mouse move.
  const initSiteCursor = () => {
    if (!siteCursor || coarse) return;

    const move = (x, y) => {
      siteCursor.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      siteCursor.classList.add("is-on");
      if (grid) {
        grid.style.setProperty("--mx", `${x}px`);
        grid.style.setProperty("--my", `${y}px`);
        grid.classList.add("has-glow");
      }
    };

    window.addEventListener(
      "pointermove",
      (e) => {
        if (!document.body.classList.contains("cursor-ready")) {
          document.body.classList.add("cursor-ready");
        }
        move(e.clientX, e.clientY);
      },
      { passive: true }
    );

    document.documentElement.addEventListener("mouseleave", () => {
      siteCursor.classList.remove("is-on");
      grid?.classList.remove("has-glow");
    });
    document.addEventListener("pointerover", (e) => {
      siteCursor.classList.toggle(
        "is-link",
        !!e.target.closest("a, button, [role='button'], summary, label[for]")
      );
    });
    window.addEventListener("pointerdown", () => siteCursor.classList.add("is-press"));
    window.addEventListener("pointerup", () => siteCursor.classList.remove("is-press"));
  };

  /* ---------- Intro ---------- */
  // Split the name into masked glyphs so each can rise on its own.
  const buildName = () => {
    if (!name) return;
    const frag = document.createDocumentFragment();
    let i = 0;

    for (const char of FULL_NAME) {
      if (char === " ") {
        const gap = document.createElement("span");
        gap.className = "gap";
        gap.setAttribute("aria-hidden", "true");
        frag.append(gap);
        continue;
      }
      const mask = document.createElement("span");
      mask.className = "mask";
      mask.setAttribute("aria-hidden", "true");
      const ch = document.createElement("span");
      ch.className = "ch";
      ch.textContent = char;
      ch.style.setProperty("--i", String(i++));
      mask.append(ch);
      frag.append(mask);
    }

    name.setAttribute("aria-label", FULL_NAME);
    name.textContent = "";
    name.append(frag);
    name.classList.add("is-built");
  };

  const play = () => {
    // Two frames so the starting state is painted before transitions begin.
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        grid?.classList.add("is-visible");
        document.body.classList.add("is-in");
      })
    );
  };

  const run = () => {
    buildName();
    if (reduceMotion) {
      grid?.classList.add("is-visible");
      document.body.classList.add("is-in");
      return;
    }
    play();
  };

  /* ---------- Page navigation transitions ---------- */
  const initNavTransitions = () => {
    document.addEventListener("click", (e) => {
      const link = e.target.closest("a");
      if (!link) return;

      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      if (link.target && link.target !== "_self") return;
      if (link.hasAttribute("download")) return;

      const href = link.getAttribute("href");
      if (!href || href.startsWith("#") || href.startsWith("javascript:") || href.startsWith("mailto:") || href.startsWith("tel:")) return;

      const url = new URL(link.href, window.location.href);
      if (url.origin !== window.location.origin) return;

      // Ignore anchor jumps or clicking current page
      if (url.pathname === window.location.pathname && url.search === window.location.search) {
        if (url.hash) return;
        e.preventDefault();
        return;
      }

      if (reduceMotion) return;

      e.preventDefault();
      document.body.classList.add("is-exiting");

      setTimeout(() => {
        window.location.href = url.href;
      }, 200);
    });

    window.addEventListener("pageshow", (e) => {
      document.body.classList.remove("is-exiting");
    });
  };

  initSiteCursor();
  initNavTransitions();

  // Wait for Rajdhani so glyphs never reflow mid-animation (capped at 1.2s).
  const fontsReady = document.fonts?.ready ?? Promise.resolve();
  Promise.race([fontsReady, new Promise((r) => window.setTimeout(r, 1200))])
    .catch(() => {})
    .then(run);
})();