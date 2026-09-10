import { createHash } from "node:crypto";
import { access, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const release = JSON.parse(await readFile(path.join(root, "lw-release.json"), "utf8"));
const expectedRoutes = new Set(["servicios", "services"]);
const failures = [];

if (release.contract_version !== 4) failures.push("contract_version must be 4");
if (release.runtime !== "static") failures.push("runtime must be static");
if (release.scope !== "pages") failures.push("scope must be pages");
if (release.pages.length !== 2) failures.push("exactly two Pages are required");

const ids = new Set();
for (const page of release.pages) {
  if (ids.has(page.id)) failures.push(`duplicate Page ID ${page.id}`);
  ids.add(page.id);
  expectedRoutes.delete(page.route);
  if (!release.files_sha256[page.entry]) failures.push(`missing checksum for ${page.entry}`);
  const html = await readFile(path.join(root, page.entry), "utf8");
  const expectedCanonical = `https://best-carriers.com/${page.route}/`;
  for (const required of [
    `rel="canonical" href="${expectedCanonical}"`,
    "hreflang=\"es\"",
    "hreflang=\"en\"",
    "data-services-grid",
    "data-service-dialog",
    "<style>:root",
    "Best Carriers interactive catalog could not load",
    "data-current-year",
    "https://bc.opin-x.com/best-carriers-services-hero.webp",
    "https://wa.me/12192396752?text=Quiero%20un%20servicio%20de%20trucking"
  ]) {
    if (!html.includes(required)) failures.push(`${page.entry} is missing ${required}`);
  }
  if ((html.match(/<article class="service-card" data-service-card/g) || []).length !== 11) failures.push(`${page.entry} must contain 11 static service cards`);
  if (/<script[^>]+src=["']https?:\/\//i.test(html)) failures.push(`${page.entry} loads external JavaScript`);
}

if (expectedRoutes.size) failures.push(`missing routes: ${[...expectedRoutes].join(", ")}`);

for (const [relative, expected] of Object.entries(release.files_sha256)) {
  const absolute = path.join(root, relative);
  await access(absolute);
  const actual = createHash("sha256").update(await readFile(absolute)).digest("hex");
  if (actual !== expected) failures.push(`checksum mismatch: ${relative}`);
}

const releaseFiles = Object.keys(release.files_sha256);
for (const route of ["servicios", "services"]) {
  for (const required of ["index.html", "data/services.json"]) {
    const relative = `pages/${route}/${required}`;
    if (!releaseFiles.includes(relative)) failures.push(`manifest omits ${relative}`);
  }
}

if (failures.length) {
  console.error(failures.map((failure) => `- ${failure}`).join("\n"));
  process.exit(1);
}

console.log(`Validated LuxWrap ${release.version}: ${release.pages.length} native Pages and ${releaseFiles.length} checksummed files.`);
