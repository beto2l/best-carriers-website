import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const locales = ["es", "en"];

export async function buildMotus({ root, site, version }) {
  const content = JSON.parse(await readFile(path.join(root, "content/motus.json"), "utf8"));
  const css = (await readFile(path.join(root, "src/motus.css"), "utf8")).replaceAll("</style", "<\\/style");
  const js = (await readFile(path.join(root, "src/motus.js"), "utf8")).replaceAll("</script", "<\\/script");
  const courseImageSource = path.join(root, "design/motus-recorded-course.webp");

  validate(content);

  const definitions = {
    es: {
      id: "motus-course-es",
      title: "Curso grabado de FMCSA MOTUS",
      route: "cursos/motus",
      entry: "pages/cursos/motus/index.html",
      language: "es",
      translation_key: "motus-course",
      components: ["best-carriers-social-proof-es", "motus-checkout-es"]
    },
    en: {
      id: "motus-course-en",
      title: "Recorded FMCSA MOTUS Course",
      route: "en/courses/motus",
      entry: "pages/en/courses/motus/index.html",
      language: "en",
      translation_key: "motus-course",
      components: ["best-carriers-social-proof-en", "motus-checkout-en"]
    },
    thanksEs: {
      id: "motus-thank-you-es",
      title: "Gracias por comprar el curso MOTUS",
      route: "cursos/motus/gracias",
      entry: "pages/cursos/motus/gracias/index.html",
      language: "es",
      translation_key: "motus-thank-you",
      components: ["motus-payment-result-es"],
      seo: { robots: "noindex,follow" }
    },
    thanksEn: {
      id: "motus-thank-you-en",
      title: "Thank you for purchasing the MOTUS course",
      route: "en/courses/motus/thank-you",
      entry: "pages/en/courses/motus/thank-you/index.html",
      language: "en",
      translation_key: "motus-thank-you",
      components: ["motus-payment-result-en"],
      seo: { robots: "noindex,follow" }
    }
  };

  const files = [];
  for (const locale of locales) {
    const sale = definitions[locale];
    const thanks = definitions[locale === "es" ? "thanksEs" : "thanksEn"];
    for (const [definition, html] of [
      [sale, renderSalePage({ locale, content, site, version, css, js })],
      [thanks, renderThanksPage({ locale, content, site, version, css, js })]
    ]) {
      const destination = path.join(root, path.dirname(definition.entry));
      const file = path.join(root, definition.entry);
      await mkdir(destination, { recursive: true });
      await writeFile(file, html, "utf8");
      files.push(file);
      if (definition === sale && !/^https:\/\//i.test(content.assets.courseImage)) {
        const asset = path.join(destination, content.assets.courseImage);
        await mkdir(path.dirname(asset), { recursive: true });
        await copyFile(courseImageSource, asset);
        files.push(asset);
      }
    }
  }

  return {
    files,
    pages: [definitions.es, definitions.en, definitions.thanksEs, definitions.thanksEn],
    globalContent: {
      "best-carriers-social-proof-es": {
        version: "1",
        type: "social_proof",
        source: "reviews_hub",
        scope: "brand",
        language: "es",
        initial_limit: 6,
        load_more: true,
        design_variant: "course-proof"
      },
      "best-carriers-social-proof-en": {
        version: "1",
        type: "social_proof",
        source: "reviews_hub",
        scope: "brand",
        language: "en",
        initial_limit: 6,
        load_more: true,
        design_variant: "course-proof"
      },
      "motus-checkout-es": {
        version: "1",
        type: "checkout",
        product: "motus",
        language: "es",
        design_variant: "headless",
        required_product_type: "recorded_course",
        required_benefits: ["lifetime_access", "includes_updates", "includes_certificate"],
        require_legal: true
      },
      "motus-checkout-en": {
        version: "1",
        type: "checkout",
        product: "motus",
        language: "en",
        design_variant: "headless",
        required_product_type: "recorded_course",
        required_benefits: ["lifetime_access", "includes_updates", "includes_certificate"],
        require_legal: true
      },
      "motus-payment-result-es": { version: "1", type: "payment_result", product: "motus", language: "es" },
      "motus-payment-result-en": { version: "1", type: "payment_result", product: "motus", language: "en" }
    }
  };
}

function validate(content) {
  for (const key of ["es", "en", "thanksEs", "thanksEn"]) {
    if (!/^https:\/\/best-carriers\.com\//.test(content.routes[key])) throw new Error(`Invalid MOTUS route: ${key}`);
  }
  for (const locale of locales) {
    const t = content.locales[locale];
    if (!t?.metaTitle || !t?.heroTitle || t.curriculum?.length !== 3 || t.curriculum.some((item) => !Array.isArray(item.lessons) || !item.lessons.length) || t.faqs?.length < 6) {
      throw new Error(`MOTUS ${locale} content is incomplete.`);
    }
  }
  if (!Array.isArray(content.assets.groupPhotos) || content.assets.groupPhotos.length < 4) {
    throw new Error("MOTUS requires an initial group-photo fallback.");
  }
  if (!/^https:\/\/bc\.opin-x\.com\//i.test(content.assets.courseImage)) {
    throw new Error("MOTUS course artwork must use the Best Carriers CDN.");
  }
  if (!content.assets.instructorPhoto?.url || !/^https:\/\/bc\.opin-x\.com\//i.test(content.assets.instructorPhoto.url)) {
    throw new Error("MOTUS instructor authority image must use the Best Carriers CDN.");
  }
  if (!Array.isArray(content.assets.productVisuals) || content.assets.productVisuals.length < 5 || content.assets.productVisuals.some((asset) => !/^https:\/\/bc\.opin-x\.com\//i.test(asset.url))) {
    throw new Error("MOTUS product visuals must be served by the Best Carriers CDN.");
  }
}

function renderSalePage({ locale, content, site, version, css, js }) {
  const t = content.locales[locale];
  const alternate = locale === "es" ? "en" : "es";
  const canonical = content.routes[locale];
  const alternateUrl = content.routes[alternate];
  const lang = locale === "es" ? "es-US" : "en-US";
  const terms = locale === "es" ? "https://best-carriers.com/terminos-y-condiciones/" : "https://best-carriers.com/en/terms-and-conditions/";
  const privacy = locale === "es" ? "https://best-carriers.com/politica-de-privacidad/" : "https://best-carriers.com/en/privacy-policy/";
  const schema = buildSchema({ locale, content, site });
  const courseImageUrl = new URL(content.assets.courseImage, canonical).href;

  return `<!doctype html>
<html lang="${lang}" class="no-js">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(t.metaTitle)}</title>
  <meta name="description" content="${escapeHtml(t.metaDescription)}">
  <meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1">
  <meta name="theme-color" content="#06111f">
  <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🚛</text></svg>">
  <link rel="canonical" href="${escapeHtml(canonical)}">
  <link rel="alternate" hreflang="es" href="${escapeHtml(content.routes.es)}">
  <link rel="alternate" hreflang="en" href="${escapeHtml(content.routes.en)}">
  <link rel="alternate" hreflang="x-default" href="${escapeHtml(content.routes.es)}">
  <meta property="og:type" content="website">
  <meta property="og:title" content="${escapeHtml(t.ogTitle)}">
  <meta property="og:description" content="${escapeHtml(t.ogDescription)}">
  <meta property="og:url" content="${escapeHtml(canonical)}">
  <meta property="og:image" content="${escapeHtml(courseImageUrl)}">
  <meta property="og:locale" content="${locale === "es" ? "es_US" : "en_US"}">
  <meta name="twitter:card" content="summary_large_image">
  <link rel="preconnect" href="https://c.opin-x.com" crossorigin>
  <link rel="preload" as="image" href="${escapeHtml(content.assets.courseImage)}" fetchpriority="high">
  <style>${css}</style>
  <script>document.documentElement.classList.replace("no-js","js");</script>
  <script type="application/ld+json">${safeJson(schema)}</script>
</head>
<body data-page="motus-sale" data-locale="${locale}" data-release="${escapeHtml(version)}">
  <a class="skip-link" href="#course-content">${escapeHtml(t.skipLink)}</a>
  <main id="course-content">
    <section class="motus-hero" aria-labelledby="hero-title">
      <div class="motus-grid" aria-hidden="true"></div>
      <div class="motus-orb motus-orb-one" aria-hidden="true"></div>
      <div class="motus-orb motus-orb-two" aria-hidden="true"></div>
      <div class="motus-shell hero-layout">
        <div class="hero-copy">
          <p class="eyebrow eyebrow-light">${icon("signal")}<span>${escapeHtml(t.eyebrow)}</span></p>
          <h1 id="hero-title">${escapeHtml(t.heroTitle)} <em>${escapeHtml(t.heroAccent)}</em></h1>
          <p class="hero-description">${escapeHtml(t.heroDescription)}</p>
          <aside class="hero-opportunity" aria-label="${escapeHtml(t.heroOpportunityLabel)}">
            <p class="hero-opportunity-label">${escapeHtml(t.heroOpportunityLabel)}</p>
            <p>${escapeHtml(t.heroOpportunity)}</p>
            <div class="hero-price-proof" aria-live="polite">
              <span class="hero-price-was"><small>${escapeHtml(t.heroPreviousPriceLabel)}</small><s>${escapeHtml(t.heroPreviousPrice)}</s></span>
              <span class="hero-price-current"><small>${escapeHtml(t.heroCurrentPriceLabel)}</small><strong data-motus-current-price>${escapeHtml(t.heroCurrentPriceLoading)}</strong></span>
            </div>
          </aside>
          <div class="hero-actions">
            <a class="button button-primary" href="#checkout">${escapeHtml(t.heroPrimary)}${icon("arrow")}</a>
            <a class="button button-quiet" href="#curriculum">${escapeHtml(t.heroSecondary)}</a>
          </div>
          <p class="hero-note">${icon("infinity")}<span>${escapeHtml(t.heroNote)}</span></p>
        </div>
        <div class="hero-product" aria-label="${escapeHtml(t.courseCardTitle)}">
          <div class="product-glow" aria-hidden="true"></div>
          <div class="product-window">
            <div class="product-window-bar"><span></span><span></span><span></span><small>MOTUS / BEST CARRIERS</small></div>
            <img src="${escapeHtml(content.assets.courseImage)}" alt="${escapeHtml(t.courseCardTitle)}" width="1448" height="1086" fetchpriority="high" decoding="async">
            <div class="product-window-copy">
              <div><p>${escapeHtml(t.courseCardEyebrow)}</p><strong>${escapeHtml(t.courseCardTitle)}</strong></div>
              <span>${escapeHtml(t.courseCardPill)}</span>
            </div>
          </div>
          <div class="product-caption">${escapeHtml(t.courseCardBody)}</div>
        </div>
      </div>
    </section>

    ${renderCheckout({ locale, content, site, t, terms, privacy })}

    <section class="trust-rail" aria-label="${escapeHtml(locale === "es" ? "Beneficios del curso" : "Course benefits")}">
      <div class="motus-shell trust-grid">
        ${t.trustItems.map((item, index) => `<article>${icon(["infinity", "refresh", "certificate", "community"][index])}<div><h2>${escapeHtml(item.title)}</h2><p>${escapeHtml(item.text)}</p></div></article>`).join("\n        ")}
      </div>
    </section>

    <section class="section section-problem">
      <div class="motus-shell split-layout">
        <div class="section-copy">
          <p class="eyebrow">${icon("route")}<span>${escapeHtml(t.problemEyebrow)}</span></p>
          <h2>${escapeHtml(t.problemTitle)}</h2>
          <p>${escapeHtml(t.problemBody)}</p>
        </div>
        <div class="outcomes-card">
          <div class="card-kicker">MOTUS / USDOT</div>
          <h3>${escapeHtml(t.outcomesTitle)}</h3>
          <ul>${t.outcomes.map((item) => `<li>${icon("check")}<span>${escapeHtml(item)}</span></li>`).join("")}</ul>
        </div>
      </div>
    </section>

    ${renderInlineCta({ t, id: "course-cta-after-problem" })}

    <section class="section section-curriculum" id="curriculum" aria-labelledby="curriculum-title">
      <div class="motus-shell">
        <div class="section-heading centered">
          <p class="eyebrow">${icon("layers")}<span>${escapeHtml(t.curriculumEyebrow)}</span></p>
          <h2 id="curriculum-title">${escapeHtml(t.curriculumTitle)}</h2>
          <p>${escapeHtml(t.curriculumBody)}</p>
        </div>
        <div class="curriculum-grid">
          ${t.curriculum.map((item) => `<article class="curriculum-card"><header><span class="curriculum-number">${escapeHtml(item.number)}</span><div><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.text)}</p></div></header><ol>${item.lessons.map((lesson) => `<li>${escapeHtml(lesson)}</li>`).join("")}</ol></article>`).join("\n          ")}
        </div>
      </div>
    </section>

    ${renderInlineCta({ t, id: "course-cta-after-curriculum" })}

    <section class="section section-includes">
      <div class="motus-shell">
        <div class="includes-layout">
          <div class="section-copy">
            <p class="eyebrow">${icon("box")}<span>${escapeHtml(t.includesEyebrow)}</span></p>
            <h2>${escapeHtml(t.includesTitle)}</h2>
            <p>${escapeHtml(t.includesBody)}</p>
          </div>
          <div class="includes-grid">
            ${t.includes.map((item, index) => `<article>${icon(["play", "download", "refresh", "certificate"][index])}<h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.text)}</p></article>`).join("\n            ")}
          </div>
        </div>
      </div>
    </section>

    ${renderProductVisuals({ locale, content })}

    <section class="section section-audience">
      <div class="motus-shell">
        <div class="audience-card">
          <p class="eyebrow">${icon("users")}<span>${escapeHtml(t.audienceEyebrow)}</span></p>
          <h2>${escapeHtml(t.audienceTitle)}</h2>
          <ul>${t.audience.map((item) => `<li>${icon("check")}<span>${escapeHtml(item)}</span></li>`).join("")}</ul>
          <p class="independence-note">${escapeHtml(t.audienceNote)}</p>
        </div>
      </div>
    </section>

    <section class="section section-instructor">
      <div class="motus-shell instructor-layout">
        ${renderVideo({ id: content.assets.instructorVideo, eyebrow: t.instructorEyebrow, title: t.instructorTitle, body: t.instructorBody, button: t.playInstructor })}
        <figure class="instructor-authority"><img src="${escapeHtml(content.assets.instructorPhoto.url)}" alt="${escapeHtml(content.assets.instructorPhoto.alt[locale])}" width="${escapeHtml(content.assets.instructorPhoto.width)}" height="${escapeHtml(content.assets.instructorPhoto.height)}" loading="lazy" decoding="async"><figcaption>${escapeHtml(locale === "es" ? "Experiencia compartida con participantes reales de MOTUS." : "Experience shared with real MOTUS participants.")}</figcaption></figure>
      </div>
    </section>

    ${renderSocialProof({ locale, content, t })}

    <section class="section section-faq" id="faq" aria-labelledby="faq-title">
      <div class="motus-shell faq-layout">
        <div class="section-copy faq-heading">
          <p class="eyebrow">${icon("help")}<span>${escapeHtml(t.faqEyebrow)}</span></p>
          <h2 id="faq-title">${escapeHtml(t.faqTitle)}</h2>
        </div>
        <div class="faq-list">
          ${t.faqs.map((item, index) => `<details${index === 0 ? " open" : ""}><summary>${escapeHtml(item.q)}${icon("plus")}</summary><p>${escapeHtml(item.a)}</p></details>`).join("\n          ")}
        </div>
      </div>
    </section>

    <section class="final-cta">
      <div class="motus-shell final-cta-inner"><div><p>${escapeHtml(t.finalCtaEyebrow)}</p><h2>${escapeHtml(t.finalCtaTitle)}</h2></div><a class="button button-light" href="#checkout">${escapeHtml(t.finalCtaButton)}${icon("arrow")}</a></div>
    </section>
  </main>

  ${renderFooter({ locale, content, site, t })}
  <a class="mobile-purchase" href="#checkout" aria-hidden="true"><span>${escapeHtml(t.mobileCta)}</span>${icon("arrow")}</a>
  <script>${js}</script>
</body>
</html>\n`;
}

function renderProductVisuals({ locale, content }) {
  return `<section class="section section-product-visuals" aria-labelledby="product-visuals-title">
      <div class="motus-shell">
        <div class="section-heading centered">
          <p class="eyebrow">${icon("layers")}<span>${escapeHtml(locale === "es" ? "Así se trabaja dentro" : "How you work inside")}</span></p>
          <h2 id="product-visuals-title">${escapeHtml(locale === "es" ? "Una plataforma práctica para consultar, aprender y ejecutar" : "A practical platform to review, learn and execute")}</h2>
          <p>${escapeHtml(locale === "es" ? "Lecciones grabadas, un temario organizado, materiales descargables y certificado dentro de una misma experiencia." : "Recorded lessons, an organized curriculum, downloadable materials and a certificate in one experience.")}</p>
        </div>
        <div class="product-visual-grid">
          ${content.assets.productVisuals.map((visual) => `<figure class="product-visual product-visual--${escapeHtml(visual.id)}"><img src="${escapeHtml(visual.url)}" alt="${escapeHtml(visual.alt[locale])}" width="${escapeHtml(visual.width)}" height="${escapeHtml(visual.height)}" loading="lazy" decoding="async"><figcaption>${escapeHtml(visual.title[locale])}</figcaption></figure>`).join("\n          ")}
        </div>
      </div>
    </section>`;
}

function renderThanksPage({ locale, content, site, version, css, js }) {
  const t = content.locales[locale];
  const alternate = locale === "es" ? "en" : "es";
  const canonical = locale === "es" ? content.routes.thanksEs : content.routes.thanksEn;
  const alternateUrl = alternate === "es" ? content.routes.thanksEs : content.routes.thanksEn;
  const lang = locale === "es" ? "es-US" : "en-US";
  const componentKey = `motus-payment-result-${locale}`;
  return `<!doctype html>
<html lang="${lang}" class="no-js">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="referrer" content="no-referrer">
  <title>${escapeHtml(t.thanksMetaTitle)}</title>
  <meta name="description" content="${escapeHtml(t.thanksMetaDescription)}">
  <meta name="robots" content="noindex,follow,noarchive">
  <meta name="theme-color" content="#06111f">
  <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🚛</text></svg>">
  <link rel="canonical" href="${escapeHtml(canonical)}">
  <link rel="alternate" hreflang="es" href="${escapeHtml(content.routes.thanksEs)}">
  <link rel="alternate" hreflang="en" href="${escapeHtml(content.routes.thanksEn)}">
  <link rel="alternate" hreflang="x-default" href="${escapeHtml(content.routes.thanksEs)}">
  <style>${css}</style>
  <script>document.documentElement.classList.replace("no-js","js");</script>
</head>
<body data-page="motus-thanks" data-locale="${locale}" data-release="${escapeHtml(version)}">
  <header class="thanks-header"><div class="motus-shell"><a class="brand" href="https://best-carriers.com/"><img src="${escapeHtml(content.assets.logo)}" alt="Best Carriers"></a><a class="language-link" href="${escapeHtml(alternateUrl)}" hreflang="${alternate}">${escapeHtml(t.languageLink)}</a></div></header>
  <main class="thanks-main">
    <div class="motus-grid" aria-hidden="true"></div>
    <div class="motus-shell thanks-shell">
      <section class="thanks-intro" aria-labelledby="thanks-title">
        <span class="thanks-icon">${icon("check")}</span>
        <p class="eyebrow eyebrow-light">${escapeHtml(t.thanksEyebrow)}</p>
        <h1 id="thanks-title">${escapeHtml(t.thanksTitle)}</h1>
        <p>${escapeHtml(t.thanksBody)}</p>
      </section>
      <div class="payment-result"><opinx-component data-opinx-global-content="${componentKey}"><div data-component-fallback><div class="payment-result-status" role="status" aria-live="polite"><span class="status-pulse" aria-hidden="true"></span><p>${escapeHtml(t.thanksFallback)}</p></div></div></opinx-component></div>
      <section class="thanks-grid" aria-label="${escapeHtml(t.thanksStepsTitle)}">
        <article class="next-steps"><p class="card-kicker">01 / ${locale === "es" ? "ACCESO" : "ACCESS"}</p><h2>${escapeHtml(t.thanksStepsTitle)}</h2><ol>${t.thanksSteps.map((item) => `<li><span>${icon("check")}</span><p>${escapeHtml(item)}</p></li>`).join("")}</ol><a class="button button-primary" href="https://learning.opin-x.com/" target="_blank" rel="noopener noreferrer">${escapeHtml(t.learningCta)}${icon("external")}</a></article>
        <div class="thanks-side">
          <article><p class="card-kicker">02 / ${locale === "es" ? "SOPORTE" : "SUPPORT"}</p><h2>${escapeHtml(t.helpTitle)}</h2><p>${escapeHtml(t.helpBody)}</p><a href="mailto:contact@best-carriers.com">${escapeHtml(t.helpCta)}${icon("arrow")}</a></article>
          <article><p class="card-kicker">03 / ${locale === "es" ? "OPCIONAL" : "OPTIONAL"}</p><h2>${escapeHtml(t.consultingTitle)}</h2><p>${escapeHtml(t.consultingBody)}</p><a href="${escapeHtml(whatsappUrl(site, locale))}" target="_blank" rel="noopener noreferrer">${escapeHtml(t.consultingCta)}${icon("arrow")}</a></article>
        </div>
      </section>
    </div>
  </main>
  ${renderFooter({ locale, content, site, t })}
  <script>${js}</script>
</body>
</html>\n`;
}

function renderCheckout({ locale, content, site, t, terms, privacy }) {
  return `<section class="section section-checkout" id="checkout" aria-labelledby="checkout-title">
      <div class="motus-shell checkout-layout">
        <div class="checkout-copy">
          <p class="eyebrow eyebrow-light">${icon("lock")}<span>${escapeHtml(t.checkoutEyebrow)}</span></p>
          <h2 id="checkout-title">${escapeHtml(t.checkoutTitle)}</h2>
          <p>${escapeHtml(t.checkoutBody)}</p>
          <ul>${t.checkoutGuarantees.map((item) => `<li>${icon("check")}<span>${escapeHtml(item)}</span></li>`).join("")}</ul>
          <p class="checkout-legal"><span>${escapeHtml(t.legalPrefix)}</span> <a data-legal-terms href="${escapeHtml(terms)}" target="_blank" rel="noopener noreferrer">${escapeHtml(t.termsLabel)}</a> ${locale === "es" ? "y la" : "and the"} <a data-legal-privacy href="${escapeHtml(privacy)}" target="_blank" rel="noopener noreferrer">${escapeHtml(t.privacyLabel)}</a>.</p>
        </div>
        <div class="checkout-card" data-motus-checkout data-language="${locale}">
          <div class="checkout-card-head">
            <img src="${escapeHtml(content.assets.courseImage)}" alt="" width="1448" height="1086" loading="lazy" decoding="async">
            <div><span>${escapeHtml(t.courseCardEyebrow)}</span><strong>${escapeHtml(t.courseCardTitle)}</strong></div>
          </div>
          <opinx-component data-opinx-global-content="motus-checkout-${locale}">
            <div class="checkout-component-fallback" data-component-fallback>
              <p class="checkout-status" role="status">${escapeHtml(t.checkoutUnavailable)}</p>
              <a class="button button-whatsapp checkout-fallback" href="${escapeHtml(whatsappUrl(site, locale))}" target="_blank" rel="noopener noreferrer">${icon("whatsapp")}${escapeHtml(t.checkoutHelpCta)}</a>
            </div>
          </opinx-component>
          <img class="payment-methods" src="${escapeHtml(content.assets.paymentMethods)}" alt="${escapeHtml(t.paymentAlt)}" loading="lazy" decoding="async">
        </div>
      </div>
    </section>`;
}

function renderInlineCta({ t, id }) {
  return `<section class="conversion-cta" aria-label="${escapeHtml(t.heroPrimary)}"><div class="motus-shell conversion-cta-inner"><div><p>${escapeHtml(t.courseCardEyebrow)}</p><h2>${escapeHtml(t.finalCtaTitle)}</h2></div><a id="${escapeHtml(id)}" class="button button-primary" href="#checkout">${escapeHtml(t.heroPrimary)}${icon("arrow")}</a></div></section>`;
}

function renderSocialProof({ locale, content, t }) {
  const componentKey = `best-carriers-social-proof-${locale}`;
  return `<section class="section section-proof" id="reviews" aria-labelledby="proof-title"><div class="motus-shell"><div class="proof-heading"><div><p class="eyebrow">${icon("star")}<span>${escapeHtml(t.proofEyebrow)}</span></p><h2 id="proof-title">${escapeHtml(t.proofTitle)}</h2><p>${escapeHtml(t.proofBody)}</p></div></div>${renderVideo({ id: content.assets.testimonialsVideo, eyebrow: t.proofEyebrow, title: t.playTestimonials, body: t.proofBody, button: t.playTestimonials, compact: true })}<div class="proof-runtime"><opinx-component data-opinx-global-content="${componentKey}"><div data-component-fallback><div class="rating-chip" aria-label="${escapeHtml(t.ratingLabel)}"><strong>${escapeHtml(content.ratingSnapshot.average)}</strong><span><b aria-hidden="true">★★★★★</b><small>${escapeHtml(t.ratingBasedOn)}</small></span></div><div class="fallback-reviews">${content.ratingSnapshot.reviews.map((review) => `<article><div class="review-top"><span>${initials(review.name)}</span><div><strong>${escapeHtml(review.name)}</strong><b aria-label="5 ${locale === "es" ? "estrellas" : "stars"}">★★★★★</b></div></div><p>“${escapeHtml(review[locale])}”</p></article>`).join("")}</div><div class="photo-heading"><div><h3>${escapeHtml(t.photosTitle)}</h3><p>${escapeHtml(t.photosBody)}</p></div></div><div class="photo-grid">${content.assets.groupPhotos.map((photo) => `<figure><img src="${escapeHtml(photo.url)}" alt="${escapeHtml((locale === "es" ? "Participantes de " : "Participants in ") + photo.course[locale] + " · " + photo.date[locale])}" loading="lazy" decoding="async"><figcaption><strong>${escapeHtml(photo.course[locale])}</strong><span>${escapeHtml(photo.date[locale])}</span></figcaption></figure>`).join("")}</div></div></opinx-component></div></div></section>`;
}

function renderVideo({ id, eyebrow, title, body, button, compact = false }) {
  const thumbnail = `https://i.ytimg.com/vi/${encodeURIComponent(id)}/hqdefault.jpg`;
  return `<article class="video-card${compact ? " video-card-compact" : ""}" data-video-card data-video-id="${escapeHtml(id)}" data-video-title="${escapeHtml(title)}"><button class="video-art" type="button" data-play-video aria-label="${escapeHtml(button)}"><img class="video-thumbnail" src="${escapeHtml(thumbnail)}" alt="" loading="lazy" decoding="async"><span class="video-shade" aria-hidden="true"></span><span class="video-code">BC / ${compact ? "STORIES" : "01"}</span><span class="video-play" aria-hidden="true">${icon("play")}</span></button><div class="video-copy"><p class="card-kicker">${escapeHtml(eyebrow)}</p><h2>${escapeHtml(title)}</h2><p>${escapeHtml(body)}</p><button type="button" data-play-video>${icon("play")}<span>${escapeHtml(button)}</span></button></div></article>`;
}

function renderFooter({ locale, content, site, t }) {
  const terms = locale === "es" ? "https://best-carriers.com/terminos-y-condiciones/" : "https://best-carriers.com/en/terms-and-conditions/";
  const privacy = locale === "es" ? "https://best-carriers.com/politica-de-privacidad/" : "https://best-carriers.com/en/privacy-policy/";
  return `<footer class="site-footer"><div class="motus-shell footer-grid"><div class="footer-brand"><img src="${escapeHtml(content.assets.logo)}" alt="Best Carriers"><p>${escapeHtml(t.footerTagline)}</p></div><div><p>${escapeHtml(t.footerDisclaimer)}</p><nav aria-label="${locale === "es" ? "Información legal" : "Legal information"}"><a href="${escapeHtml(terms)}">${escapeHtml(t.termsLabel)}</a><a href="${escapeHtml(privacy)}">${escapeHtml(t.privacyLabel)}</a></nav><small>© <span data-current-year>${new Date().getUTCFullYear()}</span> ${escapeHtml(t.copyright)}</small></div></div></footer>`;
}

function buildSchema({ locale, content, site }) {
  const t = content.locales[locale];
  const canonical = content.routes[locale];
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": "https://best-carriers.com/#organization",
        name: site.brand,
        legalName: "Opin X LLC",
        url: "https://best-carriers.com/",
        logo: { "@type": "ImageObject", url: content.assets.logo },
        sameAs: site.sameAs
      },
      {
        "@type": "Course",
        "@id": `${canonical}#course`,
        name: t.courseCardTitle,
        description: t.metaDescription,
        url: canonical,
        inLanguage: locale === "es" ? "es-US" : "en-US",
        courseMode: "online",
        provider: { "@id": "https://best-carriers.com/#organization" },
        teaches: t.outcomes
      },
      {
        "@type": "WebPage",
        "@id": `${canonical}#webpage`,
        url: canonical,
        name: t.metaTitle,
        description: t.metaDescription,
        inLanguage: locale === "es" ? "es-US" : "en-US",
        mainEntity: { "@id": `${canonical}#course` },
        isPartOf: { "@type": "WebSite", "@id": "https://best-carriers.com/#website", url: "https://best-carriers.com/", name: site.brand }
      },
      {
        "@type": "FAQPage",
        "@id": `${canonical}#faq`,
        mainEntity: t.faqs.map((item) => ({ "@type": "Question", name: item.q, acceptedAnswer: { "@type": "Answer", text: item.a } }))
      }
    ]
  };
}

function whatsappUrl(site, locale) {
  const message = locale === "es" ? "Quiero información sobre el curso grabado de MOTUS" : "I would like information about the recorded MOTUS course";
  return `https://wa.me/${site.whatsapp.number}?text=${encodeURIComponent(message)}`;
}

function initials(name) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
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
    box: '<path d="m21 8-9 5-9-5 9-5 9 5Z"/><path d="m3 8 9 5 9-5v8l-9 5-9-5V8Z"/>',
    certificate: '<circle cx="12" cy="9" r="6"/><path d="m8.5 14-1 7 4.5-2 4.5 2-1-7"/>',
    check: '<path d="m5 12 4 4L19 6"/>',
    community: '<circle cx="9" cy="8" r="3"/><circle cx="17" cy="10" r="2"/><path d="M3 20a6 6 0 0 1 12 0M14 16a4 4 0 0 1 7 3"/>',
    download: '<path d="M12 3v12m-5-5 5 5 5-5M5 21h14"/>',
    external: '<path d="M14 4h6v6M20 4l-9 9"/><path d="M18 13v6H5V6h6"/>',
    help: '<circle cx="12" cy="12" r="9"/><path d="M9.8 9a2.5 2.5 0 1 1 3.7 2.2c-1 .5-1.5 1.1-1.5 2.3M12 17h.01"/>',
    infinity: '<path d="M7.5 8.5c-2.2 0-4 1.6-4 3.5s1.8 3.5 4 3.5c4 0 5-7 9-7 2.2 0 4 1.6 4 3.5s-1.8 3.5-4 3.5c-4 0-5-7-9-7Z"/>',
    layers: '<path d="m12 3 9 5-9 5-9-5 9-5Z"/><path d="m3 12 9 5 9-5M3 16l9 5 9-5"/>',
    lock: '<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
    play: '<path d="m9 7 8 5-8 5V7Z"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    refresh: '<path d="M20 7h-5V2M4 17h5v5M6 8a7 7 0 0 1 12-3l2 2M18 16a7 7 0 0 1-12 3l-2-2"/>',
    route: '<circle cx="6" cy="18" r="2"/><circle cx="18" cy="6" r="2"/><path d="M8 18h3a3 3 0 0 0 0-6H9a3 3 0 0 1 0-6h7"/>',
    signal: '<path d="M4 17h2v3H4zM9 13h2v7H9zM14 9h2v11h-2zM19 4h2v16h-2z"/>',
    star: '<path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9L12 3Z"/>',
    users: '<circle cx="9" cy="8" r="3"/><path d="M3 20a6 6 0 0 1 12 0"/><path d="M16 5a3 3 0 0 1 0 6M17 14a5 5 0 0 1 4 5"/>',
    whatsapp: '<path d="M20.5 11.7a8.5 8.5 0 0 1-12.6 7.5L3 20.5l1.3-4.7A8.5 8.5 0 1 1 20.5 11.7Z"/><path d="M8 7.8c.4-.7.8-.7 1.2-.6.3 0 .5.2.7.6l.8 1.7c.1.3.1.6-.1.8l-.6.7c-.2.3-.1.5 0 .8.8 1.4 1.8 2.3 3.1 3 .3.2.6.2.8-.1l.8-.9c.3-.3.6-.3.9-.2l1.8.9c.4.2.5.5.4.9-.2 1.1-1 2-2.1 2.3-1.4.3-3.4-.4-5.4-2.2-1.8-1.6-2.9-3.5-3.2-4.9-.2-1 .2-2.1.9-2.8Z"/>'
  };
  return `<svg class="icon icon-${escapeHtml(name)}" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${paths[name] || paths.check}</svg>`;
}
