# Best Carriers payment selector

Route: `/cursos/combo/pay/`. This is a selector for individual products, not a sale of the disabled `combo` product. WordPress Page 1202 is adopted by LW Studio with its existing ID.

Source: `content/payments.json`, `src/payments.css`, `src/payments.js`, `scripts/build-payments.mjs`. Requires LuxWrap Studio 0.9.11 or later. The five declarative checkout components use `activation: on_select`, the canonical Funnel price and the whitelisted Course Catalog schedule. Changing dates or prices in Courses & Sales updates the page without a website release.

The website only selects and styles the official form. Funnel owns validation, contact capture, optional Motus consultation bump, Stripe sessions, signed payment confirmation and each product's existing thank-you/cancellation URL. No checkout is created on selection alone. Forms remain separate when changing products. No customer data is copied into browser storage.

Desktop shows the option list alongside the selected form; mobile shows one step at a time. Existing registration links remain usable without JavaScript or if the public contract is unavailable. Loading errors expose retry and the original registration link.

The original WordPress site icon supplies the truck logo. The payment image is an existing approved CDN asset. Wallet badges reflect the direct Stripe payment configuration checked on 2026-09-24; Stripe determines eligibility for each buyer. Google Pay is not advertised because it was disabled for the applicable direct configuration.
