# MonetizationOS Fastly Proxy

[![Deploy to Fastly](https://deploy.edgecompute.app/button)](https://deploy.edgecompute.app/deploy?repository=https://github.com/MonetizationOS/fastly-proxy-worker)

A Fastly Compute service that proxies requests to an origin server and applies MonetizationOS surface decisions, behaviors, and component transformations.

This is the Fastly Compute equivalent of the Cloudflare Worker in the parent directory.

## Architecture

The worker processes requests through a pipeline:

1. **Origin Request** — Proxies the request to the configured origin server (or handles MonetizationOS custom endpoint requests)
2. **Rewrite Origin Response** — Rewrites origin URLs in headers and body to match the proxy's URL
3. **Surface Decisions** — Fetches surface decisions from the MonetizationOS API
4. **Surface Behavior** — Applies HTTP-level behaviors (headers, cookies, redirects)
5. **Surface Components** — Applies HTML-level component transformations using [`HTMLRewritingStream`](https://www.fastly.com/blog/rewriting-html-with-the-fastly-javascript-sdk) (streaming, lol-html based)

## Key Differences from Cloudflare Version

| Feature | Cloudflare | Fastly |
|---|---|---|
| Entry point | `export default { fetch() }` | `addEventListener("fetch", ...)` |
| Environment | `Env` bindings / `cloudflare:workers` | `ConfigStore` + `SecretStore` |
| HTML rewriting | `HTMLRewriter` (streaming) | `HTMLRewritingStream` (streaming) |
| Outbound fetch | Direct `fetch()` | `fetch()` with `{ backend: "..." }` |
| Language | TypeScript | JavaScript |

### HTML Rewriting Strategy

Fastly's `HTMLRewritingStream` (available since `@fastly/js-compute` v3.35.0) uses the same [lol-html](https://github.com/nicolo-ribaudo/tc39-proposal-fastly-js-sdk) engine as Cloudflare's `HTMLRewriter`, providing ~20x better performance than DOM-based solutions.

Fastly's API surface exposes `onElement()` handlers. For the common path (content modifications like before/after/prepend/append/remove + script injection), `HTMLRewritingStream` is used directly — the same lol-html engine methods as Cloudflare. Range replacements that require `onEndTag()` and text handlers (not yet exposed by Fastly's SDK) are logged as warnings and skipped.

## Prerequisites

- [Fastly CLI](https://developer.fastly.com/learning/tools/cli/)
- [Node.js](https://nodejs.org/) (see `.nvmrc` in parent directory)

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure Fastly Service

Create the following in your Fastly service:

**Backends:**
- `origin` — pointing to your origin server (e.g., `https://news.wingorigin.dev`)
- `monetization_api` — pointing to MonetizationOS API (e.g., `https://api.monetizationos.com`)

**Config Store** (named `config`):
| Key | Description |
|---|---|
| `ORIGIN_URL` | The origin URL for your website |
| `SURFACE_SLUG` | The slug for the surface you want to target |
| `AUTHENTICATED_USER_JWT_COOKIE_NAME` | Cookie name for authenticated user JWT sessions |
| `ANONYMOUS_SESSION_COOKIE_NAME` | Cookie name for anonymous sessions |
| `INJECT_SCRIPT_URL` | URL of the web components script to inject |
| `MONETIZATION_OS_HOST` | MonetizationOS API host |
| `MONETIZATION_OS_ENDPOINTS_PREFIX` | MonetizationOS API endpoints prefix |

**Secret Store** (named `secrets`):
| Key | Description |
|---|---|
| `MONETIZATION_OS_SECRET_KEY` | Your environment's Secret Key from MonetizationOS |

### 3. Local Development

The `fastly.toml` includes local server configuration with inline config store values. To run locally:

```bash
npm start
```

### 4. Deploy

```bash
npm run deploy
```
