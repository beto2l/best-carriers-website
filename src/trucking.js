(() => {
  document.querySelectorAll('[data-current-year]').forEach(el => { el.textContent = new Date().getFullYear(); });
  const play = document.querySelector('[data-instructor-play]');
  play?.addEventListener('click', () => {
    const frame = document.createElement('iframe');
    frame.src = 'https://www.youtube-nocookie.com/embed/icLfupSYr_4?autoplay=1&rel=0';
    frame.title = play.getAttribute('aria-label');
    frame.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
    frame.allowFullscreen = true;
    frame.referrerPolicy = 'strict-origin-when-cross-origin';
    const host = play.closest('.video-frame');
    host.replaceChildren(frame);
    frame.focus();
  });
  const sticky = document.querySelector('.mobile-register');
  const hero = document.querySelector('.hero');
  if (sticky && hero && 'IntersectionObserver' in window) {
    new IntersectionObserver(([entry]) => {
      const visible = !entry.isIntersecting && entry.boundingClientRect.bottom < 0;
      sticky.classList.toggle('visible', visible);
      sticky.setAttribute('aria-hidden', String(!visible));
      sticky.tabIndex = visible ? 0 : -1;
    }).observe(hero);
  }
  // Keep registration wording honest after this specific scheduled session.
  const event = document.querySelector('[data-event-end]');
  function refreshEvent() {
    if (!event) return;
    const now = Date.now();
    const ended = now >= Date.parse(event.dataset.eventEnd);
    const live = !ended && now >= Date.parse(event.dataset.eventStart);
    document.querySelectorAll('[data-event-status]').forEach(el => { el.textContent = ended ? event.dataset.endedMessage : live ? event.dataset.liveMessage : ''; });
    if (ended) document.querySelectorAll('[data-register-label]').forEach(el => { el.textContent = el.dataset.short !== undefined ? event.dataset.endedShort : event.dataset.endedCta; });
  }
  refreshEvent();
  setInterval(refreshEvent, 60000);
})();
