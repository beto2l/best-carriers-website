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
  "en/courses/motus/thank-you"
]);
const failures = [];

if (release.contract_version !== 5) failures.push("contract_version must be 5");
if (release.runtime !== "static") failures.push("runtime must be static");
if (release.scope !== "pages") failures.push("scope must be pages");
if (release.version !== packageJson.version) failures.push("release and package versions must match");
if (release.pages.length !== 6) failures.push("exactly six native Pages are required");

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
    "hreflang=\"es\"",
    "hreflang=\"en\"",
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

if (failures.length) {
  console.error(failures.map((failure) => `- ${failure}`).join("\n"));
  process.exit(1);
}

console.log(`Validated LuxWrap ${release.version}: ${release.pages.length} native Pages, ${Object.keys(components).length} global components and ${Object.keys(release.files_sha256).length} checksummed files.`);

function checkServices(page, html) {
  for (const required of [
    "data-services-grid",
    "data-service-dialog",
    "Best Carriers interactive catalog could not load",
    "https://bc.opin-x.com/best-carriers-services-hero.webp",
    "https://wa.me/12192396752?text=Quiero%20un%20servicio%20de%20trucking"
  ]) {
    if (!html.includes(required)) failures.push(`${page.entry} is missing ${required}`);
  }
  if ((html.match(/<article class="service-card" data-service-card/g) || []).length !== 12) failures.push(`${page.entry} must contain 12 static service cards`);
  if ((html.match(/<tr data-service-row/g) || []).length !== 12) failures.push(`${page.entry} must contain 12 table service rows`);
  if (!html.includes("data-static-catalog")) failures.push(`${page.entry} is missing the embedded service catalog`);
  if (!html.includes(page.language === "es" ? "Obtener USDOT" : "Obtain USDOT Number")) failures.push(`${page.entry} is missing the USDOT service`);
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
  if (!html.includes('src="https://bc.opin-x.com/motus-recorded-course.webp"')) failures.push(`${page.entry} must use the CDN recorded-course artwork`);
  if (html.includes("https://bc.opin-x.com/Motus-V2.png")) failures.push(`${page.entry} must not use the old live-workshop artwork`);
  for (const forbidden of [
    "Workshop en vivo online",
    "Sábado 12 de Septiembre de 2026",
    "Duración: 2 horas",
    "Preguntas y respuestas en vivo"
  ]) {
    if (html.includes(forbidden)) failures.push(`${page.entry} retains live-workshop copy: ${forbidden}`);
  }
  if (!html.toLowerCase().includes(locale === "es" ? "acceso de por vida" : "lifetime access")) failures.push(`${page.entry} is missing the lifetime-access promise`);
  if (!html.includes(locale === "es" ? "La calificación general reúne opiniones verificadas sobre distintos cursos y servicios educativos de Best Carriers" : "The overall rating combines verified feedback about different Best Carriers courses and educational services")) failures.push(`${page.entry} must label reviews as brand-wide social proof`);
  if (html.includes("www.fmcsa.dot.gov/registration/move-motus")) failures.push(`${page.entry} must not include the external FMCSA link`);
  if (html.includes('class="site-header"')) failures.push(`${page.entry} must not include the fixed sales-page header`);
  if (!html.includes(locale === "es" ? "Curso MOTUS · Obtener acceso" : "MOTUS Course · Get access")) failures.push(`${page.entry} is missing the mobile purchase CTA`);
  for (const visual of [
    "Screenshot-2026-09-14-at-11.46.48-AM-scaled.png",
    "Screenshot-2026-09-14-at-11.48.25-AM-scaled.png",
    "Screenshot-2026-09-14-at-11.49.54-AM-scaled.png",
    "Screenshot-2026-09-14-at-11.50.03-AM-scaled.png",
    "temario-Taller-Motus.png",
    "motus.jpg"
  ]) {
    if (!html.includes(`https://bc.opin-x.com/${visual}`)) failures.push(`${page.entry} is missing CDN visual ${visual}`);
  }
  if (!html.includes('class="mobile-purchase" href="#checkout" aria-hidden="true"')) failures.push(`${page.entry} must defer the mobile purchase CTA until the hero is passed`);
  if (html.includes('<details class="curriculum-card"')) failures.push(`${page.entry} must show the complete curriculum without a disclosure control`);
  if ((html.match(/class="curriculum-card"/g) || []).length !== 3) failures.push(`${page.entry} must include all three curriculum modules`);
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
