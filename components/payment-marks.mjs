import { readFile } from "node:fs/promises";
import path from "node:path";

const marks = [
  ["visa", "Visa"], ["mastercard", "Mastercard"], ["amex", "American Express"],
  ["apple-pay", "Apple Pay"], ["link", "Link"], ["cash-app", "Cash App"],
  ["klarna", "Klarna"], ["afterpay", "Afterpay"], ["amazon-pay", "Amazon Pay"]
];

export async function renderPaymentMarks(root) {
  const items = await Promise.all(marks.map(async ([id, label]) => {
    let svg = await readFile(path.join(root, "components/payment-icons", `${id}.svg`), "utf8");
    svg = svg.replace(/<\?xml[\s\S]*?\?>/g, "").replace(/<title>[\s\S]*?<\/title>/g, "").replace(/ role="img"/g, "");
    svg = svg.replace(/<svg\b/, '<svg aria-hidden="true" focusable="false"');
    // Prefix internal references so multiple inline marks never share a clip ID.
    svg = svg.replace(/id="([^"]+)"/g, `id="payment-${id}-$1"`).replace(/url\(#([^)]+)\)/g, `url(#payment-${id}-$1)`);
    return `<span class="payment-logo payment-logo--${id}" role="img" aria-label="${label}">${svg}${id === "cash-app" ? '<span aria-hidden="true">Cash App</span>' : ""}</span>`;
  }));
  return `<div class="payment-logos" aria-label="Métodos de pago">${items.join("")}</div>`;
}

export const whatsappMark = '<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20.5 11.7a8.5 8.5 0 0 1-12.6 7.5L3 20.5l1.3-4.7A8.5 8.5 0 1 1 20.5 11.7Z"/><path d="M8 7.8c.4-.7.8-.7 1.2-.6.3 0 .5.2.7.6l.8 1.7c.1.3.1.6-.1.8l-.6.7c-.2.3-.1.5 0 .8.8 1.4 1.8 2.3 3.1 3 .3.2.6.2.8-.1l.8-.9c.3-.3.6-.3.9-.2l1.8.9c.4.2.5.5.4.9-.2 1.1-1 2-2.1 2.3-1.4.3-3.4-.4-5.4-2.2-1.8-1.6-2.9-3.5-3.2-4.9-.2-1 .2-2.1.9-2.8Z"/></svg>';
