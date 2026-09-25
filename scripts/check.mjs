import { createHash } from "node:crypto";
import { access, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const release = JSON.parse(await readFile(path.join(root, "lw-release.json"), "utf8"));
const packageJson = JSON.parse(await readFile(path.join(root, "package.json"), "utf8"));
const expectedRoutes = new Set([
  "servicios",
  "services",
  "cursos/motus",
  "en/courses/motus",
  "cursos/motus/gracias",
  "en/courses/motus/thank-you",
  "cursos/combo/pay"
]);
const failures = [];

if (release.contract_version !== 5) failures.push("contract_version must be 5");
if (release.runtime !== "static") failures.push("runtime must be static");
if (release.scope !== "pages") failures.push("scope must be pages");
if (release.version !== packageJson.version) failures.push("release and package versions must match");
if (release.pages.length !== 7) failures.push("exactly seven native Pages are required");
const servicePages = release.pages.filter(page => ["servicios", "services"].includes(page.route));
if (servicePages.length !== 2 || servicePages.some(page => page.translation_key !== "trucking-services")) {
  failures.push("Spanish and English service pages must remain a linked translation pair");
}

const ids = new Set();
for (const page of release.pages) {
  if (ids.has(page.id)) failures.push(`duplicate Page ID ${page.id}`);
  ids.add(page.id);
  expectedRoutes.delete(page.route);
  if (!release.files_sha256[page.entry]) failures.push(`missing checksum for ${page.entry}`);
  const html = await readFile(path.join(root, page.entry), "utf8");
  const expectedCanonical = `https://best-carriers.com/${page.route}/`;
  for (const required of [
    `rel="canonical" href="${expectedCanonical}"`,
    ...(page.route === "cursos/combo/pay" ? [] : ['hreflang="es"', 'hreflang="en"']),
    "data-current-year",
    "<style>:root"
  ]) {
    if (!html.includes(required)) failures.push(`${page.entry} is missing ${required}`);
  }
  if (/<script[^>]+src=["']https?:\/\//i.test(html)) failures.push(`${page.entry} loads undeclared external JavaScript`);
  if (/\[(opin_|shortcode)/i.test(html)) failures.push(`${page.entry} contains a raw WordPress shortcode`);

  if (["servicios", "services"].includes(page.route)) checkServices(page, html);
  if (["cursos/motus", "en/courses/motus"].includes(page.route)) checkMotusSale(page, html);
  if (["cursos/motus/gracias", "en/courses/motus/thank-you"].includes(page.route)) checkMotusThanks(page, html);
}

if (expectedRoutes.size) failures.push(`missing routes: ${[...expectedRoutes].join(", ")}`);

const components = release.global_content || {};
for (const key of [
  "best-carriers-social-proof-es",
  "best-carriers-social-proof-en",
  "motus-checkout-es",
  "motus-checkout-en",
  "motus-payment-result-es",
  "motus-payment-result-en"
]) {
  if (!components[key]) failures.push(`missing global component ${key}`);
}
for (const key of ["best-carriers-social-proof-es", "best-carriers-social-proof-en"]) {
  if (components[key]?.scope !== "brand") failures.push(`${key} must represent the Best Carriers brand`);
  if (components[key]?.source !== "reviews_hub") failures.push(`${key} must use Reviews Hub`);
}
for (const key of ["motus-checkout-es", "motus-checkout-en"]) {
  const component = components[key] || {};
  if (component.design_variant !== "headless") failures.push(`${key} must leave presentation to the release`);
  if (component.required_product_type !== "recorded_course") failures.push(`${key} must reject the former live workshop configuration`);
  for (const benefit of ["lifetime_access", "includes_updates", "includes_certificate"]) {
    if (!component.required_benefits?.includes(benefit)) failures.push(`${key} must require ${benefit}`);
  }
  if (component.require_legal !== false || component.legal_surface !== "landing") {
    failures.push(`${key} must keep legal copy on the landing when the checkout disclosure is empty`);
  }
}

for (const [relative, expected] of Object.entries(release.files_sha256)) {
  const absolute = path.join(root, relative);
  await access(absolute);
  const actual = createHash("sha256").update(await readFile(absolute)).digest("hex");
  if (actual !== expected) failures.push(`checksum mismatch: ${relative}`);
}

const paymentPage = release.pages.find(page => page.route === "cursos/combo/pay");
const paymentHtml = await readFile(path.join(root, paymentPage.entry), "utf8");
for (const slug of ["tdc", "ifta", "safety", "motus", "consultoria"]) {
  const key = `payments-${slug}-es`;
  const component = components[key];
  if (!paymentPage.components.includes(key) || component?.product !== slug || component?.activation !== "on_select") failures.push(`Missing selectable checkout for ${slug}`);
  if (!paymentHtml.includes(`data-checkout="${slug}"`) || !paymentHtml.includes(`data-product="${slug}"`)) failures.push(`Missing selection UI for ${slug}`);
}
for (const forbidden of ["checkout-bootstrap", "admin-ajax.php", "OPINFunnelHeadless.mount", "localStorage", "sessionStorage", "stripe.com/pay", "399", "699"]) {
  if (paymentHtml.includes(forbidden)) failures.push(`Payment UI must not duplicate payment logic, customer storage or canonical prices: ${forbidden}`);
}
if (!paymentHtml.includes("Best-carriers-icon.png") || !paymentHtml.includes("OPINXLWCheckout.activate")) failures.push("Payment page requires the original logo and official component activation");

if (failures.length) {
  console.error(failures.map((failure) => `- ${failure}`).join("\n"));
  process.exit(1);
}

console.log(`Validated LuxWrap ${release.version}: ${release.pages.length} native Pages, ${Object.keys(components).length} global components and ${Object.keys(release.files_sha256).length} checksummed files.`);

function checkServices(page, html) {
  const whatsAppMessage = page.language === "es" ? "Quiero un servicio de trucking" : "I want trucking services";
  for (const required of [
    "data-services-grid",
    "data-service-dialog",
    "Best Carriers interactive catalog could not load",
    "https://bc.opin-x.com/best-carriers-services-hero.webp",
    `https://wa.me/12192396752?text=${encodeURIComponent(whatsAppMessage)}`
  ]) {
    if (!html.includes(required)) failures.push(`${page.entry} is missing ${required}`);
  }
  if ((html.match(/<article class="service-card" data-service-card/g) || []).length !== 12) failures.push(`${page.entry} must contain 12 static service cards`);
  if ((html.match(/<tr data-service-row/g) || []).length !== 12) failures.push(`${page.entry} must contain 12 table service rows`);
  if ((html.match(/<div class="card-visual"><img src="https:\/\/bc\.opin-x\.com\//g) || []).length !== 12) failures.push(`${page.entry} must use 12 authorized CDN service images`);
  if ((html.match(/loading="lazy" decoding="async" sizes="\(min-width: 1180px\)/g) || []).length !== 12) failures.push(`${page.entry} must lazy-load all service-card images`);
  if (!html.includes('class="brand-logo" src="https://c.opin-x.com/best-carriers/Best-carriers-icon.png"')) failures.push(`${page.entry} must use the payment page logo`);
  if (!html.includes("data-static-catalog")) failures.push(`${page.entry} is missing the embedded service catalog`);
  if (!html.includes(page.language === "es" ? "Obtener USDOT" : "Obtain USDOT Number")) failures.push(`${page.entry} is missing the USDOT service`);
  if (!html.includes(page.language === "es" ? "Fee de la Secretaría de Estado" : "Secretary of State filing fee")) failures.push(`${page.entry} is missing the LLC state-fee exclusion`);
  if (!html.includes(page.language === "es" ? "Página web y dominio personalizado: $250 por un año" : "Website and custom domain: $250 for one year")) failures.push(`${page.entry} is missing the LLC website add-on`);
  for (const required of page.language === "es"
    ? ["Para iniciar el registro de su compañía de transporte", "Comprobante de domicilio comercial", "Indicar mínimo 3 tipos de carga u operaciones", "se recomienda no utilizar el número de teléfono personal"]
    : ["To begin registering your trucking company", "Proof of business address", "Provide at least 3 types of cargo or operations", "recommend not using a personal phone number"]) {
    if (!html.includes(required)) failures.push(`${page.entry} is missing the updated LLC requirement: ${required}`);
  }
  for (const removed of page.language === "es"
    ? ["Nombre completo e identificación de cada socio", "algún miembro de la compañía será el registered agent"]
    : ["Full name and identification for each member", "company member will serve as the registered agent"]) {
    if (html.includes(removed)) failures.push(`${page.entry} retains an outdated LLC requirement: ${removed}`);
  }
  for (const slug of page.language === "es"
    ? ["declaracion-impuestos-federales", "form-1099", "sales-tax", "filing-ifta", "irp-ifta", "crear-llc", "permisos-estatales", "obtener-usdot", "reinstate-mc-authority", "migrar-motus", "cerrar-empresa-trucking", "consultoria-impuestos-trucking"]
    : ["federal-tax-filing", "form-1099", "sales-tax", "ifta-filing", "irp-ifta", "llc-authority", "state-permits", "obtain-usdot", "reinstate-mc-authority", "migrate-motus", "close-trucking-company", "tax-trucking-consulting"]) {
    if (!html.includes(`\"slug\":\"${slug}\"`)) failures.push(`${page.entry} is missing deep-link slug #${slug}`);
  }
  for (const required of ["syncDialogWithHash", "window.addEventListener(\"hashchange\"", "window.history.pushState", "window.history.replaceState"]) {
    if (!html.includes(required)) failures.push(`${page.entry} is missing service deep-link behavior: ${required}`);
  }
}

function checkMotusSale(page, html) {
  const locale = page.language;
  for (const required of [
    `data-opinx-global-content="best-carriers-social-proof-${locale}"`,
    `data-opinx-global-content="motus-checkout-${locale}"`,
    '"@type":"Course"',
    '"@type":"FAQPage"',
    '"sameAs":["https://www.facebook.com/bestcarriers"',
    "data-video-card",
    "data-motus-checkout",
    "https://i.ytimg.com/vi/"
  ]) {
    if (!html.includes(required)) failures.push(`${page.entry} is missing ${required}`);
  }
  if (!html.includes('src="https://bc.opin-x.com/motus-course-device-scene-v4.webp"')) failures.push(`${page.entry} must use the current CDN recorded-course artwork`);
  if (!html.includes('src="https://bc.opin-x.com/facebook-comment-karla-rivera-motus.webp"')) failures.push(`${page.entry} must show the featured Facebook screenshot from the CDN`);
  if (!html.includes(locale === "es" ? "Excelente clase. Yo después, en lo personal, pude arreglar mi problema." : "Excellent class. Afterwards, I was able to solve my problem personally.")) failures.push(`${page.entry} must preserve the featured comment as accessible text`);
  if (html.includes("https://bc.opin-x.com/Motus-V2.png")) failures.push(`${page.entry} must not use the old live-workshop artwork`);
  for (const forbidden of [
    "Workshop en vivo online",
    "Sábado 12 de Septiembre de 2026",
    "Duración: 2 horas",
    "Preguntas y respuestas en vivo"
  ]) {
    if (html.includes(forbidden)) failures.push(`${page.entry} retains live-workshop copy: ${forbidden}`);
  }
  if (!html.toLowerCase().includes(locale === "es" ? "acceso inmediato" : "immediate access")) failures.push(`${page.entry} is missing the immediate-access promise`);
  if (!html.includes(locale === "es" ? "La calificación general reúne opiniones verificadas sobre distintos cursos y servicios educativos de Best Carriers" : "The overall rating combines verified feedback about different Best Carriers courses and educational services")) failures.push(`${page.entry} must label reviews as brand-wide social proof`);
  if (html.includes("www.fmcsa.dot.gov/registration/move-motus")) failures.push(`${page.entry} must not include the external FMCSA link`);
  if (html.includes('class="site-header"')) failures.push(`${page.entry} must not include the fixed sales-page header`);
  if (!html.includes(locale === "es" ? "Curso MOTUS · Obtener acceso" : "MOTUS Course · Get access")) failures.push(`${page.entry} is missing the mobile purchase CTA`);
  for (const visual of [
    "Screenshot-2026-09-14-at-11.46.48-AM-scaled.png",
    "Screenshot-2026-09-14-at-11.48.25-AM-scaled.png",
    "Screenshot-2026-09-14-at-11.49.54-AM-scaled.png",
    "Screenshot-2026-09-14-at-11.50.03-AM-scaled.png",
    "motus-curriculum-15-lessons.webp",
    "motus.jpg"
  ]) {
    if (!html.includes(`https://bc.opin-x.com/${visual}`)) failures.push(`${page.entry} is missing CDN visual ${visual}`);
  }
  if (!html.includes('class="mobile-purchase" href="#checkout-form" aria-hidden="true"')) failures.push(`${page.entry} must send the mobile purchase CTA to the checkout form after the hero is passed`);
  if (html.includes('<details class="curriculum-card"')) failures.push(`${page.entry} must show the complete curriculum without a disclosure control`);
  if ((html.match(/class="curriculum-card"/g) || []).length !== 5) failures.push(`${page.entry} must include all five curriculum modules`);
  if (!html.includes('class="conversion-cta"')) failures.push(`${page.entry} must include contextual conversion CTAs`);
  if (!html.includes('.opin-fi-digital-sale-legal { display: none; }')) failures.push(`${page.entry} must suppress checkout copy not approved for the landing`);
}

function checkMotusThanks(page, html) {
  const locale = page.language;
  if (!html.includes('name="robots" content="noindex,follow,noarchive"')) failures.push(`${page.entry} must be noindex`);
  if (!html.includes(`data-opinx-global-content="motus-payment-result-${locale}"`)) failures.push(`${page.entry} is missing the payment-result component`);
  if (/cs_(?:live|test)_/i.test(html)) failures.push(`${page.entry} must not contain a payment session ID`);
  if (!html.includes("https://learning.opin-x.com/")) failures.push(`${page.entry} is missing the Learning next step`);
}
