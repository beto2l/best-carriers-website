# Best Carriers Website

Source repository for high-performance LuxWrap pages mounted inside the existing WordPress site at [best-carriers.com](https://best-carriers.com/).

## Managed pages

| WordPress Page | Public route | Language | Permanent LuxWrap ID |
| --- | --- | --- | --- |
| Servicios de Trucking | `/servicios/` | Spanish | `trucking-services-es` |
| Trucking Services | `/services/` | English | `trucking-services-en` |
| Curso grabado de FMCSA MOTUS | `/cursos/motus/` | Spanish | `motus-course-es` |
| Recorded FMCSA MOTUS Course | `/en/courses/motus/` | English | `motus-course-en` |
| Gracias por comprar el curso MOTUS | `/cursos/motus/gracias/` | Spanish | `motus-thank-you-es` |
| Thank you for purchasing the MOTUS course | `/en/courses/motus/thank-you/` | English | `motus-thank-you-en` |

All other routes remain controlled by WordPress and Divi. After publication, both managed routes appear as native entries under WordPress **Pages** with the `LuxWrap Studio` state and can be used in menus and taxonomies. The public design remains repository-managed.

## Content editing

- `content/site.json`: brand, routes, labels, SEO metadata, WhatsApp and CDN hero image.
- `content/services.json`: canonical bilingual service catalog.
- `content/motus.json`: bilingual MOTUS sales, FAQ, social-proof fallback and post-purchase content.
- `src/services.css`: visual system and responsive layout, embedded into each built page.
- `src/services.js`: search, category filters, JSON loading and accessible service dialog, embedded into each built page.
- `src/motus.css`: premium course-sales and thank-you visual system.
- `src/motus.js`: progressive video playback, FAQ behavior and non-sensitive UI enhancements.
- `design/best-carriers-services-hero.webp`: retained design source. Public HTML uses the copy already uploaded through the authorized Best Carriers CDN client.
- `design/motus-recorded-course.webp`: source artwork for the recorded MOTUS offer. Production pages use the offloaded Best Carriers CDN URL declared in `content/motus.json`.

The service cards are rendered into HTML during the build for SEO and a no-JavaScript fallback. Critical CSS and JavaScript are embedded because this WordPress host routes virtual `.css` and `.js` paths before WordPress. The embedded JavaScript fetches the localized JSON file to enhance search, filtering and the details dialog without reloading the page.

MOTUS uses LuxWrap Release Contract 5. Its repository HTML contains safe bilingual fallbacks while the allowlisted `social_proof`, `checkout` and `payment_result` components are rendered by WordPress. Reviews Hub remains the owner of reviews and group photos; Funnel remains the owner of price, Stripe, purchase intent, verified conversions and fulfillment. The repository owns presentation only.

## Local build and validation

Requires Node.js 18 or newer and no third-party packages.

```bash
npm test
python3 -m http.server 8765 --directory pages
```

Preview `http://127.0.0.1:8765/servicios/` and `http://127.0.0.1:8765/services/`.

`npm run build` recreates both page directories and writes all SHA-256 checksums to `lw-release.json`. Do not hand-edit generated files.

## Publication

1. Increase `package.json` version.
2. Run `npm test` and review the diff.
3. Commit and push `main`.
4. From the Best Carriers WordPress dashboard, open **OPIN X > LuxWrap Studio**.
5. Select **Review update** and confirm the exact commit, page changes and absence of route conflicts.
6. Select **Publish reviewed version**.
7. Verify both routes, WordPress Page records, the WhatsApp destination and the CDN asset.

The requirements shown in the initial release are intentionally provisional. They must be replaced only after the owner supplies and approves the exact document requirements for each service.
