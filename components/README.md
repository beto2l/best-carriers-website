# LW Studio component library

This directory holds small, source-controlled presentation components that can be reused by any LW Studio page in this repository.

- Components receive only public editorial data from `content/`.
- Each component must keep the owning OPIN X module boundary intact: no checkout, review, lead-routing, tracking, or CDN upload logic belongs here.
- Production images must already exist at an authorized OPIN X CDN URL before a component references them.

## `authority-logos.mjs`

Renders the responsive Best Carriers authority rail used by the existing Divi global section **Section Iconos de Autoridad** (ID `1028`). The same individual CDN assets are shown as one row on desktop and a two-column grid on mobile. Provide its localized accessible label and public logo list from the page content; use `renderAuthorityLogos()` from a page generator.

## `site-navigation.mjs`

Renders the shared Spanish/English Best Carriers navigation for Services, Courses, Experiences, and E-books. Use `renderSiteNavigation({ locale, current })` in each site page header and include `src/site-navigation.css` in that page's inline stylesheet. The menu includes a compact, visible mobile layout. Keep the E-books destination at `/ebooks/`; future page builders should reuse this component unless the page is intentionally designed without a site menu.
