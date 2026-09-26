import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
const escape = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const json = value => JSON.stringify(value).replaceAll('<','\\u003c');
const icons = {
  play: '<path d="m9 5 10 7-10 7z"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  award: '<circle cx="12" cy="8" r="5"/><path d="m8 12-1 9 5-3 5 3-1-9"/>',
  search: '<circle cx="10" cy="10" r="6"/><path d="m15 15 5 5"/>',
  grid: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
  list: '<path d="M3 5h18M3 12h18M3 19h18M8 3v18"/>'
};
const icon = name => `<svg viewBox="0 0 24 24" aria-hidden="true">${icons[name]}</svg>`;
export async function buildCourses({root,site,version}) {
  const content = JSON.parse(await readFile(path.join(root,'content/courses.json'),'utf8'));
  const motus = JSON.parse(await readFile(path.join(root,'content/motus.json'),'utf8'));
  const css = (await readFile(path.join(root,'src/courses.css'),'utf8')).replaceAll('</style','<\\/style');
  const js = (await readFile(path.join(root,'src/courses.js'),'utf8')).replaceAll('</script','<\\/script');
  const canonical = 'https://best-carriers.com/cursos/';
  // Preserve the existing approved WhatsApp destination and message.
  const contact = `https://wa.me/${site.whatsapp.number}?text=${encodeURIComponent(site.whatsapp.message.es)}`;
  const brand = `<a class="brand" href="https://best-carriers.com/" aria-label="Best Carriers, inicio"><img src="${escape(site.logo)}" alt="" width="49" height="49"><span><strong>Best Carriers</strong><small>Trucking · Formación · Negocios</small></span></a>`;
  const fallback = content.entries.map((entry,index) => `<article class="course-card"><a class="course-art" href="${canonical}${escape(entry.course)}/" tabindex="-1" aria-hidden="true"><img src="${escape(entry.image)}" alt="" width="720" height="450" loading="lazy" decoding="async"><span class="course-number">BC / ${String(index+1).padStart(2,'0')}</span></a><div class="course-copy"><p class="course-topic">${escape(entry.topic)}</p><h3><a href="${canonical}${escape(entry.course)}/">${escape(entry.title)}</a></h3><p class="course-description">${escape(entry.summary)}</p><a class="course-link" href="${canonical}${escape(entry.course)}/"><span>Ver temario y disponibilidad</span><span aria-hidden="true">↗</span></a></div></article>`).join('');
  const schema = {'@context':'https://schema.org','@graph':[
    {'@type':'CollectionPage','@id':canonical+'#webpage',url:canonical,name:content.title,description:content.description,inLanguage:'es-US',publisher:{'@type':'Organization',name:'Best Carriers',url:'https://best-carriers.com/'}},
    {'@type':'BreadcrumbList',itemListElement:[{'@type':'ListItem',position:1,name:'Inicio',item:'https://best-carriers.com/'},{'@type':'ListItem',position:2,name:'Cursos',item:canonical}]}
  ]};
  const html = `<!doctype html>
<html lang="es-US" class="no-js">
<head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escape(content.title)}</title><meta name="description" content="${escape(content.description)}">
<meta name="robots" content="index,follow,max-image-preview:large"><meta name="theme-color" content="#071522">
<link rel="canonical" href="${canonical}"><link rel="alternate" hreflang="es" href="${canonical}"><link rel="alternate" hreflang="en" href="https://best-carriers.com/en/courses/"><link rel="alternate" hreflang="x-default" href="${canonical}">
<link rel="icon" href="${escape(site.logo)}"><link rel="preconnect" href="https://bc.opin-x.com"><link rel="preload" as="image" href="${escape(content.hero)}" fetchpriority="high">
<meta property="og:type" content="website"><meta property="og:locale" content="es_US"><meta property="og:title" content="${escape(content.title)}"><meta property="og:description" content="${escape(content.description)}"><meta property="og:url" content="${canonical}"><meta property="og:image" content="${escape(content.hero)}"><meta name="twitter:card" content="summary_large_image">
<style>${css}</style><script>document.documentElement.classList.replace('no-js','js');</script>
<script type="application/ld+json">${json(schema)}</script>
</head>
<body data-page="course-catalog" data-release="${version}">
<a class="skip-link" href="#catalogo">Ir al catálogo de cursos</a>
<header class="site-header"><div class="shell header-inner">${brand}<nav class="main-nav" aria-label="Principal"><a href="https://best-carriers.com/servicios/">Servicios</a><a href="#catalogo" aria-current="page">Cursos</a><a href="#experiencias">Experiencias</a></nav><a class="header-contact" href="${contact}" target="_blank" rel="noopener">Hablemos <span aria-hidden="true">↗</span></a></div></header>
<main>
<section class="hero" aria-labelledby="hero-title">
<img class="hero-art" src="${escape(content.hero)}" alt="Camión de transporte en una carretera de Estados Unidos al amanecer" width="1672" height="941" fetchpriority="high" decoding="async">
<div class="shell"><div class="hero-copy"><p class="eyebrow">Formación para la industria del transporte</p><h1 id="hero-title">Cursos de trucking.<br><em>Conocimiento que<br>mueve tu negocio.</em></h1><p class="hero-description">Aprende en español a iniciar, administrar y fortalecer tu operación de transporte en Estados Unidos. Tu siguiente paso empieza aquí.</p><div class="hero-actions"><a class="button button-light" href="#catalogo">Explorar cursos <span aria-hidden="true">↓</span></a><a class="text-link" href="#paquetes">Armar mi paquete <span aria-hidden="true">↗</span></a></div><p class="hero-note">Online · En español · Enfocados en el negocio del trucking</p></div></div><span class="hero-coordinate" aria-hidden="true">BEST CARRIERS / KNOWLEDGE IN MOTION</span>
</section>
<div class="promise-band"><div class="shell promise-items">
<div class="promise-item"><span class="promise-icon">${icon('play')}</span><div><strong>Todos los cursos se graban</strong><p>Repasa el contenido de tu capacitación.</p></div></div>
<div class="promise-item"><span class="promise-icon">${icon('clock')}</span><div><strong>Un año de acceso</strong><p>Al curso que compras, a tu ritmo.</p></div></div>
<div class="promise-item"><span class="promise-icon">${icon('award')}</span><div><strong>Certificado incluido</strong><p>Reconocimiento de tu participación.</p></div></div>
</div></div>
<section class="section catalog" id="catalogo" data-catalog aria-labelledby="catalog-title"><div class="shell">
<div class="section-heading"><div><p class="eyebrow">Elige tu próxima capacitación</p><h2 id="catalog-title">Una industria.<br>Muchas formas de crecer.</h2></div><p>Desde los primeros pasos de tu empresa hasta su operación diaria. Encuentra el curso que responde a tu siguiente reto.</p></div>
<div class="catalog-controls" data-catalog-controls hidden>
<label class="search-box">${icon('search')}<span class="sr-only">Buscar cursos por nombre o tema</span><input type="search" data-course-search placeholder="Busca un curso o tema…" autocomplete="off"></label>
<div class="catalog-filters" role="group" aria-label="Filtrar por modalidad"><button type="button" data-mode-filter="all" aria-pressed="true">Todos</button><button type="button" data-mode-filter="live" aria-pressed="false">En vivo</button><button type="button" data-mode-filter="recorded" aria-pressed="false">Grabados</button><button type="button" data-mode-filter="upcoming" aria-pressed="false">Próximamente</button></div>
<div class="view-switch" role="group" aria-label="Vista del catálogo"><button type="button" data-view-button="cards" aria-pressed="true" aria-label="Ver como tarjetas">${icon('grid')}<span>Tarjetas</span></button><button type="button" data-view-button="table" aria-pressed="false" aria-label="Ver como tabla">${icon('list')}<span>Tabla</span></button></div>
</div>
<div class="catalog-meta"><span data-course-count role="status" aria-live="polite">Explora nuestras capacitaciones</span><span>Encuentra tu tema. Conoce el temario. Da el siguiente paso.</span></div>
<opinx-component data-opinx-global-content="best-carriers-course-catalog-es"><div class="course-grid">${fallback}</div></opinx-component>
<div class="catalog-empty" data-catalog-empty hidden><strong>No encontramos cursos con esa búsqueda.</strong><p>Prueba otro tema o consulta todas las capacitaciones.</p><button class="button" type="button" data-reset-filters>Ver todos los cursos</button></div>
<div class="catalog-guidance"><p><strong>¿No sabes por dónde empezar?</strong>Cuéntanos en qué etapa está tu negocio y te ayudamos a elegir.</p><a href="${contact}" target="_blank" rel="noopener">Orientarme por WhatsApp <span aria-hidden="true">↗</span></a></div>
</div></section>
<section class="section learning" aria-labelledby="learning-title"><div class="shell learning-layout"><div><p class="eyebrow">Aprende. Repasa. Avanza.</p><h2 id="learning-title">El conocimiento se queda contigo.</h2><p class="learning-intro">Tu capacitación no termina al cerrar una sesión. Vuelve al contenido del curso que compraste y refuerza lo aprendido durante un año.</p></div><div class="learning-steps">
<div class="learning-step"><span class="step-num">01</span><div><h3>Elige lo que necesitas.</h3><p>Consulta el temario, la modalidad y los detalles en la página de cada curso.</p></div></div>
<div class="learning-step"><span class="step-num">02</span><div><h3>Aprende y vuelve a verlo.</h3><p>Todos los cursos se graban. Conservas un año de acceso al curso que compras.</p></div></div>
<div class="learning-step"><span class="step-num">03</span><div><h3>Reconoce tu avance.</h3><p>Recibe tu certificado de participación siguiendo las indicaciones de tu curso.</p></div></div>
</div></div></section>
<section class="section proof" id="experiencias" aria-labelledby="proof-title"><div class="shell"><div class="proof-head"><p class="eyebrow">La comunidad Best Carriers</p><h2 id="proof-title">Personas reales.<br>El mismo deseo de avanzar.</h2><p>Conoce las experiencias compartidas por nuestra comunidad y las opiniones sobre Best Carriers.</p></div>
<div class="video-feature"><div class="video-frame"><img class="video-poster" src="${escape(content.testimonialsPoster || motus.assets.groupPhotos[0].url)}" alt="Participantes de una capacitación de Best Carriers" width="720" height="405" loading="lazy"><button type="button" data-testimonial-play aria-label="Reproducir testimonios de alumnos de Best Carriers"><span class="play-circle" aria-hidden="true">▶</span><span>Escucha sus experiencias</span></button></div><div class="video-copy"><p class="eyebrow">En sus propias palabras</p><h3>La experiencia de quienes ya dieron el paso.</h3><p>Detrás de cada curso hay personas que quieren entender mejor su negocio y seguir creciendo en el transporte.</p><small>Testimonios de alumnos de Best Carriers</small><noscript><p><a href="https://www.youtube.com/watch?v=LJ9DsCbuMXw">Ver testimonios en video ↗</a></p></noscript></div></div>
<opinx-component data-opinx-global-content="best-carriers-social-proof-es"><p>Conoce más <a class="text-link" href="https://best-carriers.com/cursos/motus/#reviews">experiencias de nuestra comunidad ↗</a>.</p></opinx-component>
</div></section>
<section class="bundle" id="paquetes" aria-labelledby="bundle-title"><div class="shell bundle-layout"><div><p class="eyebrow">Tu formación, a tu medida</p><h2 id="bundle-title">Un curso abre la ruta.<br>Varios amplían tu visión.</h2><div class="bundle-tags" aria-label="Áreas de capacitación"><span>Inicia tu empresa</span><span>Fortalece tu operación</span><span>Desarrolla tu equipo</span></div></div><div class="bundle-copy"><p>Si quieres tomar varias capacitaciones, podemos preparar un paquete para ti. La cotización se realiza de acuerdo con la cantidad de cursos que quieras tomar.</p><a class="button" href="${contact}" target="_blank" rel="noopener">Cotizar mi paquete de cursos <span aria-hidden="true">↗</span></a></div></div></section>
<section class="section" id="preguntas" aria-labelledby="faq-title"><div class="shell faq-layout"><div class="faq-intro"><p class="eyebrow">Antes de empezar</p><h2 id="faq-title">Resolvamos<br>tus dudas.</h2><p>Lo esencial para elegir tu capacitación y dar el siguiente paso con claridad.</p></div><div class="faq-list">${content.faqs.map(faq=>`<details><summary>${escape(faq.question)}</summary><p>${escape(faq.answer)}</p></details>`).join('')}</div></div></section>
<section class="closing" aria-labelledby="closing-title"><div class="shell closing-inner"><div><h2 id="closing-title">Tu próxima etapa merece preparación.</h2><p>Encuentra el conocimiento que acompaña el crecimiento de tu empresa.</p></div><a class="button button-light" href="#catalogo">Elegir mi curso <span aria-hidden="true">↑</span></a></div></section>
</main>
<footer class="site-footer"><div class="shell"><div class="footer-top">${brand}<nav class="footer-nav" aria-label="Pie de página"><a href="#catalogo">Cursos</a><a href="https://best-carriers.com/servicios/">Servicios</a><a href="#paquetes">Paquetes</a><a href="${contact}" target="_blank" rel="noopener">Contacto ↗</a></nav></div><div class="footer-bottom"><p>© <span data-current-year>2026</span> Best Carriers. Todos los derechos reservados.</p><div class="footer-legal"><a href="https://best-carriers.com/terminos-y-condiciones/">Términos y condiciones</a><a href="https://best-carriers.com/politica-de-privacidad/">Privacidad</a></div></div></div></footer>
<script>${js}</script>
</body></html>`;
  const entry = 'pages/cursos/index.html';
  await mkdir(path.join(root,'pages/cursos'),{recursive:true});
  await writeFile(path.join(root,entry),html);
  return { files:[path.join(root,entry)],pages:[{id:'course-catalog-es',title:'Cursos de trucking en español',route:'cursos',entry,language:'es',translation_key:'course-catalog',components:['best-carriers-course-catalog-es','best-carriers-social-proof-es']}],globalContent:{'best-carriers-course-catalog-es':{version:'1',type:'course_catalog',source:'course_catalog',category:'cursos',language:'es',entries:content.entries}} };
}
