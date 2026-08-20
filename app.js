(function () {
  "use strict";

  function initNavigation() {
    var controls = document.querySelectorAll(".control");
    if (!controls.length) return;

    controls.forEach(function (button) {
      button.addEventListener("click", function () {
        var targetId = button.dataset.id;
        var target = targetId ? document.getElementById(targetId) : null;
        if (!target) return;

        var activeBtn = document.querySelector(".controls .active-btn");
        var activeSection = document.querySelector("main .active, header.active");

        if (activeBtn) activeBtn.classList.remove("active-btn");
        button.classList.add("active-btn");

        if (activeSection) activeSection.classList.remove("active");
        target.classList.add("active");
      });
    });
  }

  function initThemeToggle() {
    var themeBtn = document.querySelector(".theme-btn");
    if (!themeBtn) return;

    themeBtn.addEventListener("click", function () {
      document.body.classList.toggle("light-mode");
    });
  }

  function init() {
    initNavigation();
    initThemeToggle();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
