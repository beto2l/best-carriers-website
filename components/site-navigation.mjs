const routes = {
  es: {
    services: { label: "Servicios", href: "/servicios/" },
    courses: { label: "Cursos", href: "/cursos/" },
    experiences: { label: "Experiencias", href: "/cursos/#experiencias" },
    ebooks: { label: "E-books", href: "/ebooks/" },
    aria: "Navegación principal"
  },
  en: {
    services: { label: "Services", href: "/services/" },
    courses: { label: "Courses", href: "/cursos/" },
    experiences: { label: "Experiences", href: "/cursos/#experiencias" },
    ebooks: { label: "E-books", href: "/en/e-books/" },
    aria: "Main navigation"
  }
};

export function renderSiteNavigation({ locale = "es", current = "" } = {}) {
  const copy = routes[locale] || routes.es;
  const links = [copy.services, copy.courses, copy.experiences, copy.ebooks];
  return `<nav class="main-nav bc-main-nav" aria-label="${copy.aria}">${links.map((link, index) => {
    const section = ["services", "courses", "experiences", "ebooks"][index];
    const href = section === current && section === "courses" ? "#catalogo" : section === current && section === "experiences" ? "#experiencias" : link.href;
    return `<a href="${href}"${section === current ? ' aria-current="page"' : ""}>${link.label}</a>`;
  }).join("")}</nav>`;
}
