(() => {
  const catalog = document.querySelector('[data-ebook-catalog]');
  if (!catalog) return;
  const locale = document.body.dataset.locale || 'es';
  const views = [...catalog.querySelectorAll('[data-ebook-view]')];
  const buttons = [...catalog.querySelectorAll('[data-view-button]')];
  const languageLinks = [...document.querySelectorAll('[data-language-link]')];
  const search = catalog.querySelector('[data-ebook-search]');
  const category = catalog.querySelector('[data-ebook-category]');
  const cards = [...catalog.querySelectorAll('[data-ebook-card]')];
  const rows = [...catalog.querySelectorAll('[data-ebook-row]')];
  const count = catalog.querySelector('[data-ebook-count]');
  const empty = catalog.querySelector('[data-ebook-empty]');
  const normalize = value => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  let view = new URL(window.location.href).searchParams.get('view') === 'table' ? 'table' : 'cards';
  function renderView() {
    views.forEach(element => { element.hidden = element.dataset.ebookView !== view; });
    buttons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.viewButton === view)));
    languageLinks.forEach(link => {
      const url = new URL(link.href);
      view === 'table' ? url.searchParams.set('view', 'table') : url.searchParams.delete('view');
      link.href = url.href;
    });
  }
  function filter() {
    const query = normalize(search?.value.trim() || '');
    const topic = category?.value || 'all';
    const visible = new Set();
    cards.forEach(card => {
      card.hidden = !(normalize(card.textContent).includes(query) && (topic === 'all' || card.dataset.category === topic));
      if (!card.hidden) visible.add(card.dataset.ebookId);
    });
    rows.forEach(row => { row.hidden = !visible.has(row.dataset.ebookId); });
    count.textContent = `${visible.size} ${visible.size === 1 ? count.dataset.singular : count.dataset.plural}`;
    empty.hidden = visible.size !== 0;
  }
  catalog.querySelector('[data-view-controls]').hidden = false;
  catalog.querySelector('[data-search-controls]')?.removeAttribute('hidden');
  buttons.forEach(button => button.addEventListener('click', () => {
    view = button.dataset.viewButton;
    const url = new URL(window.location.href);
    view === 'table' ? url.searchParams.set('view', view) : url.searchParams.delete('view');
    window.history.replaceState(null, '', url);
    renderView();
  }));
  search?.addEventListener('input', filter);
  category?.addEventListener('change', filter);
  catalog.querySelector('[data-reset-search]')?.addEventListener('click', () => { if(search) search.value=''; if(category) category.value='all'; filter(); search?.focus(); });
  document.querySelectorAll('[data-select-book]').forEach(link => link.addEventListener('click', () => {
    view = 'cards';
    const url = new URL(window.location.href);
    url.searchParams.delete('view');
    window.history.replaceState(null, '', url);
    if(search) search.value=''; if(category) category.value='all';
    filter();renderView();
  }));
  window.addEventListener('popstate', () => {view=new URL(window.location.href).searchParams.get('view')==='table'?'table':'cards';renderView();});
  document.querySelector('[data-testimonial-play]')?.addEventListener('click', event => {
    const frame = document.createElement('iframe');
    frame.src = 'https://www.youtube-nocookie.com/embed/LJ9DsCbuMXw?autoplay=1&rel=0';
    frame.title = locale === 'es' ? 'Testimonios de participantes de Best Carriers' : 'Best Carriers participant testimonials';
    frame.allow = 'autoplay; encrypted-media; picture-in-picture';
    frame.allowFullscreen = true;
    event.currentTarget.closest('.video-frame').replaceChildren(frame);
    frame.focus();
  });
  document.querySelectorAll('[data-current-year]').forEach(element => {element.textContent=new Date().getFullYear();});
  renderView();
  filter();
})();
