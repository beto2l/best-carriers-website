export const catalogRoutes = {
  services: { es: '/servicios/', en: '/services/' },
  courses: { es: '/cursos/', en: '/en/courses/' },
  ebooks: { es: '/ebooks/', en: '/en/e-books/' }
};

export function renderSiteNavigation({ locale = 'es', current = '', footer = false } = {}) {
  const labels = locale === 'en' ? ['Services', 'Courses', 'E-books'] : ['Servicios', 'Cursos', 'E-books'];
  const aria = footer ? (locale === 'en' ? 'Footer navigation' : 'Navegación del pie de página') : (locale === 'en' ? 'Main navigation' : 'Navegación principal');
  return `<nav class="bc-main-nav" aria-label="${aria}">${Object.entries(catalogRoutes).map(([section, routes], i) => `<a href="${routes[locale]}"${section === current ? ' aria-current="page"' : ''}>${labels[i]}</a>`).join('')}</nav>`;
}
