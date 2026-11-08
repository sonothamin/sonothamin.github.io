(() => {
  const tabs = [...document.querySelectorAll('[role="tab"]')];
  if (!tabs.length) return;

  const panelOf = (tab) => document.getElementById(tab.getAttribute("aria-controls"));

  /* ---------- Items: one open at a time ---------- */
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
      panelOf(t).hidden = !on;
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

  window.addEventListener("hashchange", () => {
    const tab = fromHash();
    if (tab) select(tab, { updateHash: false });
  });

  select(fromHash() || tabs[0], { updateHash: false });
})();