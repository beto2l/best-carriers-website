import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { renderPaymentMarks, whatsappMark } from "../components/payment-marks.mjs";
const escape = value => String(value).replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
export async function buildPayments({ root, version }) {
  const content = JSON.parse(await readFile(path.join(root, "content/payments.json"), "utf8"));
  const css = await readFile(path.join(root, "src/payments.css"), "utf8");
  const js = await readFile(path.join(root, "src/payments.js"), "utf8");
  const paymentMarks = await renderPaymentMarks(root);
  const route = "cursos/combo/pay";
  const entry = `pages/${route}/index.html`;
  const key = product => `payments-${product.slug}-es`;
  const cards = content.products.map(product => `<a class="product" href="${escape(product.fallback)}" data-product="${product.slug}" aria-controls="payment-panel">
    <span class="product-copy"><strong>${escape(product.name)}</strong><small>${escape(product.tag)}</small><span class="product-date">${escape(product.availability || "Ver fecha y horario")}</span><span class="product-time"></span></span>
    <span class="product-action"><b class="product-price">Ver precio</b><span class="product-pay">Pagar <span aria-hidden="true">→</span></span></span>
  </a>`).join("\n");
  const components = content.products.map(product => `<section data-checkout="${product.slug}" hidden><opinx-component data-opinx-global-content="${key(product)}"><p>Continúa en la página de inscripción.</p><a class="fallback-button" href="${escape(product.fallback)}">Abrir inscripción</a></opinx-component></section>`).join("\n");
  const html = `<!doctype html>
<html lang="es-US"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Cursos y consultoría · Pago seguro | Best Carriers</title>
<meta name="description" content="Elige tu curso o consultoría de Best Carriers, consulta su fecha y precio y continúa al pago seguro con Stripe.">
<meta name="robots" content="noindex,follow"><meta name="theme-color" content="#f7f5f1">
<link rel="canonical" href="https://best-carriers.com/cursos/combo/pay/">
<link rel="icon" href="${escape(content.logo)}">
<style>${css}</style></head>
<body data-release="${version}">
<a class="skip-link" href="#products">Ir a los cursos</a>
<main class="page">
<header class="intro"><a class="brand" href="https://best-carriers.com/" aria-label="Best Carriers, inicio"><img src="${escape(content.logo)}" alt="" width="64" height="64"><span>BEST CARRIERS<small>FORMACIÓN & CONSULTORÍA</small></span></a>
<h1>Tu próximo paso <em>empieza aquí.</em></h1><p>Elige una opción y continúa al pago seguro.</p></header>
<div class="payment-layout">
<section class="catalog" aria-label="Cursos y consultoría"><nav id="products" class="products" aria-label="Cursos y consultoría">${cards}</nav></section>
<section class="payment-panel" id="payment-panel" aria-labelledby="payment-title" hidden>
<button class="back" type="button" data-back>← Cambiar opción</button>
<div class="selection"><h2 id="payment-title" tabindex="-1"></h2><strong data-selected-price></strong><p data-selected-date></p></div>
<p class="form-status" role="status" aria-live="polite" data-form-status></p>
${components}
<p class="form-recovery" data-form-recovery hidden>No pudimos cargar el formulario. <button type="button" data-retry>Reintentar</button> o <a data-fallback>abrir la inscripción</a>.</p>
<p class="secure-note"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg> Pago seguro procesado por <strong>stripe</strong></p>
</section></div>
<footer class="footer"><div class="methods">${paymentMarks}</div><p class="catalog-note">Precios en USD · Selecciona una opción</p><p class="help">¿Necesitas ayuda? <a href="https://wa.me/12192396752?text=Necesito%20ayuda%20para%20inscribirme" aria-label="Escríbenos por WhatsApp">${whatsappMark}<span>Escríbenos</span></a></p><small class="copyright">© <span data-current-year>2026</span> Best Carriers</small></footer>
</main><script>${js}</script></body></html>
`;
  await mkdir(path.join(root, `pages/${route}`), { recursive: true });
  await writeFile(path.join(root, entry), html);
  return {
    files: [path.join(root, entry)],
    pages: [{ id: "course-payment-selector-es", title: "Cursos y consultoría · Pago seguro", route, entry, language: "es", seo: { robots: "noindex,follow" }, components: content.products.map(key) }],
    globalContent: Object.fromEntries(content.products.map(product => [key(product), {
      type: "checkout", version: 1, product: product.slug, language: "es", design_variant: "headless", activation: "on_select", submit_label: "Continuar a Stripe →", required_product_type: product.type
    }]))
  };
}
