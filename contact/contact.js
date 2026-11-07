(() => {
  const copyText = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "");
      ta.style.cssText = "position:fixed;opacity:0";
      document.body.append(ta);
      ta.select();
      let ok = false;
      try { ok = document.execCommand("copy"); } catch { /* ignore */ }
      ta.remove();
      return ok;
    }
  };

  document.querySelectorAll("[data-copy]").forEach((btn) => {
    const label = btn.querySelector("[data-copy-label]");
    const original = btn.getAttribute("aria-label");
    btn.addEventListener("click", async () => {
      const ok = await copyText(btn.dataset.copy);
      label.textContent = ok ? "Copied" : "Press Ctrl+C";
      btn.classList.toggle("is-done", ok);
      btn.setAttribute("aria-label", ok ? "Copied" : original);
      window.setTimeout(() => {
        label.textContent = "Copy";
        btn.classList.remove("is-done");
        btn.setAttribute("aria-label", original);
      }, 1800);
    });
  });
})();
