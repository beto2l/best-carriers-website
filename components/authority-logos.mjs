/**
 * Reusable LW Studio component for the Best Carriers authority logo rail.
 *
 * Assets remain on the authorized Best Carriers CDN.  Page generators pass a
 * translated, descriptive label plus the source list from content; the
 * component never introduces tracking, external embeds, or commercial logic.
 */
function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function renderAuthorityLogos({ label, logos }) {
  if (!Array.isArray(logos) || !logos.length) return "";
  return `<section class="authority-logos" aria-label="${escapeHtml(label)}">
      <div class="motus-shell authority-logos-inner">
        ${logos.map((logo) => `<figure class="authority-logo"><img src="${escapeHtml(logo.url)}" alt="${escapeHtml(logo.alt)}" width="${escapeHtml(logo.width)}" height="${escapeHtml(logo.height)}" loading="lazy" decoding="async"></figure>`).join("\n        ")}
      </div>
    </section>`;
}
