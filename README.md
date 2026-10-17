# Shopora — Expanded Flipkart-style marketplace starter

An original Shopora-branded marketplace UI inspired by common large e-commerce shopping patterns. This is a substantial frontend/demo expansion of the existing starter, not a copy of Flipkart's proprietary code, content, or branding.

## Included frontend workflows

- Responsive storefront, category shortcut strip, promotional hero and deal section.
- Sample catalogue across Electronics, Fashion, Home, Lifestyle, Beauty and Toys.
- Product search across product name, brand, category and description.
- Category filters, deal-only filter, maximum-price slider, minimum-rating filter, sorting by recommendation/price/rating/discount.
- Product details, sample specifications, seller information, delivery PIN check, offers, review form and return-window information.
- Wishlist, recently viewed products, side-by-side comparison (up to four items).
- Shopping bag with quantity controls, stock limit, subtotal, delivery calculation and demo coupon codes `SHOPORA10` and `SAVE200`.
- Checkout form, address fields, sample payment method selection, Cash on Delivery demo order flow.
- Browser-local order history, order event history, cancellation request, return request and notifications.
- Local demo profile, help centre and support request form.
- Demo catalogue admin: add and remove products.
- Browser `localStorage` persistence for demo products, cart, wishlist, comparison, profile, orders and other local state.
- Responsive layout and Shopora branding retained with blue/yellow/orange retail styling.

## Run locally

1. Install Node.js 20+.
2. Run `npm install`.
3. Copy `.env.example` to `.env` if using Supabase and configure the public project URL/anon key.
4. Run `npm run dev`.
5. Run `npm run build` to check a production bundle.

## Important: demo versus production

This package does **not** provide complete feature parity with Flipkart and is **not ready to accept real customer orders**. The current environment could not install dependencies, so a production build has not been verified here.

The following still require real service integrations, backend implementation, security review, configuration and end-to-end testing:

- Secure customer authentication, OTP, Google sign-in, account recovery and multi-device sync.
- Server-side product/catalogue management, seller onboarding, moderation, inventory reservations and pricing validation.
- Live payment gateway (UPI/card/wallet), payment verification, refunds, settlements and fraud controls.
- Shipping/courier APIs, live serviceability, shipping labels, real tracking, delivery notifications and reverse pickup.
- Production coupons, campaign rules, loyalty/rewards, gift cards, EMI, exchange/buyback and bank offers.
- Email/SMS/push notifications, newsletter delivery, customer support ticket delivery and analytics.
- GST invoices, seller commissions, payout reconciliation, legal policies, privacy/security controls, audit logs and operational monitoring.
- Production database policies, rate limits, server-side validation, backups, error monitoring, accessibility and load testing.

All catalogue entries, ratings, reviews, discounts, delivery estimates and seller labels included here are **sample demo content**. PIN-check results are estimates for the demo only. Coupon discounts are frontend demo rules. Demo order/return/cancellation/support actions do not contact a courier, payment provider, warehouse or support team. Local browser storage is not secure account storage.

## Supabase notes

The existing `supabase/schema.sql` and optional client scaffold are starting points only. Review and complete the schema, row-level security, user roles and server-side checkout/order functions before using a configured backend. Never place service-role keys or payment secrets in frontend variables.

## Vercel

Import this folder as a Vite project and configure the required environment variables. A successful frontend deployment would **not** activate live payments, shipping, authentication or fulfilment. No deployment was performed or verified as part of this update.

## Bharat-first shopping features (demo)

- **Voice search:** Microphone button beside search with Hindi (`hi-IN`), Marathi (`mr-IN`) and Indian English/Hinglish (`en-IN`) recognition choices. Example: “500 ke andar wala kurta dikhao” filters the sample catalogue to fashion products up to ₹500. Uses browser Speech Recognition; browser/device language support and microphone permission are required.
- **10-second voice reviews:** On a product page, open Reviews and record a short audio review. The recorder stops automatically after 10 seconds; the user can stop earlier, listen, and save it to the current page session. Audio is not uploaded and object URLs are not durable across reloads.
- **Product video / UGC preview:** Product pages include a video panel where a demo operator can select a local video (up to 80 MB) to preview it. The video remains local to the browser session and is not shared with other shoppers.
- **Local apparel examples:** Added sample cotton kurta, ethnic kurta set and saree items so the budget + apparel voice-search example can be tried.

### Production work still required

These are browser-side prototypes, not a live marketplace service. For production, connect speech/text intent processing with multilingual fallbacks; persist voice reviews in managed object storage with user consent, moderation and report/delete controls; host product videos in secure storage/CDN with transcoding, captions, accessibility, consent and moderation; and connect product records, seller permissions, review verification and inventory to the backend. Speech Recognition availability differs by browser and may use the browser vendor's speech service; do not treat it as offline/private by default.

## Shopora HoloView (Bharat-first product showcase)
Every product detail page now automatically includes a HoloView panel with 3D-style, Hologram, and AR-style preview modes, rotation slider, rotate button, and a floating neon product visualization based on the product's catalogue emoji. This also appears automatically for products added through the demo admin catalogue; no per-product setup is required. It is a visual interaction layer, not an automatically generated accurate 3D model. For faithful product geometry and real AR, add approved GLB/GLTF assets and a production AR/viewer integration. The AR button currently demonstrates the concept and does not access the camera or place a model in the real world.
