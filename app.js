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
  let navigating = false;

  // Fade the page out, then go. `dir` (-1 or 1) slides the page the way a swipe went.
  const navigateTo = (href, dir = 0) => {
    if (navigating) return;
    navigating = true;

    if (reduceMotion) {
      window.location.href = href;
      return;
    }

    if (dir) document.body.style.setProperty("--swipe-x", `${dir * 56}px`);
    document.body.classList.add("is-exiting");

    setTimeout(() => {
      window.location.href = href;
    }, 200);
  };

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
      navigateTo(url.href);
    });

    // Back/forward can restore this page from the cache in its exited state.
    window.addEventListener("pageshow", () => {
      navigating = false;
      document.body.classList.remove("is-exiting", "is-swiping", "is-settling");
      document.body.style.removeProperty("--swipe-x");
    });
  };

  /* ---------- Swipe between pages (touch devices) ---------- */
  // Swiping left goes to the next page in the nav, right to the previous one.
  // Pages that don't exist are skipped, and the ends of the nav don't wrap.
  const initSwipeNav = () => {
    if (!coarse) return;

    const norm = (path) => path.replace(/index\.html$/, "").replace(/\/?$/, "/");
    const pages = [...document.querySelectorAll(".site-nav .nav-link")]
      .map((a) => new URL(a.href, window.location.href))
      .filter((u) => u.origin === window.location.origin);
    const here = pages.findIndex((u) => norm(u.pathname) === norm(window.location.pathname));
    if (here === -1 || pages.length < 2) return;

    // Which nav pages actually exist? Checked once, on the first touch.
    let found = null;
    let probe = null;
    const probePages = () => {
      probe ??= Promise.all(
        pages.map((u, i) =>
          i === here
            ? true
            : fetch(u.href, { method: "HEAD" })
                .then((r) => r.ok)
                .catch(() => true) // offline or blocked: assume it exists
        )
      ).then((list) => (found = list));
      return probe;
    };

    // Warm the check up when the browser is idle so the first swipe never waits on it.
    const warm = () => (window.requestIdleCallback ?? ((fn) => window.setTimeout(fn, 800)))(probePages);
    if (document.readyState === "complete") warm();
    else window.addEventListener("load", warm, { once: true });

    const neighbour = (list, dir) => {
      for (let i = here + dir; i >= 0 && i < pages.length; i += dir) {
        if (list[i]) return pages[i];
      }
      return null;
    };

    const body = document.body;
    const EDGE = 24; // leave the screen edges to the browser's own back/forward gestures
    let touch = null;

    // Never hijack text fields or things that scroll sideways themselves.
    const blocked = (el) => {
      for (let n = el; n && n !== body; n = n.parentElement) {
        if (n.matches?.("input, textarea, select, [contenteditable], [data-no-swipe]")) return true;
        const { overflowX } = getComputedStyle(n);
        if ((overflowX === "auto" || overflowX === "scroll") && n.scrollWidth > n.clientWidth) return true;
      }
      return false;
    };

    const settle = () => {
      body.classList.remove("is-swiping");
      body.classList.add("is-settling");
      body.style.removeProperty("--swipe-x");
      window.setTimeout(() => body.classList.remove("is-settling"), 400);
    };

    window.addEventListener(
      "touchstart",
      (e) => {
        touch = null;
        if (navigating || e.touches.length !== 1) return;
        if ((window.visualViewport?.scale ?? 1) > 1.01) return; // pinch-zoomed in: let it pan
        const { clientX: x, clientY: y } = e.touches[0];
        if (x < EDGE || x > window.innerWidth - EDGE) return;
        if (blocked(e.target)) return;
        if (window.getSelection?.().toString()) return;
        touch = { x, y, t: Date.now(), mode: null };
        probePages();
      },
      { passive: true }
    );

    window.addEventListener(
      "touchmove",
      (e) => {
        if (!touch) return;
        if (e.touches.length !== 1) {
          if (touch.mode === "h") settle();
          touch = null;
          return;
        }

        const dx = e.touches[0].clientX - touch.x;
        const dy = e.touches[0].clientY - touch.y;

        // Decide once whether this is a sideways swipe or an ordinary scroll.
        if (!touch.mode && (Math.abs(dx) > 10 || Math.abs(dy) > 10)) {
          touch.mode = Math.abs(dx) > Math.abs(dy) * 1.5 ? "h" : "v";
        }
        if (touch.mode !== "h" || reduceMotion) return;

        // The page follows the finger a little; it resists when there's nowhere to go.
        const dir = dx < 0 ? 1 : -1;
        const hasNext = found ? !!neighbour(found, dir) : false;
        const pull = Math.max(-64, Math.min(64, dx * (hasNext ? 0.35 : 0.12)));
        body.classList.add("is-swiping");
        body.classList.remove("is-settling");
        body.style.setProperty("--swipe-x", `${pull}px`);
      },
      { passive: true }
    );

    const finish = (e) => {
      const t = touch;
      touch = null;
      if (!t || t.mode !== "h") return;

      const end = e.changedTouches?.[0];
      const dx = end ? end.clientX - t.x : 0;
      const dy = end ? end.clientY - t.y : 0;
      const ms = Math.max(1, Date.now() - t.t);
      const far = Math.abs(dx) >= Math.max(64, window.innerWidth * 0.2);
      const quick = Math.abs(dx) >= 40 && Math.abs(dx) / ms > 0.5;
      const committed = e.type === "touchend" && (far || quick) && Math.abs(dx) > Math.abs(dy) * 1.5;

      if (!committed) {
        settle();
        return;
      }

      probePages().then((list) => {
        const target = neighbour(list, dx < 0 ? 1 : -1);
        if (target) navigateTo(target.href, Math.sign(dx));
        else settle();
      });
    };

    window.addEventListener("touchend", finish, { passive: true });
    window.addEventListener("touchcancel", finish, { passive: true });
  };

  initSiteCursor();
  initNavTransitions();
  initSwipeNav();

  // Wait for Rajdhani so glyphs never reflow mid-animation (capped at 1.2s).
  const fontsReady = document.fonts?.ready ?? Promise.resolve();
  Promise.race([fontsReady, new Promise((r) => window.setTimeout(r, 1200))])
    .catch(() => {})
    .then(run);
})();