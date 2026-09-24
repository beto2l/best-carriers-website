(() => {
  "use strict";
  const page = document.querySelector(".page");
  const panel = document.querySelector("#payment-panel");
  const title = document.querySelector("#payment-title");
  const status = document.querySelector("[data-form-status]");
  const recovery = document.querySelector("[data-form-recovery]");
  const cards = [...document.querySelectorAll("[data-product]")];
  const sections = [...document.querySelectorAll("[data-checkout]")];
  let selected = null;
  let request = 0;
  document.querySelector("[data-current-year]").textContent = new Date().getFullYear();
  const dates = new Intl.DateTimeFormat("es-US", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
  const formatDate = value => /^\d{4}-\d{2}-\d{2}$/.test(value || "") ? dates.format(new Date(`${value}T12:00:00Z`)) : "";
  for (const card of cards) {
    const section = sections.find(item => item.dataset.checkout === card.dataset.product);
    const node = section?.querySelector("[data-opinx-checkout-config]");
    if (!node) continue;
    try {
      const config = JSON.parse(node.textContent);
      if (config.product !== card.dataset.product) continue;
      card.querySelector(".product-price").textContent = config.price_label || "Ver precio";
      const schedule = config.schedule || {};
      if (["tdc", "ifta", "safety"].includes(config.product)) {
        const start = formatDate(schedule.course_start_date);
        const end = schedule.course_end_date !== schedule.course_start_date ? formatDate(schedule.course_end_date) : "";
        card.querySelector(".product-date").textContent = start ? `${start}${end ? ` – ${end}` : ""}` : schedule.date_label || "Consulta la próxima fecha";
        const time = schedule.course_start_time?.match(/^(\d{2}):(\d{2})/);
        const zone = schedule.timezone === "America/Chicago" ? "Chicago" : schedule.timezone;
        card.querySelector(".product-time").textContent = time ? `${Number(time[1]) % 12 || 12}:${time[2]} ${Number(time[1]) >= 12 ? "p. m." : "a. m."}${zone ? ` · ${zone}` : ""}` : schedule.schedule_label || "";
      }
      card.addEventListener("click", event => {
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || !window.OPINXLWCheckout) return;
        event.preventDefault();
        select(card, section);
      });
    } catch (_) { /* Keep the existing registration link when the model is unavailable. */ }
  }
  async function select(card, section) {
    selected = { card, section };
    const current = ++request;
    for (const item of cards) {
      if (item === card) item.setAttribute("aria-current", "true");
      else item.removeAttribute("aria-current");
    }
    for (const item of sections) item.hidden = item !== section;
    title.textContent = card.querySelector(".product-copy>strong").textContent;
    document.querySelector("[data-selected-price]").textContent = card.querySelector(".product-price").textContent;
    document.querySelector("[data-selected-date]").textContent = [card.querySelector(".product-date").textContent, card.querySelector(".product-time").textContent].filter(Boolean).join(" · ");
    document.querySelector("[data-fallback]").href = card.href;
    page.classList.add("has-selection");
    panel.hidden = false;
    recovery.hidden = true;
    status.textContent = "Preparando tu formulario…";
    title.focus({ preventScroll: true });
    if (window.matchMedia("(max-width:849px)").matches) panel.scrollIntoView({ block: "start" });
    try {
      await window.OPINXLWCheckout.activate(section);
      if (current === request) status.textContent = "";
    } catch (_) {
      if (current === request) {
        status.textContent = "";
        recovery.hidden = false;
      }
    }
  }
  document.querySelector("[data-retry]").addEventListener("click", () => { if (selected) select(selected.card, selected.section); });
  document.querySelector("[data-back]").addEventListener("click", () => {
    ++request;
    panel.hidden = true;
    page.classList.remove("has-selection");
    for (const card of cards) card.removeAttribute("aria-current");
    selected?.card.focus();
  });
})();
