(() => {
  "use strict";

  const body = document.body;
  const locale = body.dataset.locale || "es";
  const grid = document.querySelector("[data-services-grid]");
  const cards = [...document.querySelectorAll("[data-service-card]")];
  const search = document.querySelector("[data-search]");
  const filters = [...document.querySelectorAll("[data-filter]")];
  const resultsCount = document.querySelector("[data-results-count]");
  const noResults = document.querySelector("[data-no-results]");
  const dialog = document.querySelector("[data-service-dialog]");
  const closeDialog = document.querySelector("[data-dialog-close]");
  const currentYear = document.querySelector("[data-current-year]");
  let activeCategory = "all";
  let catalog = null;
  let lastTrigger = null;

  if (currentYear) currentYear.textContent = String(new Date().getFullYear());
  if (!grid || !search || !dialog) return;

  loadCatalog();

  search.addEventListener("input", applyFilters);
  filters.forEach((filter) => {
    filter.addEventListener("click", () => {
      activeCategory = filter.dataset.filter || "all";
      filters.forEach((item) => {
        const selected = item === filter;
        item.classList.toggle("is-active", selected);
        item.setAttribute("aria-pressed", String(selected));
      });
      applyFilters();
    });
  });

  grid.addEventListener("click", (event) => {
    const trigger = event.target.closest("[data-open-service]");
    if (!trigger || !catalog) return;
    const service = catalog.services.find((item) => item.id === trigger.dataset.openService);
    if (!service) return;
    lastTrigger = trigger;
    populateDialog(service);
    if (typeof dialog.showModal === "function") dialog.showModal();
  });

  closeDialog?.addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", (event) => {
    const bounds = dialog.getBoundingClientRect();
    const outside = event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom;
    if (outside) dialog.close();
  });
  dialog.addEventListener("close", () => lastTrigger?.focus());

  async function loadCatalog() {
    try {
      const response = await fetch("data/services.json", { credentials: "same-origin", headers: { Accept: "application/json" } });
      if (!response.ok) throw new Error(`Catalog returned ${response.status}`);
      const payload = await response.json();
      if (!Array.isArray(payload.services) || payload.locale !== locale) throw new Error("Catalog does not match this page.");
      catalog = payload;
      grid.dataset.enhanced = "true";
    } catch (error) {
      console.warn("Best Carriers interactive catalog could not load; static service information remains available.", error);
      document.documentElement.classList.remove("js");
      document.documentElement.classList.add("no-js");
    }
  }

  function applyFilters() {
    const query = normalize(search.value);
    let visible = 0;
    cards.forEach((card) => {
      const categoryMatch = activeCategory === "all" || card.dataset.category === activeCategory;
      const searchMatch = !query || normalize(card.textContent).includes(query);
      const shouldShow = categoryMatch && searchMatch;
      card.hidden = !shouldShow;
      if (shouldShow) visible += 1;
    });
    updateCount(visible);
    noResults.hidden = visible !== 0;
  }

  function updateCount(count) {
    const singular = catalog?.labels?.resultSingular || (locale === "es" ? "servicio disponible" : "service available");
    const plural = catalog?.labels?.resultPlural || (locale === "es" ? "servicios disponibles" : "services available");
    resultsCount.textContent = `${count} ${count === 1 ? singular : plural}`;
  }

  function populateDialog(service) {
    const labels = catalog.labels;
    setText("[data-dialog-title]", service.name);
    setText("[data-dialog-summary]", service.summary);
    setText("[data-dialog-price]", service.price);
    setText("[data-dialog-price-note]", service.priceNote);

    const iconHost = dialog.querySelector("[data-dialog-icon]");
    iconHost.replaceChildren(createIcon(service.icon));

    const bodyHost = dialog.querySelector("[data-dialog-body]");
    bodyHost.replaceChildren();
    bodyHost.append(createSection(labels.detailsEyebrow, service.details));

    if (service.includes?.length) {
      bodyHost.append(createListSection(labels.includesLabel, service.includes));
    }
    if (service.variants?.length) {
      bodyHost.append(createVariantsSection(labels.variantsLabel, service.variants));
    }
    bodyHost.append(createSection(labels.requirementsLabel, catalog.requirements));
  }

  function createSection(title, text) {
    const section = element("section", "dialog-section");
    const heading = element("h3", "", title);
    const paragraph = element("p", "", text);
    section.append(heading, paragraph);
    return section;
  }

  function createListSection(title, items) {
    const section = element("section", "dialog-section");
    const heading = element("h3", "", title);
    const list = element("ul");
    items.forEach((item) => list.append(element("li", "", item)));
    section.append(heading, list);
    return section;
  }

  function createVariantsSection(title, variants) {
    const section = element("section", "dialog-section");
    const heading = element("h3", "", title);
    const list = element("ul", "variant-list");
    variants.forEach((variant) => {
      const item = element("li");
      item.append(element("strong", "", variant.name), element("b", "", variant.price));
      item.append(element("small", "", `${variant.form} · ${variant.deadline} · ${variant.extra}`));
      list.append(item);
    });
    section.append(heading, list);
    return section;
  }

  function createIcon(name) {
    const paths = {
      building: "M4 21V5l8-3 8 3v16M9 9h1m4 0h1m-6 4h1m4 0h1m-6 4h1m4 0h1M2 21h20",
      chart: "M4 19V9m6 10V5m6 14v-7m4 7H2",
      chat: "M21 15a4 4 0 0 1-4 4H8l-5 3 1.7-5.1A7.5 7.5 0 0 1 3 12a8 8 0 0 1 8-8h2a8 8 0 0 1 8 8v3Z",
      close: "m6 6 12 12M18 6 6 18",
      document: "M6 2h8l4 4v16H6zM14 2v5h5M9 12h6m-6 4h6",
      fuel: "M5 22V3h10v19M3 22h14M8 7h4m5 3h2l2 2v6a2 2 0 0 1-4 0v-8Z",
      map: "m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3V6Zm6-3v15m6-12v15",
      receipt: "M6 3h12v19l-3-2-3 2-3-2-3 2V3Zm3 5h6m-6 4h6m-6 4h4",
      route: "M8 19h3a3 3 0 0 0 0-6H9a3 3 0 0 1 0-6h7",
      shield: "M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z",
      sync: "M20 7h-5V2M4 17h5v5M6.1 8A7 7 0 0 1 18 5l2 2M17.9 16A7 7 0 0 1 6 19l-2-2"
    };
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("class", `icon icon-${name}`);
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("aria-hidden", "true");
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", paths[name] || "M12 3v18M3 12h18");
    svg.append(path);
    return svg;
  }

  function setText(selector, value) {
    const target = dialog.querySelector(selector);
    if (target) target.textContent = value || "";
  }

  function element(tag, className = "", text = "") {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text) node.textContent = text;
    return node;
  }

  function normalize(value) {
    return String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase(locale);
  }
})();
