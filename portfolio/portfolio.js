(() => {
  const tabs = [...document.querySelectorAll('[role="tab"]')];
  if (!tabs.length) return;

  const panelOf = (tab) => document.getElementById(tab.getAttribute("aria-controls"));

  /* Below this width the categories stack as titled sections instead of tabs */
  const stackedMq = window.matchMedia("(max-width: 820px)");
  const isStacked = () => stackedMq.matches;

  /* Counts come from the panels, so they never go stale */
  tabs.forEach((tab) => {
    const panel = panelOf(tab);
    const label = String(panel.querySelectorAll(".item").length).padStart(2, "0");
    const n = tab.querySelector(".cat-n");
    if (n) n.textContent = label;
    const title = panel.querySelector(".panel-title");
    if (title) title.dataset.count = label;
  });

  /* ---------- Items: one open at a time per category ---------- */
  const setOpen = (item, open) => {
    item.classList.toggle("is-open", open);
    item.querySelector(".item-head")?.setAttribute("aria-expanded", String(open));
  };

  const closeAll = () => {
    document.querySelectorAll(".item.is-open").forEach((item) => setOpen(item, false));
  };

  document.querySelectorAll(".item-head").forEach((head) => {
    head.addEventListener("click", () => {
      const item = head.closest(".item");
      const willOpen = !item.classList.contains("is-open");
      item.parentElement.querySelectorAll(".item.is-open").forEach((other) => {
        if (other !== item) setOpen(other, false);
      });
      setOpen(item, willOpen);
    });
  });

  /* ---------- Categories ---------- */
  const select = (tab, { focus = false, updateHash = true } = {}) => {
    tabs.forEach((t) => {
      const on = t === tab;
      t.setAttribute("aria-selected", String(on));
      t.tabIndex = on ? 0 : -1;
      if (!isStacked()) panelOf(t).hidden = !on;
    });
    closeAll();
    if (updateHash) history.replaceState(null, "", `#${tab.dataset.cat}`);
    if (focus) tab.focus();
  };

  tabs.forEach((tab, i) => {
    tab.addEventListener("click", () => select(tab));

    tab.addEventListener("keydown", (e) => {
      const keys = {
        ArrowDown: i + 1,
        ArrowRight: i + 1,
        ArrowUp: i - 1,
        ArrowLeft: i - 1,
        Home: 0,
        End: tabs.length - 1,
      };
      if (!(e.key in keys)) return;
      e.preventDefault();
      select(tabs[(keys[e.key] + tabs.length) % tabs.length], { focus: true });
    });
  });

  const fromHash = () => tabs.find((t) => t.dataset.cat === location.hash.slice(1));
  const current = () => tabs.find((t) => t.getAttribute("aria-selected") === "true") || tabs[0];

  /* Tabs on wide screens, titled sections on narrow ones */
  const applyLayout = () => {
    const stacked = isStacked();
    tabs.forEach((tab) => {
      const panel = panelOf(tab);
      if (stacked) {
        panel.hidden = false;
        panel.setAttribute("role", "region");
        panel.setAttribute("aria-labelledby", `title-${tab.dataset.cat}`);
      } else {
        panel.setAttribute("role", "tabpanel");
        panel.setAttribute("aria-labelledby", tab.id);
      }
    });
    if (!stacked) select(current(), { updateHash: false });
  };

  const goToHash = () => {
    const tab = fromHash();
    if (!tab) return;
    if (isStacked()) panelOf(tab).scrollIntoView({ block: "start" });
    else select(tab, { updateHash: false });
  };

  window.addEventListener("hashchange", goToHash);
  stackedMq.addEventListener("change", applyLayout);

  select(fromHash() || tabs[0], { updateHash: false });
  applyLayout();
  if (isStacked() && fromHash()) goToHash();
})();
