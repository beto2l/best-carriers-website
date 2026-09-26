# Best Carriers e-book catalog

The bilingual catalog is published at `/ebooks/` and `/en/e-books/`. The Spanish release adopts existing WordPress Page 925 and preserves its child product pages. Both catalog entries share `translation_key: ebook-catalog`; their permanent IDs are `ebook-catalog-es` and `ebook-catalog-en`. The different English slug avoids a native WordPress route collision after Polylang removes the language prefix.

## Content and product boundaries

`content/ebooks.json` owns editorial copy and catalog entries. The original PDFs supplied by the owner establish the current metadata: the glossary has 25 pages, the IFTA + IRP handbook has 138 pages, and both files are in Spanish. English navigation translates the catalog; it does not promise translated books. Product links lead to the existing Spanish pages and do not introduce checkout or delivery logic. PDF editorial corrections remain outside this release.

The two original cover renders were uploaded through the site's media/CDN integration (attachments 1634 and 1635). Public HTML uses the resulting authorized `bc.opin-x.com` URLs. Do not replace them with guessed CDN destinations.

## Adding a title

1. Add a record to `books` with a stable `id`, `status`, `order`, topic `category`, verified page count, format and file/product-page language. Set `status: draft` while it is unfinished.
2. Upload its cover through the authorized WordPress CDN workflow. Record the returned URL and dimensions; add Spanish and English alt text.
3. Supply both localized title, topic, summary, audience and contents. Use the actual product URL.
4. Set `status: published` when ready. The build inserts published records in both cards and table and updates item counts and structured data. Search and topic filters appear automatically above four published titles.
5. For a book in a new language, extend the generator's explicit language validation and localized language labels before publishing; do not relabel an English file as Spanish.
6. Increase the release version, run `FULL_RELEASE=1 npm test`, and use the normal LuxWrap review/publication flow.

## Community and mobile behavior

The lower section reuses the existing testimonial video and the allowlisted `best-carriers-social-proof-es/en` components. Reviews Hub supplies the rating, comments, participant photos and incremental loading. Copy identifies these as brand-wide course/service experiences. No mixed rating is attached to a Book schema. Future e-book reviews should be tagged and moderated in Reviews Hub before adding a product-specific section.

Cards stack on small screens. Table mode becomes labeled rows at 800px to avoid horizontal scrolling. The shared header keeps navigation and language links visible on mobile. Details use native disclosures; cards, product links and FAQ content remain available without JavaScript. View selection is reflected in `?view=table` and carried across language changes.

## Release checks

The build verifies required product fields, destinations and CDN hosts. The release checker validates both locale routes, all file checksums, permanent identities, crawlable product links, honest file-language labels, shared navigation, brand-wide social proof and the absence of invented prices/product ratings.

After publishing, verify exact commit/version, preservation of Page 925 and product Pages 1371/927, English translation pairing, public HTTP output, CDN cover responses and runtime review/photo rendering. Browser checks at desktop and mobile widths must be recorded separately from server/markup checks.
