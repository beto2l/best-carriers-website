import { createHash } from "node:crypto";
import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const site = JSON.parse(await readFile(path.join(root, "content/site.json"), "utf8"));
const services = JSON.parse(await readFile(path.join(root, "content/services.json"), "utf8"));
const packageJson = JSON.parse(await readFile(path.join(root, "package.json"), "utf8"));
const version = packageJson.version;
const locales = ["es", "en"];

const pageDefinitions = {
  es: { id: "trucking-services-es", title: "Servicios de Trucking", route: "servicios" },
  en: { id: "trucking-services-en", title: "Trucking Services", route: "services" }
};

validateSource();

const pagesRoot = path.join(root, "pages");
await rm(pagesRoot, { recursive: true, force: true });

const files = [];
for (const locale of locales) {
  const definition = pageDefinitions[locale];
  const destination = path.join(pagesRoot, definition.route);
  await mkdir(path.join(destination, "assets"), { recursive: true });
  await mkdir(path.join(destination, "data"), { recursive: true });

  const htmlPath = path.join(destination, "index.html");
  const cssPath = path.join(destination, "assets/services.css");
  const jsPath = path.join(destination, "assets/services.js");
  const dataPath = path.join(destination, "data/services.json");

  await writeFile(htmlPath, renderPage(locale), "utf8");
  await cp(path.join(root, "src/services.css"), cssPath);
  await cp(path.join(root, "src/services.js"), jsPath);
  await writeFile(dataPath, `${JSON.stringify(localizedPayload(locale), null, 2)}\n`, "utf8");

  files.push(htmlPath, cssPath, jsPath, dataPath);
}

const checksums = {};
for (const file of files.sort()) {
  const relative = path.relative(root, file).split(path.sep).join("/");
  const contents = await readFile(file);
  checksums[relative] = createHash("sha256").update(contents).digest("hex");
}

const release = {
  contract_version: 4,
  runtime: "static",
  scope: "pages",
  site: "best-carriers-website",
  version,
  languages: locales,
  pages: locales.map((locale) => ({
    ...pageDefinitions[locale],
    entry: `pages/${pageDefinitions[locale].route}/index.html`,
    language: locale
  })),
  files_sha256: checksums
};

await writeFile(path.join(root, "lw-release.json"), `${JSON.stringify(release, null, 2)}\n`, "utf8");
console.log(`Built Best Carriers release ${version}: ${files.length} files, ${services.length} services, ${locales.length} languages.`);

function validateSource() {
  if (!/^\d+\.\d+\.\d+$/.test(version)) throw new Error("package.json version must be SemVer.");
  if (!Array.isArray(services) || services.length === 0) throw new Error("At least one service is required.");
  if (!/^\d{11,15}$/.test(site.whatsapp.number)) throw new Error("WhatsApp must use an international digits-only number.");
  if (!/^https:\/\//.test(site.heroImage.url)) throw new Error("The hero image must use HTTPS.");
  const ids = new Set();
  for (const service of services) {
    if (!service.id || ids.has(service.id)) throw new Error(`Missing or duplicate service ID: ${service.id || "(empty)"}`);
    ids.add(service.id);
    if (!["taxes", "compliance", "business"].includes(service.category)) throw new Error(`Invalid category for ${service.id}`);
    for (const locale of locales) {
      for (const field of ["name", "price", "priceNote", "summary", "details"]) {
        if (!service[locale]?.[field]) throw new Error(`${service.id}.${locale}.${field} is required.`);
      }
    }
  }
}

function localizedPayload(locale) {
  return {
    locale,
    version,
    whatsappUrl: whatsappUrl(),
    requirements: site.locales[locale].requirementsPending,
    labels: {
      detailsEyebrow: site.locales[locale].detailsEyebrow,
      priceLabel: site.locales[locale].priceLabel,
      includesLabel: site.locales[locale].includesLabel,
      variantsLabel: site.locales[locale].variantsLabel,
      requirementsLabel: site.locales[locale].requirementsLabel,
      priceNotice: site.locales[locale].priceNotice,
      dialogCta: site.locales[locale].dialogCta,
      resultSingular: site.locales[locale].resultSingular,
      resultPlural: site.locales[locale].resultPlural
    },
    services: services.map((service) => ({
      id: service.id,
      category: service.category,
      icon: service.icon,
      ...service[locale]
    }))
  };
}

function renderPage(locale) {
  const t = site.locales[locale];
  const alternateLocale = locale === "es" ? "en" : "es";
  const canonical = site.routes[locale];
  const lang = locale === "es" ? "es-US" : "en-US";
  const cards = services.map((service, index) => renderCard(service, locale, index)).join("\n");
  const schema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: pageDefinitions[locale].title,
    url: canonical,
    numberOfItems: services.length,
    itemListElement: services.map((service, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "Service",
        name: service[locale].name,
        description: service[locale].summary,
        provider: { "@type": "Organization", name: site.brand, url: "https://best-carriers.com/" },
        areaServed: { "@type": "Country", name: "United States" }
      }
    }))
  };

  return `<!doctype html>
<html lang="${lang}" class="no-js">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(t.metaTitle)}</title>
  <meta name="description" content="${escapeHtml(t.metaDescription)}">
  <meta name="robots" content="index,follow,max-image-preview:large">
  <meta name="theme-color" content="#071522">
  <link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' rx='14' fill='%23071522'/%3E%3Ctext x='32' y='40' text-anchor='middle' font-family='Arial' font-size='24' font-weight='700' fill='white'%3EBC%3C/text%3E%3C/svg%3E">
  <link rel="canonical" href="${escapeHtml(canonical)}">
  <link rel="alternate" hreflang="es" href="${escapeHtml(site.routes.es)}">
  <link rel="alternate" hreflang="en" href="${escapeHtml(site.routes.en)}">
  <link rel="alternate" hreflang="x-default" href="${escapeHtml(site.routes.es)}">
  <meta property="og:type" content="website">
  <meta property="og:title" content="${escapeHtml(t.metaTitle)}">
  <meta property="og:description" content="${escapeHtml(t.metaDescription)}">
  <meta property="og:url" content="${escapeHtml(canonical)}">
  <meta property="og:image" content="${escapeHtml(site.heroImage.url)}">
  <link rel="preconnect" href="https://bc.opin-x.com" crossorigin>
  <link rel="preload" as="image" href="${escapeHtml(site.heroImage.url)}" type="image/webp" fetchpriority="high">
  <link rel="stylesheet" href="assets/services.css">
  <script>document.documentElement.classList.replace("no-js","js");</script>
  <script defer src="assets/services.js"></script>
  <script type="application/ld+json">${safeJson(schema)}</script>
</head>
<body data-locale="${locale}" data-release="${escapeHtml(version)}">
  <a class="skip-link" href="#services-grid">${escapeHtml(t.skipLink)}</a>
  <header class="site-header" data-header>
    <div class="shell header-inner">
      <a class="brand" href="https://best-carriers.com/" aria-label="Best Carriers">
        <span class="brand-mark" aria-hidden="true">BC</span>
        <span class="brand-copy"><strong>${escapeHtml(site.brand)}</strong><small>${escapeHtml(t.brandTagline)}</small></span>
      </a>
      <nav class="header-actions" aria-label="${locale === "es" ? "Acciones principales" : "Primary actions"}">
        <a class="language-link" href="${escapeHtml(site.routes[alternateLocale])}" hreflang="${alternateLocale}" aria-label="${escapeHtml(t.languageAria)}">${escapeHtml(t.languageLink)}</a>
        <a class="button button-small button-primary" href="${escapeHtml(whatsappUrl())}" target="_blank" rel="noopener noreferrer">${icon("whatsapp")}<span>${escapeHtml(t.navCta)}</span></a>
      </nav>
    </div>
  </header>

  <main>
    <section class="hero" aria-labelledby="hero-title">
      <img class="hero-media" src="${escapeHtml(site.heroImage.url)}" width="${site.heroImage.width}" height="${site.heroImage.height}" alt="${escapeHtml(site.heroImage.alt[locale])}" fetchpriority="high" decoding="async">
      <div class="hero-shade" aria-hidden="true"></div>
      <div class="shell hero-inner">
        <div class="hero-copy">
          <p class="eyebrow"><span></span>${escapeHtml(t.heroEyebrow)}</p>
          <h1 id="hero-title">${escapeHtml(t.heroTitle)} <em>${escapeHtml(t.heroTitleAccent)}</em></h1>
          <p class="hero-description">${escapeHtml(t.heroDescription)}</p>
          <div class="hero-actions">
            <a class="button button-primary" href="#services-grid">${escapeHtml(t.heroPrimaryCta)}${icon("arrow")}</a>
            <a class="button button-ghost" href="${escapeHtml(whatsappUrl())}" target="_blank" rel="noopener noreferrer">${icon("whatsapp")}${escapeHtml(t.heroSecondaryCta)}</a>
          </div>
        </div>
        <div class="trust-strip" aria-label="${locale === "es" ? "Ventajas" : "Benefits"}">
          ${t.trustItems.map((item, index) => `<span>${icon(["shield", "globe", "chat"][index])}${escapeHtml(item)}</span>`).join("\n          ")}
        </div>
      </div>
    </section>

    <section class="services-section" aria-labelledby="services-heading">
      <div class="shell">
        <div class="section-heading">
          <div>
            <p class="eyebrow eyebrow-dark"><span></span>${escapeHtml(t.sectionEyebrow)}</p>
            <h2 id="services-heading">${escapeHtml(t.sectionTitle)}</h2>
          </div>
          <p>${escapeHtml(t.sectionDescription)}</p>
        </div>

        <div class="service-controls" data-controls>
          <div class="search-field">
            <label for="service-search">${escapeHtml(t.searchLabel)}</label>
            <span aria-hidden="true">${icon("search")}</span>
            <input id="service-search" type="search" autocomplete="off" placeholder="${escapeHtml(t.searchPlaceholder)}" data-search>
          </div>
          <fieldset class="filters" data-filters>
            <legend>${escapeHtml(t.filtersLabel)}</legend>
            ${Object.entries(t.filters).map(([value, label], index) => `<button class="filter${index === 0 ? " is-active" : ""}" type="button" data-filter="${value}" aria-pressed="${index === 0 ? "true" : "false"}">${escapeHtml(label)}</button>`).join("\n            ")}
          </fieldset>
        </div>

        <p class="results-count" aria-live="polite" data-results-count>${services.length} ${escapeHtml(t.resultPlural)}</p>
        <div class="services-grid" id="services-grid" data-services-grid>
          ${cards}
        </div>
        <div class="no-results" data-no-results hidden>
          ${icon("search")}
          <h3>${escapeHtml(t.noResultsTitle)}</h3>
          <p>${escapeHtml(t.noResultsText)}</p>
        </div>
      </div>
    </section>

    <section class="contact-band" aria-labelledby="contact-title">
      <div class="shell contact-inner">
        <div>
          <p class="eyebrow"><span></span>${escapeHtml(t.ctaEyebrow)}</p>
          <h2 id="contact-title">${escapeHtml(t.ctaTitle)}</h2>
          <p>${escapeHtml(t.ctaText)}</p>
        </div>
        <a class="button button-light" href="${escapeHtml(whatsappUrl())}" target="_blank" rel="noopener noreferrer">${icon("whatsapp")}${escapeHtml(t.ctaButton)}${icon("arrow")}</a>
      </div>
    </section>
  </main>

  <footer class="site-footer">
    <div class="shell footer-inner">
      <div class="brand footer-brand"><span class="brand-mark" aria-hidden="true">BC</span><span class="brand-copy"><strong>${escapeHtml(site.brand)}</strong><small>${escapeHtml(t.footerText)}</small></span></div>
      <div class="footer-meta">
        <p>${escapeHtml(t.disclaimer)}</p>
        <small>© <span data-current-year>${new Date().getUTCFullYear()}</span> ${escapeHtml(t.copyright)}</small>
      </div>
    </div>
  </footer>

  <dialog class="service-dialog" data-service-dialog aria-labelledby="dialog-title">
    <div class="dialog-frame">
      <button class="dialog-close" type="button" data-dialog-close aria-label="${escapeHtml(t.closeDialog)}">${icon("close")}</button>
      <div class="dialog-icon" data-dialog-icon aria-hidden="true"></div>
      <p class="eyebrow eyebrow-dark"><span></span><span data-dialog-eyebrow>${escapeHtml(t.detailsEyebrow)}</span></p>
      <h2 id="dialog-title" data-dialog-title></h2>
      <p class="dialog-summary" data-dialog-summary></p>
      <div class="dialog-price"><span>${escapeHtml(t.priceLabel)}</span><strong data-dialog-price></strong><small data-dialog-price-note></small></div>
      <div class="dialog-body" data-dialog-body></div>
      <p class="price-notice">${escapeHtml(t.priceNotice)}</p>
      <a class="button button-primary dialog-cta" href="${escapeHtml(whatsappUrl())}" target="_blank" rel="noopener noreferrer">${icon("whatsapp")}<span>${escapeHtml(t.dialogCta)}</span>${icon("arrow")}</a>
    </div>
  </dialog>
</body>
</html>\n`;
}

function renderCard(service, locale, index) {
  const item = service[locale];
  const t = site.locales[locale];
  return `<article class="service-card" data-service-card data-service-id="${escapeHtml(service.id)}" data-category="${escapeHtml(service.category)}" style="--order:${index}">
            <div class="card-top">
              <span class="service-icon" aria-hidden="true">${icon(service.icon)}</span>
              <span class="service-number">${String(index + 1).padStart(2, "0")}</span>
            </div>
            <div class="card-copy">
              <h3>${escapeHtml(item.name)}</h3>
              <p>${escapeHtml(item.summary)}</p>
            </div>
            <div class="card-price"><strong>${escapeHtml(item.price)}</strong><span>${escapeHtml(item.priceNote)}</span></div>
            <button class="card-action" type="button" data-open-service="${escapeHtml(service.id)}" aria-haspopup="dialog"><span>${escapeHtml(t.cardAction)}</span>${icon("arrow")}</button>
            <details class="service-fallback">
              <summary>${escapeHtml(t.cardAction)}</summary>
              <p>${escapeHtml(item.details)}</p>
              <p><strong>${escapeHtml(t.requirementsLabel)}:</strong> ${escapeHtml(t.requirementsPending)}</p>
              <a href="${escapeHtml(whatsappUrl())}" target="_blank" rel="noopener noreferrer">${escapeHtml(t.dialogCta)}</a>
            </details>
          </article>`;
}

function whatsappUrl() {
  return `https://wa.me/${site.whatsapp.number}?text=${encodeURIComponent(site.whatsapp.message)}`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function safeJson(value) {
  return JSON.stringify(value).replaceAll("<", "\\u003c");
}

function icon(name) {
  const paths = {
    arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    building: '<path d="M4 21V5l8-3 8 3v16M9 9h1m4 0h1m-6 4h1m4 0h1m-6 4h1m4 0h1M2 21h20"/>',
    chart: '<path d="M4 19V9m6 10V5m6 14v-7m4 7H2"/>',
    chat: '<path d="M21 15a4 4 0 0 1-4 4H8l-5 3 1.7-5.1A7.5 7.5 0 0 1 3 12a8 8 0 0 1 8-8h2a8 8 0 0 1 8 8v3Z"/>',
    close: '<path d="m6 6 12 12M18 6 6 18"/>',
    document: '<path d="M6 2h8l4 4v16H6zM14 2v5h5M9 12h6m-6 4h6"/>',
    fuel: '<path d="M5 22V3h10v19M3 22h14M8 7h4m5 3h2l2 2v6a2 2 0 0 1-4 0v-8Z"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18"/>',
    map: '<path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3V6Zm6-3v15m6-12v15"/>',
    receipt: '<path d="M6 3h12v19l-3-2-3 2-3-2-3 2V3Zm3 5h6m-6 4h6m-6 4h4"/>',
    route: '<circle cx="6" cy="19" r="2"/><circle cx="18" cy="5" r="2"/><path d="M8 19h3a3 3 0 0 0 0-6H9a3 3 0 0 1 0-6h7"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
    shield: '<path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z"/><path d="m9 12 2 2 4-4"/>',
    sync: '<path d="M20 7h-5V2M4 17h5v5M6.1 8A7 7 0 0 1 18 5l2 2M17.9 16A7 7 0 0 1 6 19l-2-2"/>',
    whatsapp: '<path d="M20.5 11.7a8.5 8.5 0 0 1-12.6 7.5L3 20.5l1.3-4.7A8.5 8.5 0 1 1 20.5 11.7Z"/><path d="M8.2 7.7c.3-.6.5-.6.8-.6h.5c.2 0 .4.1.5.4l.8 1.9c.1.3.1.5-.1.7l-.6.8c-.2.2-.2.4 0 .7.7 1.2 1.6 2.1 2.8 2.8.3.2.5.2.7 0l.9-1c.2-.3.5-.3.8-.2l1.9.9c.3.1.4.3.4.6 0 .4-.2 1.4-.9 2-.6.6-1.5.9-2.4.7-1.3-.2-3.1-.9-5-2.6-1.4-1.3-2.4-2.9-2.8-4.2-.4-1.1 0-2.2.3-2.9Z"/>',
    default: '<path d="M12 3v18M3 12h18"/>'
  };
  return `<svg class="icon icon-${escapeHtml(name)}" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${paths[name] || paths.default}</svg>`;
}
