(() => {
  document.querySelectorAll('[data-current-year]').forEach(el => { el.textContent = new Date().getFullYear(); });
  const catalog = document.querySelector('[data-catalog]');
  if (!catalog) return;
  const cards = [...catalog.querySelectorAll('.course-card')];
  const items = [...catalog.querySelectorAll('[data-course-item]')];
  const controls = catalog.querySelector('[data-catalog-controls]');
  const search = catalog.querySelector('[data-course-search]');
  const status = catalog.querySelector('[data-course-count]');
  const empty = catalog.querySelector('[data-catalog-empty]');
  const normalize = value => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  let mode = 'all';
  let view = 'cards';
  const matches = new Map(cards.map(card => [card.dataset.courseId, normalize(card.querySelector('.course-copy').textContent)]));
  function update() {
    const query = normalize(search.value.trim());
    const visible = new Set(cards.filter(card => (mode === 'all' || card.dataset.mode === mode) && matches.get(card.dataset.courseId).includes(query)).map(card => card.dataset.courseId));
    items.forEach(item => { item.hidden = !visible.has(item.dataset.courseId); });
    catalog.querySelectorAll('[data-course-view]').forEach(el => { el.hidden = el.dataset.courseView !== view; });
    status.textContent = `${visible.size} ${visible.size === 1 ? 'curso' : 'cursos'}${mode !== 'all' || query ? (visible.size === 1 ? ' encontrado' : ' encontrados') : ' para tu próxima etapa'}`;
    empty.hidden = visible.size > 0;
  }
  if (cards.length) {
    controls.hidden = false;
    search.addEventListener('input', update);
    catalog.querySelectorAll('[data-mode-filter]').forEach(button => button.addEventListener('click', () => {
      mode = button.dataset.modeFilter;
      catalog.querySelectorAll('[data-mode-filter]').forEach(el => el.setAttribute('aria-pressed', String(el === button)));
      update();
    }));
    catalog.querySelectorAll('[data-view-button]').forEach(button => button.addEventListener('click', () => {
      view = button.dataset.viewButton;
      catalog.querySelectorAll('[data-view-button]').forEach(el => el.setAttribute('aria-pressed', String(el === button)));
      update();
    }));
    catalog.querySelector('[data-reset-filters]').addEventListener('click', () => {
      search.value = ''; mode = 'all';
      catalog.querySelectorAll('[data-mode-filter]').forEach(el => el.setAttribute('aria-pressed', String(el.dataset.modeFilter === 'all')));
      update(); search.focus();
    });
    update();
  }
  const videoButton = document.querySelector('[data-testimonial-play]');
  videoButton?.addEventListener('click', () => {
    const frame = document.createElement('iframe');
    frame.src = 'https://www.youtube-nocookie.com/embed/LJ9DsCbuMXw?autoplay=1&rel=0';
    frame.title = 'Experiencias de alumnos de Best Carriers';
    frame.allow = 'autoplay; encrypted-media; picture-in-picture';
    frame.allowFullscreen = true;
    const shell = videoButton.closest('.video-frame');
    shell.replaceChildren(frame);
    frame.focus();
  });
})();
