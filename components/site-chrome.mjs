import { catalogRoutes, renderSiteNavigation } from './site-navigation.mjs';

const escape = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const whatsappIcon = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.5 11.7a8.5 8.5 0 0 1-12.6 7.5L3 20.5l1.3-4.7A8.5 8.5 0 1 1 20.5 11.7Z"/><path d="M8.2 7.7c.3-.6.5-.6.8-.6h.5c.2 0 .4.1.5.4l.8 1.9c.1.3.1.5-.1.7l-.6.8c-.2.2-.2.4 0 .7.7 1.2 1.6 2.1 2.8 2.8.3.2.5.2.7 0l.9-1c.2-.3.5-.3.8-.2l1.9.9c.3.1.4.3.4.6 0 .4-.2 1.4-.9 2-.6.6-1.5.9-2.4.7-1.3-.2-3.1-.9-5-2.6-1.4-1.3-2.4-2.9-2.8-4.2-.4-1.1 0-2.2.3-2.9Z"/></svg>';

function brand(site, locale) {
  return `<a class="bc-brand" href="https://best-carriers.com/${locale === 'en' ? 'en/' : ''}" aria-label="Best Carriers · ${locale === 'en' ? 'Home' : 'Inicio'}"><img src="${escape(site.logo)}" alt="" width="44" height="44" decoding="async"><span><strong>Best Carriers</strong><small>${locale === 'en' ? 'Trucking · Training · Business' : 'Trucking · Formación · Negocios'}</small></span></a>`;
}

function actions({ locale, current, whatsappUrl, footer }) {
  const routes = catalogRoutes[current];
  if (!routes) throw new Error('A shared catalog header requires a valid section.');
  if (!/^https:\/\/wa\.me\/\d+\?text=/.test(whatsappUrl)) throw new Error('Use the configured WhatsApp destination and an explicit page message.');
  return `<div class="bc-chrome-actions"><nav class="bc-language-switch" aria-label="${locale === 'en' ? 'Select language' : 'Seleccionar idioma'}${footer ? (locale === 'en' ? ' · Footer' : ' · Pie de página') : ''}">${['es','en'].map(lang => `<a href="https://best-carriers.com${routes[lang]}" hreflang="${lang}" lang="${lang}" data-language-link aria-label="${lang === 'es' ? 'Español' : 'English'}"${locale === lang ? ' aria-current="page"' : ''}>${lang.toUpperCase()}</a>`).join('')}</nav><a class="bc-whatsapp" href="${escape(whatsappUrl)}" target="_blank" rel="noopener noreferrer" aria-label="${locale === 'en' ? 'Contact us on WhatsApp' : 'Contactar por WhatsApp'}">${whatsappIcon}<span>WhatsApp</span></a></div>`;
}

export function renderSiteHeader(options) {
  return `<header class="bc-chrome bc-site-header" data-site-chrome="header"><div class="bc-chrome-shell bc-chrome-row">${brand(options.site, options.locale)}${renderSiteNavigation(options)}${actions({...options, footer:false})}</div></header>`;
}

export function renderSiteFooter(options) {
  const en = options.locale === 'en';
  return `<footer class="bc-chrome bc-site-footer" data-site-chrome="footer"><div class="bc-chrome-shell"><div class="bc-chrome-row">${brand(options.site, options.locale)}${renderSiteNavigation({...options, footer:true})}${actions({...options, footer:true})}</div><p class="bc-footer-description">${en ? 'Training, services and resources for the U.S. trucking industry.' : 'Formación, servicios y recursos para la industria del trucking en Estados Unidos.'}</p><div class="bc-footer-bottom"><p>© <span data-current-year>2026</span> Best Carriers. ${en ? 'All rights reserved.' : 'Todos los derechos reservados.'}</p><nav class="bc-footer-legal" aria-label="${en ? 'Legal information' : 'Información legal'}"><a href="https://best-carriers.com/${en ? 'en/terms-and-conditions' : 'terminos-y-condiciones'}/">${en ? 'Terms and conditions' : 'Términos y condiciones'}</a><a href="https://best-carriers.com/${en ? 'en/privacy-policy' : 'politica-de-privacidad'}/">${en ? 'Privacy' : 'Privacidad'}</a></nav></div></div></footer>`;
}
