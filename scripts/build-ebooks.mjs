import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { courseSocialProof } from '../components/course-social-proof.mjs';
import { renderSiteNavigation } from '../components/site-navigation.mjs';

const escape = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const json = value => JSON.stringify(value).replaceAll('<','\\u003c');
const icons = {
  grid:'<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
  list:'<path d="M3 5h18M3 12h18M3 19h18M8 3v18"/>',
  arrow:'<path d="M5 12h14m-6-6 6 6-6 6"/>',
  book:'<path d="M12 5v15M12 5C9 3 5 3 2 4v14c3-1 7-1 10 2 3-3 7-3 10-2V4c-3-1-7-1-10 1Z"/>',
  compass:'<circle cx="12" cy="12" r="9"/><path d="m16 8-2 6-6 2 2-6z"/>',
  library:'<path d="M4 3v18M9 3v18M14 3v18M18 3l4 18"/>'
};
const icon = name => `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true">${icons[name]}</svg>`;
const lines = text => escape(text).replaceAll('\n','<br>');

export async function buildEbooks({root,site,version}) {
  const content=JSON.parse(await readFile(path.join(root,'content/ebooks.json'),'utf8'));
  const books=content.books.filter(book=>book.status==='published').sort((a,b)=>a.order-b.order);
  if(!books.length) throw new Error('The e-book catalog needs at least one published book.');
  const ids=new Set();
  for(const book of books){
    if(!/^[a-z0-9-]+$/.test(book.id)||ids.has(book.id))throw new Error('Invalid or duplicate e-book id');
    ids.add(book.id);
    if(!['bc.opin-x.com','c.opin-x.com'].includes(new URL(book.image.url).hostname))throw new Error('E-book covers must use the authorized CDN');
    if(new URL(book.url).hostname!=='best-carriers.com'||book.fileLanguage!=='es'||book.pageLanguage!=='es')throw new Error('Review the new product language and destination contract before publishing');
    if(!Number.isInteger(book.pages)||book.pages<1)throw new Error('E-book page count is required');
    for(const lang of ['es','en'])for(const field of ['title','topic','summary','audience','imageAlt','contents'])if(!book[lang]?.[field]?.length)throw new Error(`${book.id}: missing ${lang}.${field}`);
  }
  const proof=await courseSocialProof(root);
  const css=[await readFile(path.join(root,'src/ebooks.css'),'utf8'),await readFile(path.join(root,'src/site-navigation.css'),'utf8'),proof.css].join('\n').replaceAll('</style','<\\/style');
  const js=[await readFile(path.join(root,'src/ebooks.js'),'utf8'),proof.js].join('\n').replaceAll('</script','<\\/script');
  const files=[],pages=[];
  for(const locale of ['es','en']){
    const t=content.locales[locale],canonical=content.routes[locale],route=new URL(canonical).pathname.replace(/^\/+|\/+$/g,'');
    const entry=`pages/${route}/index.html`;
    const brand=`<a class="brand" href="https://best-carriers.com/" aria-label="Best Carriers · ${escape(t.home)}"><img src="${escape(site.logo)}" alt="" width="45" height="45" decoding="async"><span><strong>Best Carriers</strong><small>${escape(t.tagline)}</small></span></a>`;
    const cover=(book,hero=false)=>`<span class="book-object"><img src="${escape(book.image.url)}" alt="${escape(book[locale].imageAlt)}" width="${book.image.width}" height="${book.image.height}" decoding="async" ${hero?'fetchpriority="high"':'loading="lazy"'}></span>`;
    const specs=book=>`<span>${escape(book.format)}</span><span>${book.pages} ${escape(t.pages)}</span><span>${escape(t.spanish)}</span>`;
    const productLink=book=>`<a class="ebook-link" href="${escape(book.url)}" hreflang="${book.pageLanguage}"><span>${escape(t.bookLink)}</span>${icon('arrow')}</a>${t.productLanguage?`<p class="product-language">${escape(t.productLanguage)}</p>`:''}`;
    const cards=books.map(book=>{const b=book[locale];return `<article class="ebook-card" id="libro-${book.id}" data-ebook-card data-ebook-id="${book.id}" data-category="${book.category}"><a class="ebook-stage ebook-stage--${book.category}" href="${escape(book.url)}" hreflang="es" aria-label="${escape(b.title)}">${cover(book)}</a><div class="ebook-copy"><p class="ebook-topic">${escape(b.topic)}</p><h3><a href="${escape(book.url)}" hreflang="es">${escape(b.title)}</a></h3><p class="ebook-summary">${escape(b.summary)}</p><div class="ebook-specs">${specs(book)}</div><details class="ebook-contents"><summary>${escape(t.contents)}<span class="sr-only">: ${escape(b.title)}</span></summary><ul>${b.contents.map(text=>`<li>${escape(text)}</li>`).join('')}</ul></details>${productLink(book)}</div></article>`;}).join('\n');
    const rows=books.map(book=>{const b=book[locale];return `<tr data-ebook-row data-ebook-id="${book.id}"><th scope="row"><a class="table-book" href="${escape(book.url)}" hreflang="es"><img src="${escape(book.image.url)}" alt="" width="46" height="60" loading="lazy" decoding="async"><span>${escape(b.title)}<small>${escape(b.topic)}</small></span></a></th><td data-label="${escape(t.tableAudience)}">${escape(b.audience)}</td><td data-label="${escape(t.tableFile)}"><span>${escape(book.format)} · ${book.pages} ${escape(t.pages)}</span><span>${escape(t.spanish)}</span></td><td>${productLink(book)}</td></tr>`;}).join('\n');
    const schema={'@context':'https://schema.org','@graph':[
      {'@type':'CollectionPage','@id':canonical+'#webpage',url:canonical,name:t.title,description:t.description,inLanguage:locale==='es'?'es-US':'en-US',publisher:{'@type':'Organization',name:'Best Carriers',url:'https://best-carriers.com/'},mainEntity:{'@id':canonical+'#collection'}},
      {'@type':'ItemList','@id':canonical+'#collection',numberOfItems:books.length,itemListElement:books.map((book,i)=>({'@type':'ListItem',position:i+1,item:{'@type':'Book',name:book.es.title,...(locale==='en'?{alternateName:book.en.title}:{}),url:book.url,image:book.image.url,description:book[locale].summary,inLanguage:book.fileLanguage,bookFormat:'https://schema.org/EBook',numberOfPages:book.pages,publisher:{'@type':'Organization',name:'OPIN X LLC'}}}))},
      {'@type':'BreadcrumbList',itemListElement:[{'@type':'ListItem',position:1,name:t.home,item:'https://best-carriers.com/'},{'@type':'ListItem',position:2,name:'E-books',item:canonical}]}
    ]};
    const html=`<!doctype html>
<html lang="${locale}-US" class="no-js">
<head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${escape(t.title)}</title><meta name="description" content="${escape(t.description)}"><meta name="robots" content="index,follow,max-image-preview:large"><meta name="theme-color" content="#071522">
<link rel="canonical" href="${canonical}"><link rel="alternate" hreflang="es" href="${content.routes.es}"><link rel="alternate" hreflang="en" href="${content.routes.en}"><link rel="alternate" hreflang="x-default" href="${content.routes.es}"><link rel="icon" href="${escape(site.logo)}"><link rel="preconnect" href="https://bc.opin-x.com"><link rel="preconnect" href="https://c.opin-x.com">
<meta property="og:type" content="website"><meta property="og:locale" content="${locale}_US"><meta property="og:title" content="${escape(t.title)}"><meta property="og:description" content="${escape(t.description)}"><meta property="og:url" content="${canonical}"><meta property="og:image" content="${escape(books[0].image.url)}"><meta name="twitter:card" content="summary_large_image">
<style>${css}</style><script>document.documentElement.classList.replace('no-js','js');</script><script type="application/ld+json">${json(schema)}</script>
</head>
<body data-page="ebook-catalog" data-locale="${locale}" data-release="${version}">
<a class="skip-link" href="#catalogo">${escape(t.skip)}</a>
<header class="site-header"><div class="shell header-inner">${brand}${renderSiteNavigation({locale,current:'ebooks'})}<nav class="header-actions" aria-label="${escape(t.languageLabel)}"><a href="${content.routes.es}" hreflang="es" lang="es" data-language-link${locale==='es'?' aria-current="page"':''} aria-label="Español">ES</a><a href="${content.routes.en}" hreflang="en" lang="en" data-language-link${locale==='en'?' aria-current="page"':''} aria-label="English">EN</a></nav></div></header>
<main>
<section class="hero" aria-labelledby="hero-title"><div class="shell hero-layout"><div class="hero-copy"><p class="eyebrow">${escape(t.eyebrow)}</p><h1 id="hero-title">${escape(t.headline)}<br><em>${escape(t.accent)}</em></h1><p class="hero-description">${escape(t.intro)}</p><div class="hero-actions"><a class="button button-light" href="#catalogo">${escape(t.explore)} <span aria-hidden="true">↓</span></a><a class="text-link" href="#experiencias">${escape(t.experiences)} <span aria-hidden="true">↗</span></a></div><p class="hero-note">${escape(t.heroNote)}</p></div><div class="hero-books">${books.slice(0,2).map(book=>`<a class="book-object" href="#libro-${book.id}" data-select-book aria-label="${escape(book[locale].title)}"><img src="${escape(book.image.url)}" alt="${escape(book[locale].imageAlt)}" width="${book.image.width}" height="${book.image.height}" decoding="async" fetchpriority="high"></a>`).join('')}</div></div></section>
<div class="promise-band"><div class="shell promise-items">${t.trust.map((text,i)=>`<span>${icon(['book','compass','library'][i])}${escape(text)}</span>`).join('')}</div></div>
<section class="section" id="catalogo" data-ebook-catalog aria-labelledby="catalog-title"><div class="shell"><div class="section-heading"><div><p class="eyebrow">${escape(t.collectionEyebrow)}</p><h2 id="catalog-title">${escape(t.collectionTitle)}</h2><p class="section-description">${escape(t.collectionBody)}</p></div><div class="view-switch" data-view-controls role="group" aria-label="${escape(t.viewLabel)}" hidden><button type="button" data-view-button="cards" aria-pressed="true">${icon('grid')}${escape(t.cards)}</button><button type="button" data-view-button="table" aria-pressed="false">${icon('list')}${escape(t.table)}</button></div></div>
${books.length>4?`<div class="catalog-search" data-search-controls hidden><label class="sr-only" for="ebook-search">${escape(t.search)}</label><input id="ebook-search" type="search" data-ebook-search placeholder="${escape(t.searchPlaceholder)}" autocomplete="off"><label class="sr-only" for="ebook-category">${escape(t.topic||t.all)}</label><select id="ebook-category" data-ebook-category><option value="all">${escape(t.all)}</option>${[...new Map(books.map(b=>[b.category,b[locale].topic]))].map(([id,label])=>`<option value="${escape(id)}">${escape(label)}</option>`).join('')}</select></div>`:''}
<div class="catalog-meta"><span data-ebook-count data-singular="${escape(t.countSingular)}" data-plural="${escape(t.countPlural)}" role="status" aria-live="polite">${books.length} ${escape(books.length===1?t.countSingular:t.countPlural)}</span><small>${escape(t.fileNote)}</small></div>
<div class="ebook-grid${books.length>2?' ebook-grid--many':''}" data-ebook-view="cards">${cards}</div>
<div class="ebook-table-wrap" data-ebook-view="table" hidden><table class="ebook-table"><caption class="sr-only">${escape(t.collectionTitle)}</caption><thead><tr><th scope="col">${escape(t.tableBook)}</th><th scope="col">${escape(t.tableAudience)}</th><th scope="col">${escape(t.tableFile)}</th><th scope="col">${escape(t.tableDetails)}</th></tr></thead><tbody>${rows}</tbody></table></div>
<div class="catalog-empty" data-ebook-empty hidden><p>${escape(t.empty)}</p><button class="button" type="button" data-reset-search>${escape(t.reset)}</button></div></div></section>
<section class="choose" aria-labelledby="choose-title"><div class="shell choose-layout"><div><p class="eyebrow">${escape(t.chooseEyebrow)}</p><h2 id="choose-title">${escape(t.chooseTitle)}</h2><p class="choose-description">${escape(t.chooseIntro)}</p></div><div class="choose-links"><a href="#libro-glosario" data-select-book>${escape(t.chooseGlossary)}${icon('arrow')}</a><a href="#libro-ifta-irp-handbook" data-select-book>${escape(t.chooseHandbook)}${icon('arrow')}</a></div></div></section>
<section class="section proof" id="experiencias" aria-labelledby="proof-title"><div class="shell"><div class="proof-head"><p class="eyebrow">${escape(t.proofEyebrow)}</p><h2 id="proof-title">${lines(t.proofTitle)}</h2><p>${escape(t.proofBody)}</p></div><div class="video-feature"><div class="video-frame"><img class="video-poster" src="${escape(content.testimonialsPoster)}" alt="${escape(t.videoCaption)}" width="450" height="291" loading="lazy" decoding="async"><button type="button" data-testimonial-play aria-label="${escape(t.videoAria)}"><span class="play-circle" aria-hidden="true">▶</span><span>${escape(t.videoPlay)}</span></button></div><div class="video-copy"><p class="eyebrow">${escape(t.videoEyebrow)}</p><h3>${escape(t.videoTitle)}</h3><p>${escape(t.videoBody)}</p><small>${escape(t.videoCaption)}</small><noscript><p><a href="https://www.youtube.com/watch?v=${content.testimonialsVideo}">${escape(t.videoPlay)} ↗</a></p></noscript></div></div><p class="proof-scope">${escape(t.proofScope)}</p><div class="catalog-proof"><opinx-component data-opinx-global-content="best-carriers-social-proof-${locale}"><p><a class="text-link" href="https://best-carriers.com/cursos/#experiencias">${escape(t.proofFallback)} ↗</a></p></opinx-component></div></div></section>
<section class="section" aria-labelledby="faq-title"><div class="shell faq-layout"><div><p class="eyebrow">${escape(t.faqEyebrow)}</p><h2 id="faq-title">${lines(t.faqTitle)}</h2></div><div class="faq-list">${t.faqs.map(faq=>`<details><summary>${escape(faq.question)}</summary><p>${escape(faq.answer)}</p></details>`).join('')}</div></div></section>
<section class="closing" aria-labelledby="closing-title"><div class="shell closing-inner"><div><h2 id="closing-title">${escape(t.closing)}</h2><p>${escape(t.closingBody)}</p></div><a class="button button-light" href="#catalogo">${escape(t.back)} <span aria-hidden="true">↑</span></a></div></section>
</main>
<footer class="site-footer"><div class="shell"><div class="footer-top">${brand}<nav class="footer-nav" aria-label="${locale==='es'?'Pie de página':'Footer'}"><a href="${locale==='es'?'/servicios/':'/services/'}">${locale==='es'?'Servicios':'Services'}</a><a href="/cursos/">${locale==='es'?'Cursos':'Courses'}</a><a href="#experiencias">${locale==='es'?'Experiencias':'Experiences'}</a><a href="#catalogo">E-books</a></nav></div><p class="footer-description">${escape(t.footer)}</p><div class="footer-bottom"><p>© <span data-current-year>2026</span> Best Carriers. ${escape(t.rights)}</p><div class="footer-legal"><a href="${locale==='es'?'https://best-carriers.com/terminos-y-condiciones/':'https://best-carriers.com/en/terms-and-conditions/'}">${escape(t.terms)}</a><a href="${locale==='es'?'https://best-carriers.com/politica-de-privacidad/':'https://best-carriers.com/en/privacy-policy/'}">${escape(t.privacy)}</a></div></div></div></footer>
<script>${js}</script></body></html>`;
    await mkdir(path.dirname(path.join(root,entry)),{recursive:true});
    await writeFile(path.join(root,entry),html);
    files.push(path.join(root,entry));
    pages.push({id:`ebook-catalog-${locale}`,title:locale==='es'?'E-books de trucking':'Trucking e-books',route,entry,language:locale,translation_key:'ebook-catalog',components:[`best-carriers-social-proof-${locale}`]});
  }
  return {files,pages,globalContent:{}};
}
