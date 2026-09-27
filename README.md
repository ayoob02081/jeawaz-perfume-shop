# Jeawaz Frontend

Storefront, customer profile and admin panel for Jeawaz, an online perfume and fragrance store selling decants and sealed bottles. The UI is Persian and right-to-left (`lang="fa"`, `dir="rtl"`).

This repository contains only the frontend. It talks to the separate Jeawaz backend (NestJS REST API with Socket.IO) and holds no business authority of its own: pricing, stock, filtering, orders and payments are decided by the backend.

## Tech Stack

| Area | Library |
| --- | --- |
| Framework | Next.js 16 (App Router), React 19 |
| Language | JavaScript (JSX); `jsconfig.json` maps `@/*` to `src/*` |
| Styling | Tailwind CSS 4 (via `@tailwindcss/postcss`), `next-themes` for light/dark |
| Server state | TanStack React Query 5 |
| HTTP | Axios |
| Forms | React Hook Form |
| Carousels | Embla Carousel (product gallery), Swiper (home banners) |
| Realtime | `socket.io-client` (notifications) |
| Other UI | Heroicons, `react-hot-toast`, Recharts (admin dashboard), `react-multi-date-picker` (Persian dates) |

## Requirements

- **Node.js**: the repository does not pin a Node version (no `engines` field or `.nvmrc`). Next.js 16 requires Node 20.9 or later.
- **Package manager**: pnpm. `pnpm-lock.yaml` is the authoritative lockfile; do not add an npm or Yarn lockfile.
- **Backend**: a running Jeawaz backend is required for almost every page, including authentication and product listing.

## Installation

```bash
pnpm install
```

## Environment Variables

Copy `.env.example` to a local env file (for example `.env.development.local`) and adjust it. Real `.env*` files are gitignored; only `.env.example` is tracked.

| Variable | Required | Description |
| --- | --- | --- |
| `NEXT_PUBLIC_API_URL` | Yes | Origin of the backend, with no trailing slash and no path. |

`NEXT_PUBLIC_API_URL` is used for:

- REST calls from the browser (Axios client, sent with credentials),
- server-side auth checks in the Next.js proxy (`/users/me`, `/auth/refresh`),
- the Socket.IO connection,
- resolving uploaded image paths (`/uploads/...`) to absolute URLs.

The backend has no global `/api` prefix, so the value is the bare origin, for example `http://localhost:3001` in development or `https://api.example.com` in production.

`NEXT_PUBLIC_*` values are inlined into the JavaScript bundle at build time and are visible to every browser. Set the production value before `pnpm build`, and never put secrets in them. The frontend requires no secret variables.

## Development

Start the backend first (by default it serves on `http://localhost:3001`), then:

```bash
pnpm dev
```

This runs `next dev --turbopack` on `http://localhost:3000`. The backend's development CORS default allows this origin.

## Production Build

```bash
pnpm build
pnpm start
```

`pnpm build` runs `next build`; `pnpm start` serves the build with `next start`. Because `NEXT_PUBLIC_API_URL` is compiled in, changing the backend origin requires a rebuild.

## Project Structure

```text
src/
  app/
    (user)/          storefront: home, products, product detail, cart/checkout,
                     payment result, auth/login, static pages
    (profile)/       customer area: account, addresses, orders, notifications
    (admin)/         admin panel: dashboard, products (incl. bulk pricing and
                     price history), categories, orders, users, campaigns,
                     coupons, banners, notifications, contact messages
    @modal/          intercepted login route rendered as a modal
    layout.jsx       root layout (RTL, fonts, providers)
    Providers.jsx    React Query, auth, theme, filters and sidebar providers
  components/        shared composite components (layouts, AppImage, price, etc.)
  ui/                low-level UI primitives and React Hook Form field wrappers
  hooks/             React Query hooks per domain (useProducts, useOrders, ...)
  services/          Axios API functions per domain; httpClient.js is the shared client
  contexts/          auth, product filters (reducer), sidebars
  utils/             helpers and pure contract modules (*.mjs) with their tests
  constants/         static options, table headers, order statuses, fonts
  proxy.js           Next.js proxy guarding /profile and /admin
public/              fonts and static images
```

Route-local components live next to their routes in `_components/` folders.

## Architecture and Contracts

### API access

- All backend calls go through `src/services/*`, built on the shared Axios client in `src/services/httpClient.js`. Components use these through React Query hooks in `src/hooks/*`, not ad hoc `fetch` calls.
- The client sends cookies (`withCredentials`) and serializes arrays as repeated query parameters (`volumes=5&volumes=10`).
- On a `401`, the client calls `POST /auth/refresh` once (shared between concurrent requests) and retries the original request.
- Error responses use the backend's common error envelope; `src/utils/showApiError.js` turns them into toasts.

### Authentication

- Authentication uses HTTP-only `accessToken` / `refreshToken` cookies set by the backend. The frontend never reads, stores or sends tokens itself and must not try to.
- `src/proxy.js` protects `/profile/*` and `/admin/*` on the server: it forwards the incoming cookies to `GET /users/me`, refreshes once if needed, passes renewed `Set-Cookie` headers through, redirects unauthenticated users to `/auth/login`, and redirects non-admins away from `/admin`.
- This redirect is a UX gate only. Backend guards are the authorization boundary.
- `AuthContext` holds the current user for client components.

### Product V2 model

- A Product has one or more **ProductVariants**, each with a `type` (`decant` or `sealed`), an integer `volume` in ml and an integer base `price` in toman (IRT). Variants are the only source of sellable type, volume and price.
- Inventory is a single **Product-level pool in ml** (`product.stock`). Both variant types consume `volume × quantity` from it. Variants have no stock of their own, and the frontend must not invent per-variant availability. `product.stock` is a UI hint only; cart and checkout on the backend are authoritative.
- **ProductCard** displays the backend-provided `representativeVariant` (`{ id, type, volume, price }` or `null`). The card's price and its type/volume label (for example "دکانت ۱۰ میل") both come from this one variant, via `getProductCardPresentation` in `src/utils/priceCalculator.js`. An explicit `null` is respected; the frontend never reconstructs the representative.
- The backend currently selects the representative as: 10 ml decant, then 5 ml decant, then the decant closest to 10 ml (smaller volume, then id, on ties), then the smallest sealed variant. When variant filters are active it chooses only among variants that match them. Sort-by-price uses the same variant's base price.
- Campaign and product discounts are applied on top of the selected variant's base price for display. The Product detail page has its own interactive variant selector, which drives the displayed price and the item added to the cart.

### Product filters

- Filter state lives in a reducer (`src/contexts/filters/`). The draft, URL and API mapping is defined in `src/utils/productFilterContract.mjs`: controls edit a draft, **Apply** writes it to the URL, and the URL is parsed into the API query. Direct links and back/forward navigation restore both the draft and the applied filters.
- Query parameters include `fragranceFamilies` and `gender` (category slugs), `brandIds`, `type`, repeated `volumes`, volume and price ranges (integer IRT), `inStock`, `original`, `discounted` and `sort`. `page` and `limit` are normalized once and reused for the request, the React Query key, pagination and prefetch.
- Volume options come from `GET /products/filter-options/volumes`, independent of the current result page.
- Variant filters (type, volume, price) must match the **same** variant. This is enforced by the backend. The frontend does not filter products or variants locally and should not reimplement that logic.

### Categories

The taxonomy has six category types:

| Type | Assignment per product |
| --- | --- |
| `gender` | exactly one |
| `fragrance_family` | zero or more |
| `season` | zero or more |
| `temperature` | zero or one |
| `character` | zero or more |
| `occasion` | zero or more |

Product responses expose these as `categories.{gender, fragranceFamilies, seasons, temperature, characters, occasions}`. Fragrance family replaced the former "accord" type. The admin route for fragrance families is still `/admin/categories/accords` (route naming only), and seasons, temperatures, characters and occasions are managed under `/admin/categories/types/[type]`.

### Uploads and images

- Admin image fields upload through `POST /upload/image` (and delete through `/upload/delete`). The backend stores relative paths such as `/uploads/<file>`.
- `AppImage` resolves `/uploads/...` paths against `NEXT_PUBLIC_API_URL` and renders them unoptimized, so the backend host does not need to be listed in `next.config.mjs` `images.remotePatterns`.

### Cart, checkout and payments

- Checkout creates an Order from the cart through the backend, which revalidates prices and reserves inventory.
- Payment starts with `POST /payments/:orderId`. Only the order id is sent; the backend computes the amount and returns a gateway `paymentUrl`, and the browser redirects to it only if it is an `https:` URL. If payment start fails after the Order exists, the user can retry from the order in their profile (`PayOrderButton`).
- The payment gateway (Zarinpal) returns to the **backend**, which verifies the payment and finalizes the Order. The backend then redirects to `/payment/result?orderId=...&status=...`.
- `/payment/result` loads the Order from the authenticated API and shows its actual state. The `status` query value is only a presentation hint and never produces a success state on its own.
- Payment verification never happens in the browser.

The flow logic lives in `src/utils/paymentFlowContract.mjs` and `src/hooks/usePayment.js`.

### Contact Us and contact messages

- The Contact Us form (`/page/contact-us`, shown on desktop layouts) sends exactly `fullName`, `phoneNumber`, `message` and an always-empty honeypot `website` to `POST /contact-messages` through the shared client. It validates the same limits as the backend (name 2–100 characters, an Iranian mobile number, message 10–2000 characters), never submits natively (no personal data in the URL), prevents duplicate submits, shows the backend success message and clears the fields, and keeps the entered values on any error. Rules live in `src/utils/contactFormContract.mjs`.
- The backend normalizes the phone number, may silently ignore honeypot or repeated identical submissions (the response is the same), and rate-limits submissions per client.
- Admins manage messages under `/admin/contact-messages` (status filters with backend counts, URL-driven `page`/`status`) and `/admin/contact-messages/[id]`. Opening a message never changes its status; explicit buttons set `NEW`, `READ` or `ARCHIVED` in any direction, and the current status is never re-sent. The backend keeps the first time a message was read. There is no delete or reply. Contract: `src/utils/adminContactMessagesContract.mjs`.

### Pricing administration

Under `/admin/products`:

- **Bulk pricing** (`BulkPriceDialog`): percentage or fixed increases or decreases for selected products, the current server-side filter, or all products, scoped to all, decant or sealed variants, with rounding. Changes are previewed first and applied explicitly.
- **Price history** (`/admin/products/price-history`): the ledger of bulk, manual-edit and recovery price changes.
- **Recovery** (`RecoveryDialog`): restores a previous price as a new change, with preview and apply. Whether an item can be recovered is decided by the backend.

Product create and edit forms send explicit `{ type, volume, price }` variants and category IDs for all six types. The slug is generated by the server.

## Product Detail

- The image gallery (`src/ui/ImageSwiper.jsx`) uses Embla Carousel with a synchronized thumbnail strip.
- On screens `48rem` and wider, clicking the main image opens a lightbox with keyboard navigation (Escape, arrow keys) and background scroll lock. The lightbox closes if the viewport shrinks below that width.
- **Share** uses the Web Share API when available and falls back to copying the canonical `/products/:id` URL to the clipboard.

## Testing

Contract and regression tests use Node's built-in test runner and need no extra dependencies:

```bash
node --test "src/**/*.test.mjs"
```

They cover the frontend's integration assumptions with the backend and key UI behavior, including product filters and URL/API mapping, pagination, ProductCard presentation, the ProductForm payload, product deletion, bulk pricing, price history and recovery, the payment flow and result states, the gallery lightbox, sharing, the Contact Us form, and the admin contact messages pages. Most tests exercise pure `*.mjs` contract modules; some inspect component sources for required wiring.

Known gaps:

- `src/hooks/useNotificationSocket.test.js` and `src/services/socketService.test.js` are Jest-style tests. No Jest runner is configured, so they are not run.
- Linting is not configured. The `lint` script (`next lint`) does not work with Next.js 16, and no ESLint packages are installed.

Before a release, run the tests and a production build (`pnpm build`).

## Development Rules

- Preserve backend API contracts: paths, query parameter names and payload shapes.
- Keep the filter query contract in sync with the backend. Do not reimplement backend filtering or same-variant matching on the client.
- Use `representativeVariant` from the API for ProductCard. Do not recompute it on the client.
- Treat inventory as Product-level ml. Never treat a variant as having its own stock.
- Payment verification is backend-only. The client sends only an order id and displays the Order state returned by the API.
- Never put secrets in `NEXT_PUBLIC_*` variables, and never commit real `.env*` files.
- Keep the UI Persian and RTL.

## Deployment Notes

- The frontend and backend are built and deployed separately.
- Set `NEXT_PUBLIC_API_URL` to the production backend origin **before** `pnpm build`.
- Production authentication cookies are scoped to a parent domain shared by the frontend and API hosts, so the Next.js proxy can read them. The frontend and API must be served from subdomains of that domain; a fully cross-site setup is not supported.
- Deployment is currently a manual upload of a source archive. The archive must exclude `.env*` files, `node_modules` and `.next`, and must include `pnpm-lock.yaml`.
- Run the contract tests and `pnpm build` before every deployment.
