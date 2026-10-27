# Ember & Bean — 3D multi-cuisine cafe website

An explorable 3D cafe (coffee bar, bakery case, open kitchen, dining hall, lounge, window seats,
order counter and garden patio) with interactive 3D dishes, a full conventional menu, cart,
server-priced ordering, order tracking and a protected admin panel.

> **Sample data notice.** The cafe name "Ember & Bean", story, address, phone, opening hours,
> every price, description, ingredient list and veg / non-veg flag are placeholders. Replace them
> in **Admin → Settings / Menu items** (or in `server/src/seed/menuData.js` before the first run)
> before taking real orders. The site shows "sample data" notices until you untick that setting.

---

## Contents

1. [Quick start](#quick-start)
2. [What's included](#whats-included)
3. [Project structure](#project-structure)
4. [Environment variables](#environment-variables)
5. [Database setup](#database-setup)
6. [Admin accounts](#admin-accounts)
7. [3D assets and models](#3d-assets-and-models)
8. [Payments and other external services](#payments-and-other-external-services)
9. [Testing](#testing)
10. [Production deployment](#production-deployment)
11. [API reference](#api-reference)
12. [Known limitations](#known-limitations)

---

## Quick start

Requirements: **Node.js 20+** (tested on Node 24) and npm. MongoDB is optional for local
development (see [Database setup](#database-setup)).

```bash
npm install
```

```bash
copy server\.env.example server\.env
```

(on macOS/Linux: `cp server/.env.example server/.env`). Then edit `server/.env` and set at least
`ADMIN_PASSWORD` (10+ characters) and, ideally, `JWT_SECRET`.

```bash
npm run dev
```

* Website: http://localhost:5173
* API: http://localhost:4000 (proxied through the website at `/api`)
* Admin panel: http://localhost:5173/admin — sign in with `ADMIN_EMAIL` / `ADMIN_PASSWORD`

On first start the server creates the database, seeds 14 categories and 111 sample dishes, and
creates the first admin account. The first run of the embedded database downloads the official
MongoDB server binary (about 80 MB) into `node_modules/.cache`.

## What's included

**3D cafe (home page `/`)**
* Street front with signage, awnings, patio tables, umbrellas, planters, trees and string lights;
  the doors swing open when you enter.
* Interior zones: coffee bar, bakery & dessert case, open kitchen (pizza oven, grill, wok,
  tandoor), dining hall, sofa lounge, window counter, order counter, garden patio.
* Navigation: area buttons (and keys 1–9 / 0), drag to look, scroll/pinch to zoom, right-drag or
  two fingers to pan, WASD/arrow keys to move, Q/E to turn, Backspace for the previous view.
  Smooth camera transitions; the camera is kept out of walls.
* Clickable counters open a station panel listing that station's categories and dishes; every
  dish placed in the scene is clickable and opens its 3D view.
* Preparation demos per station: beans run through the grinder and espresso + milk pour into a
  latte; a sundae is built on the cake stand; pizza toppings land and the pizza slides into the
  oven; burger assembly with flipping patties; wok tossing; tandoor skewers.
* Ambient motion: steam, grill smoke, flickering oven fire, ceiling fans, swaying plants,
  twinkling string lights. All of it stops when "reduce motion" is on (follows the OS setting).
* Quality tiers (low / medium / high) are picked from the device and can be changed in the HUD;
  resolution also adapts to the measured frame rate. Rendering pauses while a dialog is open.
* If WebGL is unavailable or the scene fails, visitors get a clear message and a link to the menu.

**Food in 3D**
* 51 procedural 3D dish model types with parameters (patty type, toppings, sauce, glaze, drink,
  glass, garnish…) covering all 111 sample dishes: burgers, pizzas, pastas, noodles, momos, thali,
  biryani, dosa, wraps, fries, croissants, cakes, sundaes, coffees, chai, shakes, juices and more,
  each built from named parts.
* Viewer: drag to rotate, zoom (buttons, wheel, pinch, keyboard), auto-rotate, reset, replay the
  preparation animation (layers dropping into a burger, toppings popping onto a pizza, coffee and
  milk pouring), and **Show ingredients**, which explodes the dish into labelled layers.
* Menu cards use snapshots rendered from the same 3D models (one hidden canvas renders them one
  at a time), unless the admin uploaded a photo.

**Ordering**
* Menu page with search, category filter, veg / non-veg filter (URL-synced), sizes and
  customisation groups (single/multi choice, required, maximum selections).
* Cart persisted in the browser; dine-in (optional table number) or takeaway (packaging fee).
* Checkout validates input in the browser **and** on the server. Totals, tax and fees are always
  calculated by the server from the database; prices sent by the browser are ignored.
* Unique order numbers (`EB-YYMMDD-NNNN`, atomic per-day counter), confirmation page with live
  status tracking. Only the device that placed an order (holding its secret token) can view it.

**Admin (`/admin`)**
* Dashboard (today's orders and revenue, queue counts), order list with filters/search/paging,
  order detail with status workflow (pending → confirmed → preparing → ready → completed, or
  cancelled), payment marking and history.
* Dish editor: name, description, categories (a dish can be in several), price, veg flag, tags,
  ingredients, sizes, customisation groups, related dishes, availability/featured/signature,
  photo upload, and 3D model choice (built-in model + parameters, or upload/link a `.glb`) with
  a live 3D preview.
* Categories (with the 3D station they appear at), cafe settings (business details, hours, tax
  rate, packaging fee, ordering on/off), team accounts with `admin` and `staff` roles.

**Security**
* Admin sessions are signed JWTs in an `httpOnly`, `SameSite=Strict` cookie; every state-changing
  admin request also needs an `X-Requested-With` header (CSRF defence in depth).
* Role checks on every admin endpoint (staff: orders + availability only).
* bcrypt password hashing, constant-time login responses, login and order rate limits.
* All request bodies and query strings are validated with zod (unknown query keys rejected).
* Uploads are checked by file signature (JPEG/PNG/WebP, binary glTF), size-limited and stored
  under random names.
* Helmet security headers and a strict Content-Security-Policy; secrets live only in
  `server/.env`, never in the client bundle.

## Project structure

```
package.json            npm workspaces + top-level scripts
client/                 React 19 + Vite + React Three Fiber + drei + GSAP + zustand
  public/draco/         Draco decoder (from three.js) for compressed .glb files
  src/three/kit.js      cached geometries, materials and procedural canvas textures
  src/three/food/       dish model library (builders/), FoodModel, FoodViewer, thumbnails
  src/three/cafe/       building, furniture, stations, interior, outdoor, scene + navigation
  src/pages/            Experience (3D), Menu, Product, Checkout, Order, About, admin/*
  src/store/            cart, menu and UI state
server/                 Express 5 + Mongoose 9 + zod
  src/models/           Category, Product, Order, AdminUser, Settings, Counter
  src/routes/           public.js, auth.js, admin.js, uploads.js
  src/services/         pricing (server-side totals), orders, serializers
  src/seed/menuData.js  the central sample menu catalog
  tests/api.test.js     API tests (in-memory MongoDB)
```

## Environment variables

All server settings live in `server/.env` (template: `server/.env.example`).

| Variable | Default | Purpose |
| --- | --- | --- |
| `API_PORT` / `PORT` | `4000` | Port of the API (and of the built site in production). `API_PORT` wins. |
| `NODE_ENV` | `development` | Set to `production` when deploying. |
| `MONGODB_URI` | *(empty)* | MongoDB connection string. Empty = embedded MongoDB (dev only). |
| `EMBEDDED_MONGO` | `true` outside production | Start a local MongoDB when `MONGODB_URI` is empty. |
| `EMBEDDED_MONGO_DBPATH` | `.data/db` | Where embedded MongoDB keeps data (relative to `server/`). |
| `EMBEDDED_MONGO_PORT` | `27018` | Port for the embedded MongoDB. |
| `JWT_SECRET` | random per start in dev | **Required in production**, 32+ random characters. |
| `JWT_EXPIRES_IN` | `8h` | Admin session length. |
| `COOKIE_SECURE` | `true` in production | Send cookies over HTTPS only (also enables `upgrade-insecure-requests`). |
| `CLIENT_ORIGIN` | `http://localhost:5173` | Allowed CORS origin(s), comma separated. |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | — | First admin, created at startup when no admin exists. |
| `UPLOAD_DIR` | `uploads` | Folder for uploaded images and models. |
| `MAX_IMAGE_MB`, `MAX_MODEL_MB` | `3`, `20` | Upload size limits. |
| `AUTO_SEED` | `true` | Seed the sample menu when the database has no categories. |
| `TRUST_PROXY` | `0` | Number of reverse proxies in front (for correct client IPs). |

Client: `API_ORIGIN` (optional, dev only) changes where Vite proxies `/api` and `/uploads`.

Business settings (name, address, hours, tax rate, packaging fee, table count, accepting orders)
are stored in the database and edited in **Admin → Settings**, not in env variables.

## Database setup

The app uses **MongoDB** through Mongoose. Three options:

1. **Embedded (default for development).** Leave `MONGODB_URI` empty. The server starts a real
   `mongod` process via `mongodb-memory-server`, keeping data in `server/.data/db`, so it survives
   restarts. Not for production.
2. **Local MongoDB.** Install MongoDB Community Server, then set
   `MONGODB_URI=mongodb://127.0.0.1:27017/ember_and_bean`.
3. **MongoDB Atlas.** Create a cluster and a database user, allow your server's IP, and set
   `MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>/ember_and_bean?retryWrites=true&w=majority`.

Collections and their main fields:

| Collection | Contents |
| --- | --- |
| `categories` | `name`, `slug` (unique), `description`, `station` (3D counter), `sortOrder`, `isActive` |
| `products` | `name`, `slug` (unique), `categories[]`, `basePrice` (paise), `isVeg`, `tags[]`, `ingredients[]`, `sizes[{key,label,priceDelta}]`, `options[{key,label,type,required,maxChoices,choices[]}]`, `image`, `model{kind,key,params,url,scale}`, `isAvailable`, `isFeatured`, `isSignature`, `sortOrder`, `related[]` |
| `orders` | `orderNumber` (unique), `accessTokenHash`, `customer{name,phone,email}`, `orderType`, `tableNumber`, `notes`, `items[]` (name/size/options/unit price snapshot), `subtotal`, `taxRateBps`, `tax`, `packagingFee`, `total`, `status`, `statusHistory[]`, `paymentStatus` |
| `adminusers` | `email` (unique), `name`, `passwordHash`, `role` (`admin`/`staff`), `isActive`, `lastLoginAt` |
| `settings` | single document `cafe` with business details and pricing rules |
| `counters` | per-day sequences used for order numbers |

All money is stored as integers in minor units (paise).

Seeding commands:

```bash
npm run seed
```

seeds the sample menu only if there are no categories, and

```bash
npm run seed -- --reset
```

**deletes all categories and dishes** and re-inserts the sample menu (orders and accounts are kept).

## Admin accounts

* The first admin comes from `ADMIN_EMAIL` / `ADMIN_PASSWORD` in `server/.env`. After the first
  start you can remove `ADMIN_PASSWORD` from the file.
* Create more accounts in **Admin → Team**, or from the command line (also resets a password):

```bash
npm run create-admin -- --email you@example.com --password "a long password" --role admin
```

## 3D assets and models

**Everything in the 3D scene is generated in code**: the building, furniture, kitchen equipment,
food and textures (wood, tiles, brick, marble, chalkboards, signage) are built from three.js
geometry and canvas-drawn textures at runtime. No third-party 3D model, texture, HDRI or font
file is downloaded, so there are no external asset licences to track. Fonts (Fraunces, Inter) are
bundled from the `@fontsource` npm packages (SIL Open Font License). The Draco decoder in
`client/public/draco` comes from three.js (MIT).

**Limitation:** procedural models are stylised rather than photo-real. To use real models:

* Per dish: **Admin → Menu items → Edit → 3D model → GLB file**. Upload a `.glb` (or link an
  `https://` URL). Models are auto-scaled and centred; Draco-compressed files are supported. If a
  file fails to load, the built-in model for the dish's category is shown instead.
* Recommended: ≤ 2–5 MB per dish, ≤ 50k triangles, 1024–2048 px textures (KTX2/WebP), origin
  at the base of the dish.
* Licensing: only upload models you created or have a licence that permits commercial use on a
  website (for example CC0, or a purchased commercial licence). Keep a record of the source,
  licence and any required attribution for each file. Do not assume a downloaded model is free
  for commercial use.
* Scene furniture/equipment are React components in `client/src/three/cafe/`. To swap one for a
  GLB, load it with drei's `useGLTF` in place of the component (e.g. `EspressoMachine` in
  `Stations.jsx`).

Photos: uploaded dish photos (JPEG/PNG/WebP) replace the 3D snapshot on menu cards; the 3D view
remains available on the dish page.

## Payments and other external services

* **Online payment is not implemented.** Orders are "pay at the counter" (cash/card/UPI) and staff
  mark them paid in the admin panel. To add online payments, integrate a provider (for example
  Stripe or Razorpay) in **test mode first**: create the payment intent/order on the server from
  the server-calculated total, confirm via the provider's webhook, and only then mark the order
  paid. Keys go in `server/.env`, never in the client.
* Not included (needs your accounts/decisions): email/SMS order notifications, a map embed for the
  address, analytics, a CDN or object storage for uploads (uploads are stored on the server's
  disk in `server/uploads`; use persistent storage when deploying).

## Testing

API tests (in-memory MongoDB, 19 tests: menu, filters, injection attempts, pricing, validation,
order creation and access, order-number uniqueness, unavailable dishes, admin auth, roles, CSRF,
uploads):

```bash
npm test
```

Production build check:

```bash
npm run build
```

Manual test checklist:

* Home: intro → **Enter the cafe**, move between areas with the buttons (and keys 1–9), drag/zoom.
* Click a counter or hotspot → station panel; **▶ demo** button plays the preparation animation.
* Click a dish in the scene or a menu card → 3D viewer: rotate, zoom, replay, show ingredients.
* Menu: search, category chips, veg/non-veg filter, URL updates.
* Add dishes with sizes/options → cart → checkout validation → place order → confirmation page.
* Admin: sign in (wrong password rejected), move an order through statuses, mark paid, toggle a
  dish's availability, edit a price (public menu updates), open the dish editor's 3D preview.
* Upload a `.glb` and attach it to a dish (it renders); point a dish at a missing `.glb` (the
  built-in model is shown instead).
* Phone-sized screens: area bar at the bottom, station panel as a bottom sheet.
* Production build served by `npm start` under the Content-Security-Policy: no console errors.

## Production deployment

```bash
npm install
```

```bash
npm run build
```

```bash
npm start
```

`npm start` serves the built site and the API from one Express process on `API_PORT`/`PORT`.
Set `NODE_ENV=production`, `MONGODB_URI`, `JWT_SECRET`, `COOKIE_SECURE=true` (behind HTTPS),
`CLIENT_ORIGIN` (your domain) and `TRUST_PROXY=1` when behind a reverse proxy. Keep
`server/uploads` on persistent storage.

### Deploying to Vercel

The repo is Vercel-ready (`vercel.json` builds the client to `dist`, and `api/index.js`
runs the Express API as a serverless function).

1. Create a free **MongoDB Atlas** cluster (Vercel cannot run the embedded database). Add a
   database user and, under *Network Access*, allow `0.0.0.0/0` (Vercel's IPs change).
2. In Vercel: **Add New → Project → import this GitHub repo**. Leave the framework preset as
   "Other"; the settings come from `vercel.json`.
3. Add these **Environment Variables** before deploying:

| Name | Value |
| --- | --- |
| `MONGODB_URI` | your Atlas string, e.g. `mongodb+srv://user:pass@cluster/ember_and_bean?retryWrites=true&w=majority` |
| `JWT_SECRET` | 48+ random characters (`node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`) |
| `ADMIN_EMAIL` | your admin sign-in email |
| `ADMIN_PASSWORD` | a strong password (10+ characters); the first request creates the account and seeds the sample menu |

4. Deploy, then sign in at `https://<your-domain>/admin`.

Serverless limits: **file uploads are disabled** (no persistent disk), so in the dish editor paste
an `https://` image or `.glb` URL instead. For real uploads, add object storage such as Vercel
Blob or S3. Everything else works unchanged.

## API reference

Public:

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/api/health` | DB status |
| GET | `/api/info` | Public cafe settings |
| GET | `/api/categories` | Active categories with dish counts |
| GET | `/api/products?category=&q=&veg=veg\|non-veg&station=&featured=` | Menu |
| GET | `/api/products/:slug` | Dish + related dishes |
| POST | `/api/orders/quote` | `{ items, orderType }` → server-calculated totals |
| POST | `/api/orders` | Place order → `{ order, accessToken }` (rate limited) |
| GET | `/api/orders/:orderNumber` | Requires `X-Order-Token` header |

Auth: `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`.

Admin (cookie session + `X-Requested-With: XMLHttpRequest` on writes): `/api/admin/summary`,
`/api/admin/orders` (+ `/:id`, `/:id/status`, `/:id/payment`), `/api/admin/products` (+ `/:id`),
`/api/admin/categories` (+ `/:id`), `/api/admin/uploads/image|model`, `/api/admin/settings`,
`/api/admin/users` (+ `/:id`).

Cart item shape: `{ productId, quantity, size?, options?: { [groupKey]: choiceKey | choiceKey[] } }`.

## Known limitations

* 3D models are procedural and stylised (see above); no photographic textures or real scans.
* No online payment, notifications or customer accounts (orders are tracked per device).
* Order status updates reach the customer by polling every 15 s, not push.
* The embedded MongoDB is for development only.
* Accessibility: all essential tasks (menu, ordering, admin) work without the 3D scene and with the
  keyboard; the 3D scene itself is supplementary and offers keyboard shortcuts plus area buttons.
